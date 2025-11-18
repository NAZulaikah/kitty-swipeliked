// CONFIG
const TOTAL = 15;
const PRELOAD = 3;

// ELEMENTS
const popup = document.getElementById("swipePopup");
const openSwipe = document.getElementById("openSwipe");
const closePopup = document.getElementById("closePopup");

const card = document.getElementById("card");
const cardImage = document.getElementById("cardImage");

const likeBtn = document.getElementById("likeBtn");
const dislikeBtn = document.getElementById("dislikeBtn");
const undoBtn = document.getElementById("undoBtn");

const likedListEl = document.getElementById("likedList");
const likedCountEl = document.getElementById("likedCount");
const clearBtn = document.getElementById("clearBtn");

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

// DATA
let images = [];
let index = 0;
let liked = JSON.parse(localStorage.getItem("likedCats") || "[]");
let history = [];

// UTIL
const catURL = () => `https://cataas.com/cat?${Math.random()}`;
const generateImages = () => images = Array.from({length: TOTAL}, () => catURL());

// ----- POPUP -----
openSwipe.onclick = () => {
  popup.style.display = "flex";
  renderCard();
};
closePopup.onclick = () => {
  popup.style.display = "none";
  showLiked();
};

// ----- LIKED SECTION -----
function showLiked() {
  likedListEl.innerHTML = "";

  liked.forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    likedListEl.appendChild(img);
  });

  likedCountEl.textContent = `❤️ ${liked.length} cats`;
}

clearBtn.onclick = () => {
  liked = [];
  localStorage.setItem("likedCats", JSON.stringify(liked));
  showLiked();
};

// ----- CARD RENDER -----
function updateProgress() {
  progressText.textContent = `Cat ${index + 1} of ${TOTAL}`;
  progressFill.style.width = `${(index / TOTAL) * 100}%`;
}

function renderCard() {
  if (index >= images.length) {
    index = 0;
    generateImages();
  }
  cardImage.src = images[index];
  updateProgress();
}

// ----- SWIPE LOGIC -----
let startX = 0;
let dragging = false;

function pointerDown(x) {
  dragging = true;
  startX = x;
  card.style.transition = "none";
}

function pointerMove(x) {
  if (!dragging) return;
  let dx = x - startX;

  card.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;

  if (dx > 0) showOverlay("like");
  else showOverlay("dislike");
}

function pointerUp(x) {
  if (!dragging) return;
  dragging = false;

  let dx = x - startX;
  card.style.transition = "0.3s";

  if (dx > 120) doLike();
  else if (dx < -120) doDislike();
  else resetCard();
}

function resetCard() {
  card.style.transform = "translateX(0) rotate(0)";
  hideOverlay();
}

function showOverlay(type) {
  document.querySelector(".overlay-like").style.opacity = (type === "like") ? 1 : 0;
  document.querySelector(".overlay-dislike").style.opacity = (type === "dislike") ? 1 : 0;
}
function hideOverlay() {
  document.querySelector(".overlay-like").style.opacity = 0;
  document.querySelector(".overlay-dislike").style.opacity = 0;
}

// ACTIONS
function doLike() {
  history.push({idx: index, liked: true});
  liked.push(images[index]);
  localStorage.setItem("likedCats", JSON.stringify(liked));
  showLiked();

  card.style.transform = "translateX(400px) rotate(25deg)";
  setTimeout(() => {
    index++;
    renderCard();
    resetCard();
  }, 300);
}

function doDislike() {
  history.push({idx: index, liked: false});

  card.style.transform = "translateX(-400px) rotate(-25deg)";
  setTimeout(() => {
    index++;
    renderCard();
    resetCard();
  }, 300);
}

function undo() {
  const last = history.pop();
  if (!last) return;

  index = last.idx;

  if (last.liked) {
    liked.pop();
    localStorage.setItem("likedCats", JSON.stringify(liked));
    showLiked();
  }

  renderCard();
}

likeBtn.onclick = doLike;
dislikeBtn.onclick = doDislike;
undoBtn.onclick = undo;

// mouse
card.onmousedown = e => {
  pointerDown(e.clientX);

  const move = ev => pointerMove(ev.clientX);
  const up = ev => {
    pointerUp(ev.clientX);
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", up);
  };

  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
};

// touch
card.addEventListener("touchstart", e => pointerDown(e.touches[0].clientX), {passive: true});
card.addEventListener("touchmove", e => {
  e.preventDefault();
  pointerMove(e.touches[0].clientX);
}, {passive: false});
card.addEventListener("touchend", e => pointerUp(e.changedTouches[0].clientX));

// INIT
generateImages();
showLiked();
renderCard();
