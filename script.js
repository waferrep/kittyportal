
//modal
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal-overlay");
  const maxwell = document.getElementById("maxwell")
  const modalIframe = document.getElementById("modal-iframe");
  const closeBtn = document.getElementById("modal-close");

  // modal to about me, repeat this for every link that opens in the modal
  document.querySelectorAll("a[target='blog-iframe']").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      modalIframe.src = link.getAttribute("href");
      modal.style.display = "flex"; 
    });
  });

  // close modal when button
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
    modalIframe.src = ""; // clear iframe
  });

  // close modal when clicking out
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
      modalIframe.src = "";
    }
  });

  // close on maxell
  if (maxwell) {
    maxwell.addEventListener("click", () => {
      modal.style.display = "none";
      modalIframe.src = "";
    });
  }
});



//music stuff
const songs = [
  { name: "Hip Shop", artist: "Toby Fox", url: "music/hipshop.mp3"},
  { name: "Nights... am i falling in love?", artist: "xaev", url: "music/nights.mp3"},
  { name: "somebody call the doctor", artist: "celsius2004", url: "music/callthedoctor.mp3"},
  { name: "APPLE", artist: "Sheena Ringo", url: "music/apple.mp3"},
  { name: "Rude Buster", artist: "Toby Fox", url: "music/rudebuster.mp3"},
  { name: "N", artist: "subeteanatanoseidesu", url: "music/cxxii.mp3"},
  { name: "Ur body's my party", artist: "xaev", url: "music/bodyparty.mp3"},
  { name: "The Third Sanctuary", artist: "Toby Fox", url: "music/thirdsanctuary.mp3"},
  { name: "Menu/Options Screen", artist: "Richard Jacques", url: "music/sonic-r-options.mp3"},
  { name: "JACK DA FUNK", artist: "HIDEKI NAGANUMA", url: "music/jackdafunk.mp3"},
  { name: "Light Velocity", artist: "Isamu Ohira", url: "music/light vel.mp3"},
  { name: "Don't U Know (Original Mix)", artist: "xaev", url: "music/dontyouknow.mp3"},
  { name: "Killshot", artist: "Magdalena Bay", url: "music/killshot.mp3"}
];

let songIndex = 0;

const audio = document.getElementById("audio");
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const trackTitle = document.getElementById("music-track");
const trackArtist = document.getElementById("music-artist");

const progressContainer = document.querySelector(".progress-container");
const progress = document.querySelector(".progress");

function loadSong(index) {
  audio.src = songs[index].url;
  trackTitle.textContent = songs[index].name;
  trackArtist.textContent = songs[index].artist;
}
loadSong(songIndex);

function playSong() {
  audio.play();
  playBtn.textContent = "⏸"; // change icon
}
function pauseSong() {
  audio.pause();
  playBtn.textContent = "▶";
}
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    playSong();
  } else {
    pauseSong();
  }
});

nextBtn.addEventListener("click", () => {
  songIndex = (songIndex + 1) % songs.length;
  loadSong(songIndex);
  playSong();
});

prevBtn.addEventListener("click", () => {
  songIndex = (songIndex - 1 + songs.length) % songs.length;
  loadSong(songIndex);
  playSong();
});

audio.addEventListener("timeupdate", (e) => {
  const { duration, currentTime } = e.srcElement;
  const percent = (currentTime / duration) * 100;
  progress.style.width = `${percent}%`;
});


progressContainer.addEventListener("click", (e) => {
  const width = progressContainer.clientWidth;
  const clickX = e.offsetX;
  const duration = audio.duration;
  audio.currentTime = (clickX / width) * duration;
});

const currentTimeEl = document.getElementById("current-time");
const totalTimeEl = document.getElementById("total-time");
const volumeSlider = document.getElementById("volume");

audio.volume = volumeSlider.value;

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

const loopButton = document.getElementById("loop");
const shuffleButton = document.getElementById("shuffle");

