const ENV = "prod"; // "prod" or "test"

import { db, auth, rtdb } from "./firebase.js";

import {
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp as firestoreTimestamp,
  where,
  doc,
  updateDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";


import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  ref,
  onValue,
  set,
  remove,
  onDisconnect,
  serverTimestamp as rtdbTimestamp,
  push
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

const OWNER_UID = "5tRQ4TtTNPMV1rF4ZjeDUJGmMXJ2";
const OWNER_NAME = "wafer";

// -------------------- Preferences --------------------
let isMuted = localStorage.getItem("kp_muted") === "true";
let notificationVolume = parseFloat(localStorage.getItem("kp_volume"));
if (Number.isNaN(notificationVolume)) notificationVolume = 0.5;

function sanitizeUsername(name) {
  const cleaned = (name ?? "").trim().replace(/\s+/g, " ");
  return cleaned ? cleaned.slice(0, 24) : "";
}

function makeAnonName() {
  const n = Math.floor(Math.random() * 10000);
  return `Anonymous#${String(n).padStart(4, "0")}`;
}

let currentUsername = sanitizeUsername(localStorage.getItem("kp_username")) || makeAnonName();
if (!localStorage.getItem("kp_username")) {
  localStorage.setItem("kp_username", currentUsername);
}

function setupPresence(user) {
  const connectedRef = ref(rtdb, ".info/connected");

  const userRef = ref(rtdb, "/status/" + user.uid);
  const connectionsRef = ref(rtdb, "/status/" + user.uid + "/connections");
  const profileRef = ref(rtdb, "/status/" + user.uid + "/profile");

  let thisConnRef = null;
  let heartbeatTimer = null;

  onValue(connectedRef, (snap) => {
    if (snap.val() !== true) return;

    thisConnRef = push(connectionsRef);

    onDisconnect(thisConnRef).remove();
    set(thisConnRef, {
      lastSeen: rtdbTimestamp()
    });

    // heartbeat every 20s
    heartbeatTimer = setInterval(() => {
      set(thisConnRef, {
        lastSeen: rtdbTimestamp()
      });
    }, 20_000);

    // user profile
    set(profileRef, {
      username: currentUsername,
      last_changed: rtdbTimestamp()
    });

    // if this was the last connection, remove the user node
    onDisconnect(userRef).update({
      connections: null
    });
  });

  window.addEventListener("beforeunload", () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
  });
}




const onlineCountEl = document.getElementById("online-count");
const onlineUsersList = document.getElementById("online-users");
const statusRef = ref(rtdb, "/status");

onValue(statusRef, (snapshot) => {
  const users = snapshot.val() || {};

  const onlineNames = [];

  for (const uid of Object.keys(users)) {
    const u = users[uid];
    const hasConnections = u?.connections && Object.keys(u.connections).length > 0;
    if (!hasConnections) continue;

    const name = u?.profile?.username;
    if (name) onlineNames.push(name);
  }

  const uniqueNames = [...new Set(onlineNames)];

  if (onlineCountEl) onlineCountEl.textContent = `(${uniqueNames.length})`;

  if (onlineUsersList) {
    onlineUsersList.innerHTML = "";
    uniqueNames.forEach((name) => {
      const li = document.createElement("li");
      li.textContent = name;
      onlineUsersList.appendChild(li);
    });
  }
});


// -------------------- Chat DOM --------------------
const messagesEl = document.getElementById("messages");
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");

const replyBar = document.getElementById("replyBar");
const replyToNameEl = document.getElementById("replyToName");
const replyToSnippetEl = document.getElementById("replyToSnippet");
const replyCancelBtn = document.getElementById("replyCancel");

let replyTo = null; // { id, uid, username, textSnippet }

// -------------------- Firestore Queries --------------------
const MESSAGES_COLLECTION =
  ENV === "test" ? "staging" : "messages";

const messagesRef = collection(db, MESSAGES_COLLECTION);

const recentQ = query(
  messagesRef,
  orderBy("createdAt", "desc"),
  limit(60)
);

let pinnedDocs = [];
let recentDocs = [];
let lastRenderedIds = "";

// -------------------- Time helpers --------------------
function toDateSafe(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  if (typeof ts === "number") return new Date(ts);
  return null;
}

