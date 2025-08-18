
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
  { name: "  Ur body's my party", artist: "xaev", url: "music/bodyparty.mp3"},
  { name: "The Third Sanctuary", artist: "Toby Fox", url: "music/thirdsanctuary.mp3"},
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

const loopButton = document.getElementById("loop")
let isLooping = false;

loopButton.addEventListener("click", () => {
  isLooping = !isLooping;
  audio.loop = isLooping;
  loopButton.classList.toggle("active", isLooping);
});

audio.addEventListener("ended", () => {
  if (!audio.loop) {
    songIndex = (songIndex + 1) % songs.length; // loop back to start
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
  "my name is xxtentacion and i like to scream"
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
  'My Life Is Over \(^o^)/',
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
  "ᓚ₍ ^. .^₎ᓚ₍ ^. .^₎ᓚ₍ ^. .^₎"
];


function setRandomPhrase() {
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  banner.textContent = phrase;
}

setRandomPhrase();

banner.addEventListener("animationiteration", setRandomPhrase);

//