let isLooping = false;
let isShuffling = false;

loopButton.addEventListener("click", () => {
  isLooping = !isLooping;
  if (isLooping) {
    isShuffling = false;
    shuffleButton.classList.remove("active");
  }
  audio.loop = isLooping;
  loopButton.classList.toggle("active", isLooping);
});

shuffleButton.addEventListener("click", () => {
  isShuffling = !isShuffling;
  if (isShuffling) {
    isLooping = false;
    loopButton.classList.remove("active");
    audio.loop = false;
  }
  shuffleButton.classList.toggle("active", isShuffling);
});

function getRandomSongIndex() {
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * songs.length);
  } while (newIndex === songIndex && songs.length > 1);
  return newIndex;
}

audio.addEventListener("ended", () => {
  if (!audio.loop) {
    if (isShuffling) {
      songIndex = getRandomSongIndex();
    } else {
      songIndex = (songIndex + 1) % songs.length;
    }
    loadSong(songIndex);
    playSong();
  }
});

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60) || 0;
  const secs = Math.floor(seconds % 60) || 0;
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}
audio.addEventListener("timeupdate", (e) => {
  const { duration, currentTime } = e.srcElement;

  const percent = (currentTime / duration) * 100;
  progress.style.width = `${percent}%`;

  currentTimeEl.textContent = formatTime(currentTime);
  if (!isNaN(duration)) {
    totalTimeEl.textContent = formatTime(duration);
  }
});

volumeSlider.addEventListener("input", (e) => {
  audio.volume = e.target.value;
});

const songMenu = document.getElementById("song-menu");
const songList = document.getElementById("song-list");
const trackTitleSpan = document.getElementById("music-track");
const artistSpan = document.getElementById("music-artist");

songs.forEach((song, index) => {
  const li = document.createElement("li");
  li.textContent = `${song.name} — ${song.artist}`;
  li.addEventListener("click", () => {
    songIndex = index;
    loadSong(songIndex);
    playSong();
    songMenu.style.display = "none";
  });
  songList.appendChild(li);
});

function toggleSongMenu() {
  songMenu.style.display = songMenu.style.display === "block" ? "none" : "block";
}

trackTitleSpan.addEventListener("click", toggleSongMenu);
artistSpan.addEventListener("click", toggleSongMenu);

document.addEventListener("click", (e) => {
  if (!songMenu.contains(e.target) && e.target !== trackTitleSpan && e.target !== artistSpan) {
    songMenu.style.display = "none";
  }
});



var motds = [
  "Some cats can meow 9,999,999,999 times a second (or more)",
  "(meeting god in horse heaven) No you look great i just didnt think youd be a horse",
  "I Can Do That!",
  "Me: Dawg have you seen my Talisman? Bro, jumping 70 feet: havent seen it 😃",
  "Pet Pet Pet Pet Pet Pet Pet Pet Pet Pet Pet wafer",
  "I think gangnam style is the best music video ever actually",
  "hi my name is Mother Fucker and i like B##Bs",
  "I like pretty boys!",
  "This website took 2 years to make...",
  "$1500 for rent vs $0 for rent",
  "Try clicking 999 times in a row",
  "Go to the bathroom, look at yourself in the mirror, and say 'I am a beautiful kitty' three times",
  "There is no LGB in this site",
  "Listen to some dubstep d(-_-)b",
  "spin me right round baby right round like a record baby right round round round",
  "only on kittyplace!",
  "this website was made with 2 paws and a keyboard",
  "What is Milk What Is Milk What is Milk",
  "click on every link on this website",
  "my name is xxtentacion and i like to scream",
  "its like the internet but for cats",
  "send a hello in chat :3",
  "try clicking on the 'click here' button",
  "no. seriously. this is the only message of the day",
  "powered by hamsters!",
  "Flash plugin is required to display this content",
  "leaving a nice comment gives me $1,000,0000,0000,000",
  "asriel kills the world!",
  '"R" is it.'
]