function formatTimeHHMM(d) {
  if (!d) return "…";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatFullDateTime(d) {
  if (!d) return "";
  return d.toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

// -------------------- Owner helpers --------------------
function isOwnerUser() {
  const u = auth.currentUser;
  return !!u && u.uid === OWNER_UID;
}

function canDeleteMessage(m) {
  const u = auth.currentUser;
  if (!u) return false;
  return u.uid === OWNER_UID || m?.uid === u.uid;
}

// -------------------- Jump-to + highlight --------------------
function jumpToMessage(messageId) {
  const el = document.getElementById(`msg-${messageId}`);
  if (!el) return;

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("replyTargetFlash");
  window.setTimeout(() => el.classList.remove("replyTargetFlash"), 900);
}

// -------------------- Context menu --------------------
let ctxMenuEl = null;

function ensureContextMenu() {
  if (ctxMenuEl) return ctxMenuEl;

  const el = document.createElement("div");
  el.id = "kp-context-menu";
  el.hidden = true;
  el.setAttribute("role", "menu");
  document.body.appendChild(el);

  document.addEventListener("click", () => hideContextMenu());
  document.addEventListener("scroll", () => hideContextMenu(), true);
  window.addEventListener("resize", () => hideContextMenu());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideContextMenu();
  });

  ctxMenuEl = el;
  return ctxMenuEl;
}

function hideContextMenu() {
  if (!ctxMenuEl) return;
  ctxMenuEl.hidden = true;
  ctxMenuEl.innerHTML = "";
}

function placeContextMenuAt(x, y) {
  if (!ctxMenuEl) return;

  const pad = 8;
  ctxMenuEl.style.left = "0px";
  ctxMenuEl.style.top = "0px";
  ctxMenuEl.hidden = false;

  const rect = ctxMenuEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const clampedX = Math.min(x, vw - rect.width - pad);
  const clampedY = Math.min(y, vh - rect.height - pad);

  ctxMenuEl.style.left = Math.max(pad, clampedX) + "px";
  ctxMenuEl.style.top = Math.max(pad, clampedY) + "px";
}

function addMenuItem({ label, icon, danger, onClick, disabled }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "kp-menu-item" +
    (danger ? " danger" : "") +
    (disabled ? " disabled" : "");
  btn.setAttribute("role", "menuitem");
  btn.disabled = !!disabled;

  btn.innerHTML =
    `${icon ? `<span class="kp-menu-ico">${icon}</span>` : ""}` +
    `<span class="kp-menu-label">${label}</span>`;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (disabled) return;
    hideContextMenu();
    onClick?.();
  });

  ctxMenuEl.appendChild(btn);
}

function addMenuDivider() {
  const div = document.createElement("div");
  div.className = "kp-menu-divider";
  ctxMenuEl.appendChild(div);
}

async function copyText(text) {
  const t = String(text ?? "");
  if (!t) return;

  try {
    await navigator.clipboard.writeText(t);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch {}
    document.body.removeChild(ta);
  }
}

function renderReplyComposerUI() {
  if (!replyBar) return;

  if (!replyTo) {
    replyBar.hidden = true;
    return;
  }

  replyBar.hidden = false;
  replyToNameEl.textContent = replyTo.username ? `@${replyTo.username}` : "@unknown";
  replyToSnippetEl.textContent = replyTo.textSnippet
    ? replyTo.textSnippet
    : "(no preview)";
}


replyCancelBtn?.addEventListener("click", () => {
  replyTo = null;
  renderReplyComposerUI();
});

async function banUserByUid(targetUid, reason = "") {
  if (!targetUid) return;

  // doc id = uid
  await setDoc(doc(db, "bans", targetUid), {
    reason: reason || "banned",
    createdAt: firestoreTimestamp(),
    createdBy: auth.currentUser?.uid ?? null
  });
}

