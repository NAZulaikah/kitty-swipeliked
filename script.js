// CONFIG
const TOTAL = 20;
const PRELOAD_AHEAD = 3;

// STATE
let images = [];
let index = 0;
let liked = JSON.parse(localStorage.getItem('likedCats') || '[]');
let historyStack = [];

// DOM
const openSwipeBtn = document.getElementById('openSwipeBtn');
const popupOverlay = document.getElementById('popupOverlay');
const closePopup = document.getElementById('closePopup');
const swipeCard = document.getElementById('swipeCard');
const swipeImage = document.getElementById('swipeImage');
const overlayLike = document.getElementById('overlayLike');
const overlayDislike = document.getElementById('overlayDislike');
const btnLike = document.getElementById('btnLike');
const btnDislike = document.getElementById('btnDislike');
const btnUndo = document.getElementById('btnUndo');
const progText = document.getElementById('progText');
const progFill = document.getElementById('progFill');

const gallery = document.getElementById('gallery');
const likedCount = document.getElementById('likedCount');
const clearBtn = document.getElementById('clearBtn');

// slideshow
const slideshow = document.getElementById('slideshow');
const slideImg = document.getElementById('slideImg');
const closeSlide = document.getElementById('closeSlide');
const prevSlide = document.getElementById('prevSlide');
const nextSlide = document.getElementById('nextSlide');
let slideIndex = 0;

// HELPERS
const catURL = () => `https://cataas.com/cat?${Math.random()}`;
function generateImages(){
  images = Array.from({length: TOTAL}, ()=>catURL());
}
function preloadAt(i){
  for(let j=i;j<Math.min(images.length,i+PRELOAD_AHEAD);j++){
    const im = new Image();
    im.src = images[j];
  }
}

// PROGRESS & RENDER
function updateProgress(){
  progText.textContent = `Cat ${index+1} of ${TOTAL}`;
  progFill.style.width = `${Math.round((index/TOTAL)*100)}%`;
}

function renderSwipe(){
  if(index >= images.length){ index = 0; generateImages(); }
  swipeImage.style.opacity = 0;
  swipeImage.src = images[index];
  swipeImage.onload = ()=> swipeImage.style.opacity = 1;
  preloadAt(index+1);
  updateProgress();
}

// GALLERY
function renderGallery(){
  gallery.innerHTML = '';
  liked.forEach((url, i)=>{
    const btn = document.createElement('button');
    btn.className = 'tile';
    btn.type = 'button';
    btn.dataset.idx = i;
    const img = document.createElement('img');
    img.src = url;
    img.alt = `liked cat ${i+1}`;
    btn.appendChild(img);
    btn.onclick = ()=> openSlideshow(i);
    gallery.appendChild(btn);
  });
  likedCount.textContent = liked.length;
  document.getElementById('likedCount').textContent = liked.length;
  localStorage.setItem('likedCats', JSON.stringify(liked));
}

// SLIDESHOW
function openSlideshow(i){
  if(!liked.length) return;
  slideIndex = i;
  slideImg.src = liked[slideIndex];
  slideshow.style.display = 'flex';
}
function closeSlideshow(){ slideshow.style.display = 'none'; }
function nextInSlideshow(){ if(!liked.length) return; slideIndex = (slideIndex+1) % liked.length; slideImg.src = liked[slideIndex]; }
function prevInSlideshow(){ if(!liked.length) return; slideIndex = (slideIndex-1 + liked.length) % liked.length; slideImg.src = liked[slideIndex]; }

// POPUP controls
openSwipeBtn.onclick = ()=>{
  popupOverlay.style.display = 'flex';
  index = 0;
  if(images.length === 0) generateImages();
  renderSwipe();
  popupOverlay.setAttribute('aria-hidden','false');
};
closePopup.onclick = ()=>{
  popupOverlay.style.display = 'none';
  popupOverlay.setAttribute('aria-hidden','true');
  renderGallery();
};

// Clear likes
clearBtn.onclick = ()=>{
  liked = [];
  renderGallery();
};

