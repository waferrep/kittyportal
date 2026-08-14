import { db } from "../firebase.js";
import {
    doc,
    getDoc,
    collection,
    query,
    orderBy,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

function setupConfetti() {
    const button = document.getElementById("confetti-btn");
    const canvas = document.getElementById("confetti-canvas");
    const clownSound = document.getElementById("clown-sound");

    if (!button || !canvas) return;

    const ctx = canvas.getContext("2d");
    let confettiPieces = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    function createConfetti(count = 40) {
        const colors = ["#fde132", "#009bde", "#ff6b00", "#ff2d5d", "#7cff00"];
        for (let i = 0; i < count; i++) {
            confettiPieces.push({
                x: Math.random() * canvas.width,
                y: -10,
                r: Math.random() * 6 + 2,
                d: Math.random() * 40,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncremental: Math.random() * 0.07 + 0.05,
                tiltAngle: 0,
                alpha: 1
            });
        }
    }

    function drawConfetti() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        confettiPieces.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            ctx.stroke();
        });
        ctx.globalAlpha = 1;
    }

    function updateConfetti() {
        confettiPieces = confettiPieces.filter(p => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
            p.x += Math.sin(p.d);
            p.tilt = Math.sin(p.tiltAngle) * 15;
            p.alpha -= 0.0005;
            return p.alpha > 0;
        });
    }

    function animate() {
        drawConfetti();
        updateConfetti();
        requestAnimationFrame(animate);
    }

    animate();

    button.addEventListener("click", () => {
        createConfetti(40);
        if (clownSound) {
            clownSound.currentTime = 0;
            clownSound.play();
        }
    });
}

function setupCustomAudioPlayers() {
    const players = document.querySelectorAll(".compact-audio");

    players.forEach(player => {
        const playButton =
            player.querySelector(".snippet-play") ||
            player.querySelector("#snippet-play");

        const progressContainer =
            player.querySelector(".compact-progress") ||
            player.querySelector("#snippet-progress-container");

        const progressBar =
            player.querySelector(".compact-progress-bar") ||
            player.querySelector("#snippet-progress");

        const currentTimeSpan =
            player.querySelector(".snippet-current") ||
            player.querySelector("#snippet-current");

        const totalTimeSpan =
            player.querySelector(".snippet-total") ||
            player.querySelector("#snippet-total");

        const volumeSlider =
            player.querySelector(".snippet-volume") ||
            player.querySelector("#snippet-volume");

        const audio =
            player.querySelector(".hidden-audio") ||
            player.querySelector("#snippet-audio");

        if (!audio || !playButton) return;

        function formatTime(seconds) {
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60);
            return `${min}:${sec < 10 ? "0" : ""}${sec}`;
        }

        playButton.addEventListener("click", () => {
            if (audio.paused) {
                document
                    .querySelectorAll(".compact-audio audio")
                    .forEach(other => {
                        if (other !== audio && !other.paused) {
                            other.pause();
                            const otherBtn = other
                                .closest(".compact-audio")
                                .querySelector(".snippet-play, #snippet-play");
                            if (otherBtn) otherBtn.textContent = "▶";
                        }
                    });

                audio.play();
                playButton.textContent = "⏸";
            } else {
                audio.pause();
                playButton.textContent = "▶";
            }
        });

        audio.addEventListener("loadedmetadata", () => {
            totalTimeSpan.textContent = formatTime(audio.duration);
        });

        audio.addEventListener("timeupdate", () => {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = percent + "%";
            currentTimeSpan.textContent = formatTime(audio.currentTime);
        });

        progressContainer.addEventListener("click", e => {
            const rect = progressContainer.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = clickX / rect.width;
            audio.currentTime = audio.duration * ratio;
        });

        if (volumeSlider) {
            volumeSlider.addEventListener("input", () => {
                audio.volume = volumeSlider.value;
            });
        }
    });
}