function openMessageContextMenu(docSnap, m, x, y) {
  ensureContextMenu();
  ctxMenuEl.innerHTML = "";

  const isOwner = isOwnerUser();
  const isOwnMsg = auth.currentUser && m?.uid === auth.currentUser.uid;
  const canDelete = canDeleteMessage(m); // owner OR own msg :contentReference[oaicite:3]{index=3}

  if (canDelete) {
    addMenuItem({
      label: "Delete",
      danger: true,
      onClick: async () => {
        if (!confirm("Delete this message?")) return;
        await deleteDoc(doc(db, "messages", docSnap.id));
      }
    });

    addMenuDivider();
  }

  addMenuItem({
    label: "Copy Text",
    onClick: () => copyText(m?.text ?? "")
  });

  addMenuItem({
    label: "Reply",
    onClick: () => {
      replyTo = {
        id: docSnap.id,
        uid: m?.uid ?? null,
        username: (m?.username ?? "").trim() || null,
        textSnippet: String(m?.text ?? "").trim().slice(0, 80)
      };
      renderReplyComposerUI();
      input?.focus();
    }
  });

  if (isOwner && m?.uid && m.uid !== OWNER_UID) {
    addMenuDivider();

    addMenuItem({
      label: "Ban",
      danger: true,
      onClick: async () => {
        const reason = prompt("Ban reason? (optional)", "spam") ?? "";
        if (!confirm(`Ban ${m.username ?? "this user"}?`)) return;
        await banUserByUid(m.uid, reason);
      }
    });
  }

  placeContextMenuAt(x, y);
}

// -------------------- Message rendering --------------------
function buildMessageEl(docSnap) {
  const m = docSnap.data();
  const id = docSnap.id;

  const wrap = document.createElement("div");
  wrap.className = "chat-message";
  wrap.dataset.id = id;
  wrap.dataset.msgid = id;
  wrap.id = `msg-${id}`;

  if (m.replyToId) {
    const replyBlock = document.createElement("div");
    replyBlock.className = "replyBlock";
    replyBlock.tabIndex = 0;

    const who = m.replyToUsername ? `@${m.replyToUsername}` : "@unknown";
    const snippet = m.replyToText ? m.replyToText : "(message not available)";

    replyBlock.innerHTML = `
      <div class="replyMeta">↩ replying to <span class="replyWho">${who}</span></div>
      <div class="replySnippet"></div>
    `;
    replyBlock.querySelector(".replySnippet").textContent = snippet;

    replyBlock.addEventListener("click", () => jumpToMessage(m.replyToId));
    wrap.appendChild(replyBlock);
  }

  const headerRow = document.createElement("div");
  headerRow.className = "chat-message-header";

  const sender = document.createElement("span");
  sender.className = "senderInfo";
  sender.textContent = m.username ?? "unknown";

  if (m.uid === OWNER_UID && (m.username ?? "").toLowerCase() === OWNER_NAME) {
    sender.classList.add("ownerName");
  }

  const created = toDateSafe(m.createdAt);

  const timeSmall = document.createElement("span");
  timeSmall.className = "msgTime";
  timeSmall.textContent = formatTimeHHMM(created);

  const isPinned = !!m.pinned;
  if (isPinned) {
    const pinBadge = document.createElement("span");
    pinBadge.className = "pinBadge";
    pinBadge.textContent = "📌";
    headerRow.appendChild(pinBadge);
  }

  headerRow.appendChild(sender);
  headerRow.appendChild(timeSmall);

  const text = document.createElement("div");
  text.className = "messageText";
  text.textContent = m.text ?? "";

  const fullDate = document.createElement("div");
  fullDate.className = "msgFullDate";
  fullDate.textContent = formatFullDateTime(created);
  fullDate.hidden = true;

  wrap.appendChild(headerRow);
  wrap.appendChild(text);
  wrap.appendChild(fullDate);

  wrap.addEventListener("click", () => {
    fullDate.hidden = !fullDate.hidden;
    document.querySelectorAll(".msgFullDate").forEach((el) => {
      if (el !== fullDate) el.hidden = true;
    });
  });

  wrap.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openMessageContextMenu(docSnap, m, e.clientX, e.clientY);
  });

  return wrap;
}

function mergeDocs(pinned, recent) {
  const map = new Map();
  pinned.forEach((d) => map.set(d.id, d));

  const recentAsc = [...recent].reverse();
  recentAsc.forEach((d) => {
    if (!map.has(d.id)) map.set(d.id, d);
  });

  return Array.from(map.values());
}