function displayMotd() {
  var num = Math.floor(Math.random() * motds.length);
  document.getElementById("motd-content").innerHTML = motds[num];
}

var species = [
  "abyssinian",
  "aegean",
  "american curl",
  "american bobtail",
  "american shorthair",
  "american wirehair",
  "arabian mau",
  "australian mist",
  "asian",
  "asian semi-longhair",
  "balinese",
  "bambino",
  "bengal",
  "birman",
  "bombay",
  "brazilian shorthair",
  "british semi-longhair",
  "british shorthair",
  "british longhair",
  "burmese",
  "burmilla",
  "calico",
  "california spangled",
  "chantilly-tiffany",
  "chartreux",
  "chausie",
  "cheetoh",
  "colorpoint shorthair",
  "cornish rex",
  "cymric",
  "cyprus",
  "devon rex",
  "donskoy",
  "dragon li",
  "egyptian mau",
  "european shorthair",
  "exotic shorthair",
  "foldex",
  "german rex",
  "havana brown",
  "highlander",
  "himalayan",
  "japanese bobtail",
  "javanese",
  "karelian bobtail",
  "khao manee",
  "korat",
  "korean bobtail",
  "korn ja",
  "kurilian bobtail",
  "laperm",
  "lykoi",
  "maine coon",
  "manx",
  "mekong bobtail",
  "minskin",
  "munchkin",
  "nebelung",
  "napoleon",
  "norwegian forest cat",
  "ocicat",
  "ojos azules",
  "oregon rex",
  "oriental bicolor",
  "oriental shorthair",
  "oriental longhair",
  "perfold",
  "persian",
  "peterbald",
  "pixie-bob",
  "raas",
  "ragamuffin",
  "ragdoll",
  "russian blue",
  "russian white, black and tabby",
  "sam sawet",
  "savannah",
  "scottish fold",
  "selkirk rex",
  "serengeti",
  "serrade petit",
  "siamese",
  "siberian",
  "singapura",
  "snowshoe",
  "sokoke",
  "somali",
  "sphynx",
  "suphalak",
  "thai lilac",
  "tonkinese",
  "toyger",
  "turkish angora",
  "turkish van",
  "ukrainian levkoy"
]

function displaySpecies() {
  var num = Math.floor(Math.random() * species.length);
  document.getElementById("randomize-species").innerHTML = "i love " + species[num]+"s";
}

const banner = document.getElementById("banner-randomize");

const phrases = [
  "rawr xd!",
  "owo what's this?",
  "brb gtg ttyl",
  "rawr means i love u in dinosaur",
  "the game",
  "Unregistered HyperCam 2",
  "WHO WAS PHONE?",
  "My Life Is Over \\(^o^)/",
  "Yeah well..... you're gay!!",
  "le derp",
  "twelve seconds later",
  "only a spoonful",
  "fight the power",
  "not the giant enemy!",
  "buildin a sentry",
  "charlieeeeeeee",
  "i herd u liek mudkipz",
  "NOPE!",
  "ᓚ₍ ^. .^₎ᓚ₍ ^. .^₎ᓚ₍ ^. .^₎",
  "╾━╤デ╦︻<₍^. .^₎⟆",
  "this is my happy face :)",
  "(>^_^)> pirate everything!",
  "try not to laugh challenge",
  "Flash plugin is required to display this content",
  "pwned"
];


function setRandomPhrase() {
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  banner.textContent = phrase;
}

setRandomPhrase();

banner.addEventListener("animationiteration", setRandomPhrase);


//format date
function formatDate(date) {
  const datePart = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  return `${datePart} ${timePart}`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".post-date").forEach(cell => {
    const utcString = cell.dataset.utc;
    if (utcString) {
      const localDate = new Date(utcString); 
      cell.textContent = formatDate(localDate);
    }
  });
});


