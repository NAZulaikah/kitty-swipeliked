/* Paws & Preferences - vanilla JS
   Features:
   - swipe gestures (touch + mouse)
   - slide-out animations (.slide-left / .slide-right)
   - progress bar counter
   - like/dislike sounds (assets/like.mp3, assets/dislike.mp3)
   - Preload images and save liked list to localStorage
*/

const TOTAL = 15;           // total cards to cycle through
const PRELOAD_AHEAD = 3;    // preload next n images

// DOM
const startBtn = document.getElementById('startBtn');
const clearBtn = document.getElementById('clearBtn');
const doneBtn = document.getElementById('doneBtn');

const landing = document.getElementById('landing');
const swipeArea = document.getElementById('swipeArea');

const card = document.getElementById('card');
const cardImage = document.getElementById('cardImage');
const backCard = document.querySelector('.back-card');

const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');
const undoBtn = document.getElementById('undoBtn');

const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');

const likedListEl = document.getElementById('likedList');
const likedSection = document.getElementById('likedSection');

const likeSound = document.getElementById('likeSound');
const dislikeSound = document.getElementById('dislikeSound');

// state
let images = [];       // list of image URLs
let index = 0;         // current index
let liked = JSON.parse(localStorage.getItem('likedCats') || '[]');
let history = [];      // history stack for undo

// helpers
function catURL(){ return `https://cataas.com/cat?${Math.random()}`; }

function generateImages(){
  images = Array.from({length: TOTAL}, () => catURL());
}

// preload function
function preloadAt(i){
  for(let j = i; j < Math.min(images.length, i + PRELOAD_AHEAD); j++){
    const img = new Image();
    img.src = images[j];
  }
}

// UI updates
function updateProgress(){
  progressText.textContent = `Cat ${Math.min(index+1, images.length)} of ${TOTAL}`;
  const percent = Math.round(((index) / TOTAL) * 100);
  progressFill.style.width = `${percent}%`;
}

function showLiked(){
  if(liked.length === 0){
    likedSection.classList.add('hidden');
    return;
  }
  likedSection.classList.remove('hidden');
  likedListEl.innerHTML = '';
  liked.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.loading = 'lazy';
    likedListEl.appendChild(img);
  });
}

// render current card image
function renderCard(){
  if(index >= images.length){
    // cycle: regenerate or show results
    index = 0;
    generateImages();
  }
  const url = images[index];
  // set front image
  cardImage.src = url;
  // set back placeholder (next)
  const nextUrl = images[index + 1] || images[0];
  backCard.style.background = `url(${nextUrl}) center/cover no-repeat`;
  preloadAt(index+1);
  updateProgress();
}

// actions
function doLike(animate = true){
  // push to liked and history for undo
  history.push({idx:index, liked:true});
  liked.push(images[index]);
  localStorage.setItem('likedCats', JSON.stringify(liked));
  showLiked();
  if(animate) playLikeAnimation();
  index++;
  setTimeout(()=> {
    renderCard();
  }, animate ? 420 : 0);
}

function doDislike(animate = true){
  history.push({idx:index, liked:false});
  if(animate) playDislikeAnimation();
  index++;
  setTimeout(()=> {
    renderCard();
  }, animate ? 420 : 0);
}

function undo(){
  const last = history.pop();
  if(!last) return;
  index = last.idx;
  if(last.liked){
    liked.pop();
    localStorage.setItem('likedCats', JSON.stringify(liked));
    showLiked();
  }
  renderCard();
}

// animations & sound
function playLikeAnimation(){
  likeSound && likeSound.currentTime && (likeSound.currentTime = 0);
  likeSound && likeSound.play && likeSound.play().catch(()=>{});
  card.classList.add('slide-right');
  showOverlayIndicator('like');
  setTimeout(()=> { card.classList.remove('slide-right'); hideOverlayIndicator(); }, 420);
}
function playDislikeAnimation(){
  dislikeSound && dislikeSound.currentTime && (dislikeSound.currentTime = 0);
  dislikeSound && dislikeSound.play && dislikeSound.play().catch(()=>{});
  card.classList.add('slide-left');
  showOverlayIndicator('dislike');
  setTimeout(()=> { card.classList.remove('slide-left'); hideOverlayIndicator(); }, 420);
}
function showOverlayIndicator(kind){
  if(kind === 'like'){ document.querySelector('.overlay-like').style.opacity = '1'; }
  else { document.querySelector('.overlay-dislike').style.opacity = '1'; }
}
function hideOverlayIndicator(){
  document.querySelector('.overlay-like').style.opacity = '0';
  document.querySelector('.overlay-dislike').style.opacity = '0';
}

// touch + mouse swipe handling
let startX = 0;
let startY = 0;
let dragging = false;

function pointerDown(clientX, clientY){
  dragging = true;
  startX = clientX;
  startY = clientY;
  card.style.transition = 'none';
}
function pointerMove(clientX, clientY){
  if(!dragging) return;
  const dx = clientX - startX;
  const dy = clientY - startY;
  // if vertical drag is dominant, do nothing (allow scroll if any)
  if(Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) return;
  const rot = dx / 18;
  card.style.transform = `translateX(${dx}px) rotate(${rot}deg)`;
  // fade overlays
  const ratio = Math.min(1, Math.abs(dx) / 120);
  if(dx > 0) { document.querySelector('.overlay-like').style.opacity = ratio; document.querySelector('.overlay-dislike').style.opacity = 0; }
  else { document.querySelector('.overlay-dislike').style.opacity = ratio; document.querySelector('.overlay-like').style.opacity = 0; }
}
function pointerUp(clientX, clientY){
  if(!dragging) return;
  dragging = false;
  card.style.transition = 'transform 300ms cubic-bezier(.22,.9,.32,1)';
  const dx = clientX - startX;
  if(dx > 120){
    // like
    card.style.transform = `translateX(${window.innerWidth}px) rotate(30deg)`;
    setTimeout(()=> { card.style.transform = ''; }, 400);
    doLike(true);
  } else if(dx < -120){
    // dislike
    card.style.transform = `translateX(-${window.innerWidth}px) rotate(-30deg)`;
    setTimeout(()=> { card.style.transform = ''; }, 400);
    doDislike(true);
  } else {
    // reset
    card.style.transform = '';
    hideOverlayIndicator();
  }
}

// listeners
startBtn.addEventListener('click', () => {
  landing.classList.add('hidden');
  swipeArea.classList.remove('hidden');
  generateImages();
  renderCard();
});

clearBtn.addEventListener('click', () => {
  liked = [];
  localStorage.setItem('likedCats', JSON.stringify(liked));
  showLiked();
});

likeBtn.addEventListener('click', () => doLike(true));
dislikeBtn.addEventListener('click', () => doDislike(true));
undoBtn.addEventListener('click', undo);
doneBtn.addEventListener('click', () => {
  // show landing area where liked are visible
  swipeArea.classList.add('hidden');
  landing.classList.remove('hidden');
  showLiked();
});

// touch events
card.addEventListener('touchstart', (e) => { pointerDown(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});
card.addEventListener('touchmove', (e) => { pointerMove(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
card.addEventListener('touchend', (e) => { pointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY); });

// mouse events for desktop
card.addEventListener('mousedown', (e) => {
  pointerDown(e.clientX, e.clientY);
  const move = (ev) => pointerMove(ev.clientX, ev.clientY);
  const up = (ev) => { pointerUp(ev.clientX, ev.clientY); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
});

// init UI
showLiked();