function formatContent(rawContent) {
    let formatted = rawContent;
    formatted = formatted.replace(/\r?\n/g, "<br>");
    formatted = formatted.replace(/\[b\](.*?)\[\/b\]/gi, "<b>$1</b>");
    formatted = formatted.replace(/\[i\](.*?)\[\/i\]/gi, "<i>$1</i>");
    formatted = formatted.replace(/\[img\](.*?)\[\/img\]/gi, '<img src="$1" style="max-width:100%;">');
    formatted = formatted.replace(/\[video\](.*?)\[\/video\]/gi, '<video src="$1" controls style="max-width:100%;"></video>');
    formatted = formatted.replace(/\[url=(.*?)\](.*?)\[\/url\]/gi, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>');
    formatted = formatted.replace(/\{\{MOOD:(.*?)\}\}/gi, '<img src="blog/moods/$1" class="inline-mood-icon">');

    return formatted;
}

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("id");
    const contentDiv = document.getElementById("template-post-content");

    if (!postId || !contentDiv) return;

    try {
        const ref = doc(db, "blogs", postId);
        const snap = await getDoc(ref);

        if (!snap.exists()) return;

        const post = snap.data();

        document.getElementById("blog-title").textContent = post.title;
        document.getElementById("template-topic").textContent = "topic: " + post.title;
        document.getElementById("template-author").textContent = post.author;
        document.getElementById("template-mood-icon").src = "blog/moods/" + post.moodIcon;

        contentDiv.innerHTML = formatContent(post.content);

        setupCustomAudioPlayers();
        setupConfetti();
        setupNavigation(postId);
        document.querySelector(".blog-container").classList.add("loaded");
        const loadingScreen = document.getElementById("loading-screen");
        if (loadingScreen) loadingScreen.style.display = "none";

    } catch (e) {
        console.error("Error fetching post:", e);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("blog-submit-form");
    const message = document.getElementById("submission-message");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("title").value.trim();

        if (!confirm(`Are you sure you want to submit this blog?\n\nTitle: "${title}"`)) {
            return; // 🚫 STOP everything if cancelled
        }

        const author = document.getElementById("author").value.trim();
        const content = document.getElementById("content").value.trim();
        const moodIcon = document.getElementById("mood-icon").value;

        if (!title || !content) {
            message.textContent = "Title and content are required!";
            return;
        }

        try {
            await addDoc(collection(db, "blogs"), {
                title,
                author,
                content,
                moodIcon,
                date: serverTimestamp(),
                pinned: false,
                bold: false
            });

            message.textContent = "Post submitted!";
            form.reset();

        } catch (err) {
            console.error("Submit error:", err);
            message.textContent = "Error submitting post!";
        }
    });
});


document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
});
async function setupNavigation(currentId) {
    const prevHref = document.getElementById("previous-href");
    const nextHref = document.getElementById("next-href");
    if (!prevHref || !nextHref) return;

    const path = window.location.pathname;
    const isUndefinedPage = path.includes("undefined.html");

    const blogQuery = query(collection(db, "blogs"), orderBy("date", "asc"));
    const snapshot = await getDocs(blogQuery);

    const ids = snapshot.docs.map(doc => doc.id);
    if (ids.length === 0) {
        prevHref.href = "#";
        nextHref.href = "#";
        return;
    }

    const oldestId = ids[0];
    const newestId = ids[ids.length - 1];

    if (isUndefinedPage) {
        prevHref.href = `blog-template.html?id=${newestId}`;
        nextHref.href = `blog-template.html?id=${oldestId}`;
        return;
    }

    if (!currentId) {
        const params = new URLSearchParams(window.location.search);
        currentId = params.get("id");
    }

    if (!currentId) {
        prevHref.href = "undefined.html";
        nextHref.href = "undefined.html";
        return;
    }

    const index = ids.indexOf(currentId);

    if (index === -1) {
        prevHref.href = "undefined.html";
        nextHref.href = "undefined.html";
        return;
    }

    if (index === 0) {
        prevHref.href = "undefined.html";
    } else {
        prevHref.href = `blog-template.html?id=${ids[index - 1]}`;
    }

    if (index === ids.length - 1) {
        nextHref.href = "undefined.html";
    } else {
        nextHref.href = `blog-template.html?id=${ids[index + 1]}`;
    }
}

window.formatContent = formatContent;

document.addEventListener("DOMContentLoaded", () => {
    const previewBtn = document.getElementById("preview-button");
    const modal = document.getElementById("preview-modal");
    const closeBtn = document.getElementById("close-preview");

    if (!previewBtn || !modal) {
        console.warn("Preview elements not found");
        return;
    }

    previewBtn.addEventListener("click", () => {
        const title = document.getElementById("title").value.trim();
        const author = document.getElementById("author").value.trim();
        const moodFile = document.getElementById("mood-icon").value;
        const rawContent = document.getElementById("content").value;

        const formatted = window.formatContent(rawContent);

        document.getElementById("preview-title").textContent = title || "(Untitled)";
        document.getElementById("preview-author").textContent = author;
        document.getElementById("preview-mood").src = `blog/moods/${moodFile}`;
        document.getElementById("preview-content").innerHTML = formatted;

        modal.style.display = "flex";
    });

    closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });
});