document.addEventListener("DOMContentLoaded", () => {
    displayMotd();
    displaySpecies();
});


// Firestore
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { db } from "./firebase.js";

const POSTS_PER_PAGE = 11;
let currentPage = 1;

let allPosts = [];

async function fetchAllPosts() {
    const postsDatabase = collection(db, "blogs");
    const q = query(postsDatabase, orderBy("date", "desc"));

    try {
        const snapshot = await getDocs(q);

        let posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const pinned = posts.filter(p => p.pinned);
        const unpinned = posts.filter(p => !p.pinned);

        pinned.sort((a, b) => b.date.seconds - a.date.seconds);
        unpinned.sort((a, b) => b.date.seconds - a.date.seconds);

        allPosts = [...pinned, ...unpinned];
        
        displayPosts(currentPage);
        renderPagination();

    } catch (error) {
        console.error("Error fetching posts: ", error);
    }
}

function displayPosts(page) {
    currentPage = page;
    const tableBody = document.querySelector("#posts-table-body");
    tableBody.innerHTML = ""; 

    const startIndex = (page - 1) * POSTS_PER_PAGE;
    const endIndex = startIndex + POSTS_PER_PAGE;
    const postsToShow = allPosts.slice(startIndex, endIndex);

    postsToShow.forEach(post => {
        const tableRow = document.createElement("tr");

        if (post.pinned) {
            tableRow.classList.add("pinned-msg");
        }

        const tableTitle = document.createElement("td");
        const link = document.createElement("a");

        link.href = `pages/blog-template.html?id=${post.id}`;
        link.target = "blog-iframe";
        link.innerHTML = `▹ <span>${post.title}</span>`;

        if (post.bold) {
            link.classList.add("bold-title");
        }

        link.addEventListener("click", (e) => {
            e.preventDefault();
            
            const modal = document.getElementById("modal-overlay");
            const modalIframe = document.getElementById("modal-iframe");
            
            modalIframe.src = link.href;
            modal.style.display = "flex";
        });

        tableTitle.appendChild(link);
        tableRow.appendChild(tableTitle);

        const tableAuthor = document.createElement("td");
        tableAuthor.textContent = post.author;
        tableRow.appendChild(tableAuthor);

        const tableDate = document.createElement("td");
        tableDate.textContent = new Date(post.date.seconds * 1000).toLocaleString();
        tableRow.appendChild(tableDate);

        tableBody.appendChild(tableRow);
    });
}

function renderPagination() {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";
    
    const pageCount = Math.ceil(allPosts.length / POSTS_PER_PAGE);

    for (let i = 1; i <= pageCount; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.classList.add("pagination-button");

        if (i === currentPage) {
            button.classList.add("active");
        }

        button.addEventListener("click", () => {
            displayPosts(i);
            renderPagination(); 
        });

        paginationContainer.appendChild(button);
    }
}


window.addEventListener("DOMContentLoaded", fetchAllPosts);

document.getElementById("modal-close").addEventListener("click", () => {
    document.getElementById("modal-overlay").style.display = "none";
});


//badge

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("kittybadge-container");
    const popup = document.getElementById("badge-popup");
    const copyBtn = document.getElementById("copy-badge-btn");
    const textarea = popup.querySelector("textarea");

    container.addEventListener("click", (e) => {
        e.preventDefault();
        popup.style.display = popup.style.display === "block" ? "none" : "block";
        e.stopPropagation(); 
    });

    copyBtn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        const text = textarea.value;
        navigator.clipboard.writeText(text);
        copyBtn.textContent = "Copied!";
        setTimeout(() => copyBtn.textContent = "Copy Code", 900);
    });

    popup.addEventListener("click", (e) => {
        e.stopPropagation();
    });

    textarea.addEventListener("click", (e) => {
        e.stopPropagation();
    });
    
    document.addEventListener("click", (e) => {
        if (!container.contains(e.target)) {
            popup.style.display = "none";
        }
    });
});