// ACTIONS
function doLike(){
  historyStack.push({idx:index, liked:true});
  liked.push(images[index]);
  renderGallery();
  swipeCard.style.transition = 'transform 360ms cubic-bezier(.22,.9,.32,1)';
  swipeCard.style.transform = 'translateX(600px) rotate(20deg)';
  setTimeout(()=>{ index++; renderSwipe(); swipeCard.style.transform = 'translateX(0) rotate(0)'; swipeCard.style.transition=''; }, 360);
}
function doDislike(){
  historyStack.push({idx:index, liked:false});
  swipeCard.style.transition = 'transform 360ms cubic-bezier(.22,.9,.32,1)';
  swipeCard.style.transform = 'translateX(-600px) rotate(-20deg)';
  setTimeout(()=>{ index++; renderSwipe(); swipeCard.style.transform = 'translateX(0) rotate(0)'; swipeCard.style.transition=''; }, 360);
}
function doUndo(){
  const last = historyStack.pop();
  if(!last) return;
  index = last.idx;
  if(last.liked){
    liked.pop();
    renderGallery();
  }
  renderSwipe();
}

btnLike.onclick = doLike;
btnDislike.onclick = doDislike;
btnUndo.onclick = doUndo;

// SWIPE gestures
let startX=0, startY=0, dragging=false;
function pointerDown(x,y){
  dragging=true; startX=x; startY=y; swipeCard.style.transition='none';
}
function pointerMove(x,y){
  if(!dragging) return;
  const dx = x - startX;
  const dy = y - startY;
  if(Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) return; // vertical scroll guard
  swipeCard.style.transform = `translateX(${dx}px) rotate(${dx/18}deg)`;
  const ratio = Math.min(1, Math.abs(dx)/120);
  if(dx>0){ overlayLike.style.opacity = ratio; overlayDislike.style.opacity = 0; }
  else { overlayDislike.style.opacity = ratio; overlayLike.style.opacity = 0; }
}
function pointerUp(x,y){
  if(!dragging) return;
  dragging=false;
  swipeCard.style.transition = 'transform 300ms cubic-bezier(.22,.9,.32,1)';
  const dx = x - startX;
  if(dx > 120) doLike();
  else if(dx < -120) doDislike();
  else { swipeCard.style.transform = 'translateX(0) rotate(0)'; overlayLike.style.opacity = 0; overlayDislike.style.opacity = 0; }
}

swipeCard.addEventListener('touchstart', e=>pointerDown(e.touches[0].clientX,e.touches[0].clientY), {passive:true});
swipeCard.addEventListener('touchmove', e=>{ e.preventDefault(); pointerMove(e.touches[0].clientX,e.touches[0].clientY); }, {passive:false});
swipeCard.addEventListener('touchend', e=>pointerUp(e.changedTouches[0].clientX,e.changedTouches[0].clientY));

swipeCard.addEventListener('mousedown', e=>{
  pointerDown(e.clientX,e.clientY);
  const move = ev=>pointerMove(ev.clientX,ev.clientY);
  const up = ev=>{ pointerUp(ev.clientX,ev.clientY); window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); };
  window.addEventListener('mousemove',move);
  window.addEventListener('mouseup',up);
});

// Slideshow controls
closeSlide.onclick = closeSlideshow;
nextSlide.onclick = nextInSlideshow;
prevSlide.onclick = prevInSlideshow;

// keyboard shortcuts
window.addEventListener('keydown', e=>{
  if(slideshow.style.display === 'flex'){
    if(e.key === 'ArrowRight') nextInSlideshow();
    if(e.key === 'ArrowLeft') prevInSlideshow();
    if(e.key === 'Escape') closeSlideshow();
  }
  if(popupOverlay.style.display === 'flex'){
    if(e.key === 'Escape') { popupOverlay.style.display = 'none'; popupOverlay.setAttribute('aria-hidden','true'); renderGallery(); }
  }
});

// init
generateImages();
renderGallery();
renderSwipe();