function renderMessages() {
  if (!messagesEl) return;

  const docsAsc = [...recentDocs].reverse(); // oldest → newest

  const shouldStickToBottom =
    messagesEl.scrollTop + messagesEl.clientHeight >=
    messagesEl.scrollHeight - 24;

  messagesEl.innerHTML = "";
  docsAsc.forEach((docSnap) => {
    messagesEl.appendChild(buildMessageEl(docSnap));
  });

  if (shouldStickToBottom) {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}


onSnapshot(recentQ, (snapshot) => {
  recentDocs = snapshot.docs;

  // notification sound only for incoming updates (not local writes)
  if (!snapshot.metadata.hasPendingWrites && !isMuted && snapshot.docChanges().length > 0) {
    const audio = new Audio("pages/notification.mp3");
    audio.volume = notificationVolume;
    audio.play().catch(() => {});
  }

  renderMessages();
});

// -------------------- Moderation --------------------
const BLOCKED_TERMS = [
  "rape",
  "nigger",
  "kike",
  "tranny",
  "faggot",
  "retard",
  "coon",
  "dyke"
];

const BLOCK_MATCH_WHOLE_WORDS = true;

// 2) Spam rules
const SPAM_WINDOW_MS = 30_000;          // 30 seconds
const SPAM_MAX_MSGS_IN_WINDOW = 5;      // more than 5 => cooldown
const STRIKE_RESET_MS = 60 * 60 * 1000; // 1 hour

const COOLDOWN_LADDER_SECONDS = [60, 600, 1800, 3600, 7200, 14400];

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeForModeration(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function buildBlockedRegexList(terms) {
  return (terms || [])
    .map((t) => normalizeForModeration(t))
    .filter(Boolean)
    .map((t) => {
      const escaped = escapeRegex(t);
      if (BLOCK_MATCH_WHOLE_WORDS) {
        return new RegExp(`\\b${escaped}\\b`, "i");
      }
      return new RegExp(escaped, "i");
    });
}

const BLOCKED_REGEXES = buildBlockedRegexList(BLOCKED_TERMS);

function containsBlockedTerm(text) {
  const norm = normalizeForModeration(text);
  return BLOCKED_REGEXES.some((re) => re.test(norm));
}

function rlKey(uid) {
  return `kp_rl_${uid || "anon"}`;
}

function loadRlState(uid) {
  try {
    const raw = localStorage.getItem(rlKey(uid));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object"
      ? parsed
      : { sent: [], strikes: 0, strikeStart: 0, cooldownUntil: 0 };
  } catch {
    return { sent: [], strikes: 0, strikeStart: 0, cooldownUntil: 0 };
  }
}

function saveRlState(uid, state) {
  try {
    localStorage.setItem(rlKey(uid), JSON.stringify(state));
  } catch {}
}

// Returns { ok: boolean, reason?: string, cooldownUntil?: number }
function checkAndUpdateRateLimit(uid) {
  const now = Date.now();
  const st = loadRlState(uid);

  if (!st.strikeStart || now - st.strikeStart >= STRIKE_RESET_MS) {
    st.strikes = 0;
    st.strikeStart = now;
  }

  if (st.cooldownUntil && now < st.cooldownUntil) {
    saveRlState(uid, st);
    return {
      ok: false,
      reason: "cooldown",
      cooldownUntil: st.cooldownUntil
    };
  }

  const sent = Array.isArray(st.sent) ? st.sent : [];
  const pruned = sent.filter((t) => typeof t === "number" && now - t < SPAM_WINDOW_MS);

  pruned.push(now);

  if (pruned.length > SPAM_MAX_MSGS_IN_WINDOW) {
    st.strikes += 1;

    const idx = Math.min(st.strikes - 1, COOLDOWN_LADDER_SECONDS.length - 1);
    const cooldownSeconds =
      idx >= 0 ? COOLDOWN_LADDER_SECONDS[idx] : COOLDOWN_LADDER_SECONDS[0];

    st.cooldownUntil = now + cooldownSeconds * 1000;

    st.sent = [];
    saveRlState(uid, st);

    return {
      ok: false,
      reason: "rate_limited",
      cooldownUntil: st.cooldownUntil
    };
  }

  st.sent = pruned;
  st.cooldownUntil = 0;
  saveRlState(uid, st);

  return { ok: true };
}

function formatRemaining(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${String(r).padStart(2, "0")}s` : `${r}s`;
}


// -------------------- Send message (form submit) --------------------
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!input) return;

  const textVal = input.value.trim();
  if (!textVal) return;

  const u = auth.currentUser;
  if (!u) {
    alert("Not signed in yet — try again in a second.");
    return;
  }

  if (containsBlockedTerm(textVal)) {
    alert("That message contains a blocked word/phrase. Please edit it. This has been logged to the website owner.");
    return;
  }

  const rl = checkAndUpdateRateLimit(u.uid);
  if (!rl.ok) {
    const until = rl.cooldownUntil ?? 0;
    const remaining = formatRemaining(until - Date.now());
    alert(
      rl.reason === "cooldown"
        ? `You're on cooldown. Try again in ${remaining}.`
        : `You're sending messages too fast. Cooldown: ${remaining}.`
    );
    return;
  }

  try {
    const payload = {
      uid: u.uid,
      username: currentUsername,
      text: textVal,
      createdAt: firestoreTimestamp(),
      pinned: false,
      pinnedAt: null
    };

    if (replyTo) {
      payload.replyToId = replyTo.id;
      payload.replyToUid = replyTo.uid ?? null;
      payload.replyToUsername = replyTo.username ?? null;
      payload.replyToText = replyTo.textSnippet ?? null;
    }

    await addDoc(messagesRef, payload);

    input.value = "";
    replyTo = null;
    renderReplyComposerUI();
  } catch (err) {
    alert(err?.message ?? String(err));
  }
});


