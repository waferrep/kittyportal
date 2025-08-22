
//javascript for page navigation and maybe maxwell funniness

document.addEventListener("DOMContentLoaded", () => {

    //number of blogs
    const numberOfBlogs = 4;

    //href get
    const prevHref = document.getElementById("previous-href");
    const nextHref = document.getElementById("next-href");
    const latestBlog = `blog${numberOfBlogs}.html`;
    
    //get path
    const fullPath = window.location.pathname;
    const currentPath = fullPath.split('/').pop();
    
    if (currentPath === 'undefined.html'){
            nextHref.href = `blog1.html`;
            prevHref.href = latestBlog;
    }

    else{

        //parse number and turn real
        const blogNumber = currentPath.match(/(\d+)/);
        const blogParsed = parseInt(blogNumber[1], 10);

        //get next and prev blog
        const prevBlog = `blog${blogParsed - 1}.html`;
        const nextBlog = `blog${blogParsed + 1}.html`;

        //prev
        if (blogParsed > 1) {
            prevHref.href = prevBlog;
        }
        else {
            prevHref.href = "undefined.html"
        }

        //next
        if (blogParsed < numberOfBlogs) {
            nextHref.href = nextBlog;
        }
        else{
            nextHref.href = "undefined.html";
        }

    }
});

document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("commentHeader");
  const section = document.getElementById("commentToggle");

  if (header && section) {
    header.addEventListener("click", () => {
      section.classList.toggle("expanded");
    });
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const countTarget = document.getElementById("commentCount");

  function updateCommentCount() {
    const commentList = document.querySelectorAll("#comments_list > .comment");
    if (countTarget && commentList.length >= 0) {
      countTarget.textContent = `(${commentList.length})`;
    }
  }
  const commentBox = document.getElementById("HCB_comment_box");
  if (commentBox) {
    const observer = new MutationObserver(updateCommentCount);
    observer.observe(commentBox, { childList: true, subtree: true });
  }
});


//audiplayer 2

const audio = document.getElementById("snippet-audio");
const playBtn = document.getElementById("snippet-play");
const progress = document.getElementById("snippet-progress");
const timeDisplay = document.getElementById("snippet-time");
const volumeSlider = document.getElementById("snippet-volume");

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60) || 0;
  const secs = Math.floor(seconds % 60) || 0;
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

const snippetAudio = document.getElementById("snippet-audio");
const snippetPlay = document.getElementById("snippet-play");
const snippetProgress = document.getElementById("snippet-progress");
const snippetVolume = document.getElementById("snippet-volume");
const snippetCurrent = document.getElementById("snippet-current");
const snippetTotal = document.getElementById("snippet-total");
const progressContainer = document.querySelector(".compact-progress");

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60) || 0;
  const secs = Math.floor(seconds % 60) || 0;
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
}

snippetAudio.volume = snippetVolume.value;

snippetPlay.addEventListener("click", () => {
  if (snippetAudio.paused) {
    snippetAudio.play();
    snippetPlay.textContent = "⏸";
  } else {
    snippetAudio.pause();
    snippetPlay.textContent = "▶";
  }
});

snippetAudio.addEventListener("timeupdate", () => {
  const { duration, currentTime } = snippetAudio;
  if (!isNaN(duration)) {
    const percent = (currentTime / duration) * 100;
    snippetProgress.style.width = `${percent}%`;
    snippetCurrent.textContent = formatTime(currentTime);
    snippetTotal.textContent = formatTime(duration);
  }
});

progressContainer.addEventListener("click", (e) => {
  const width = progressContainer.clientWidth;
  const clickX = e.offsetX;
  const duration = snippetAudio.duration;
  snippetAudio.currentTime = (clickX / width) * duration;
});

snippetVolume.addEventListener("input", (e) => {
  snippetAudio.volume = e.target.value;
});


//stolen confettii
document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("confetti-btn"); 
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");

  let confettiPieces = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function createConfetti(count = 40) {
    const colors = ['#fde132', '#009bde', '#ff6b00', '#ff2d5d', '#7cff00'];
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
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2; //fall speed
      p.x += Math.sin(p.d);
      p.tilt = Math.sin(p.tiltAngle) * 15;
      p.alpha -= 0.0005; //lifetime
      return p.alpha > 0;
    });
  }

  function animate() {
    drawConfetti();
    updateConfetti();
    requestAnimationFrame(animate);
  }

  animate();

if (button) {
  const clownSound = document.getElementById("clown-sound");

  button.addEventListener("click", () => {
    createConfetti(40); // burst confetti

    // Play clown noise
    if (clownSound) {
      clownSound.currentTime = 0; // rewind if spamming
      clownSound.play();
    }
  });
}
});