// -------------------- Settings modal + owner login --------------------
window.addEventListener("DOMContentLoaded", () => {
  const settingsBtn = document.getElementById("chat-settings");
  const settingsModal = document.getElementById("settings-modal");
  const settingsClose = document.getElementById("settings-close");
  const usernameInput = document.getElementById("username-input");
  const usernameSave = document.getElementById("username-save");
  const muteToggle = document.getElementById("mute-toggle");
  const volumeSlider = document.getElementById("volume-slider");
  const loginBtn = document.getElementById("owner-login-btn");
  const logoutBtn = document.getElementById("owner-logout-btn");
  const emailIn = document.getElementById("owner-email");
  const passIn = document.getElementById("owner-password");
  const onlineCountContainer = document.querySelector(".comments-status");

  if (usernameInput) usernameInput.value = currentUsername;
  if (muteToggle) muteToggle.checked = isMuted;
  if (volumeSlider) volumeSlider.value = notificationVolume;

  settingsBtn?.addEventListener("click", () => {
    if (settingsModal) settingsModal.hidden = false;
  });
  settingsClose?.addEventListener("click", () => {
    if (settingsModal) settingsModal.hidden = true;
  });

  onlineCountContainer?.addEventListener("click", () => {
    if (!onlineUsersList) return;
    const isHidden = onlineUsersList.style.display === "none" || onlineUsersList.style.display === "";
    onlineUsersList.style.display = isHidden ? "block" : "none";
  });

  usernameSave?.addEventListener("click", () => {
    if (!usernameInput) return;
    currentUsername = sanitizeUsername(usernameInput.value) || makeAnonName();
    localStorage.setItem("kp_username", currentUsername);

    if (auth.currentUser) {
      set(ref(rtdb, "/status/" + auth.currentUser.uid + "/profile"), {
        username: currentUsername,
        last_changed: rtdbTimestamp()
      });
    }


    if (settingsModal) settingsModal.hidden = true;
  });

  muteToggle?.addEventListener("change", (e) => {
    isMuted = !!e.target.checked;
    localStorage.setItem("kp_muted", String(isMuted));
  });

  volumeSlider?.addEventListener("input", (e) => {
    notificationVolume = parseFloat(e.target.value);
    if (Number.isNaN(notificationVolume)) notificationVolume = 0.5;
    localStorage.setItem("kp_volume", String(notificationVolume));
  });

  loginBtn?.addEventListener("click", async () => {
    try {
      // remove presence for current user before switching
      if (auth.currentUser) {
        await remove(ref(rtdb, "/status/" + auth.currentUser.uid));
      }
      await signInWithEmailAndPassword(auth, emailIn.value, passIn.value);
      emailIn.value = "";
      passIn.value = "";
    } catch (err) {
      alert(err?.message ?? String(err));
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    try {
      if (auth.currentUser) {
        await remove(ref(rtdb, "/status/" + auth.currentUser.uid));
      }
      await signOut(auth);
      await signInAnonymously(auth);
    } catch (err) {
      alert(err?.message ?? String(err));
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      signInAnonymously(auth);
      return;
    }

    // presence
    setTimeout(() => setupPresence(user), 500);

    // owner login UI toggle
    const isOwner = user.uid === OWNER_UID;
    const loginSection = document.getElementById("owner-login-section");
    const statusSection = document.getElementById("owner-status-section");
    if (loginSection) loginSection.hidden = isOwner;
    if (statusSection) statusSection.hidden = !isOwner;

    // render reply bar state + rerender (owner controls)
    renderReplyComposerUI();
    renderMessages();
  });

});