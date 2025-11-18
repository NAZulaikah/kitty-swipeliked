const TOTAL = 15;
const PRELOAD_AHEAD = 3;

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
const likedCountEl = document.getElementById('likedCount');

const likeSound = document.getElementById('likeSound');
const dislikeSound = document.getElementById('dislikeSound');

let images = [];
let index = 0;
let liked = JSON.parse(localStorage.getItem('likedCats') || '[]');
let history = [];

function catURL(){ return `https://cataas.com/cat?${Math.random()}`; }
function generateImages(){ images = Array.from({length: TOTAL},()=>catURL()); }
function preloadAt(i){ for(let j=i;j<Math.min(images.length,i+PRELOAD_AHEAD);j++){ const img=new Image(); img.src=images[j]; } }
function updateProgress(){ 
  progressText.textContent = `Cat ${Math.min(index+1,TOTAL)} of ${TOTAL}`;
  progressFill.style.width = `${Math.round((index/TOTAL)*100)}%`;
}

function showLiked(){
  if(liked.length===0){ likedSection.classList.add('hidden'); likedCountEl.textContent=''; return; }
  likedSection.classList.remove('hidden');
  likedListEl.innerHTML = '';
  liked.forEach(url=>{
    const img=document.createElement('img'); img.src=url; img.loading='lazy';
    likedListEl.appendChild(img);
  });
  likedCountEl.textContent = `❤️ You liked ${liked.length} cats`;
}

function renderCard(){
  if(index>=images.length){ index=0; generateImages(); }
  const url = images[index];
  cardImage.style.opacity = 0;
  cardImage.src = url;
  cardImage.onload = ()=>{ cardImage.style.opacity=1; }
  const nextUrl = images[index+1]||images[0];
  backCard.style.background = `url(${nextUrl}) center/cover no-repeat`;
  backCard.style.backgroundSize = 'cover';
  preloadAt(index+1);
  updateProgress();
}

function resetCardPosition(){ 
  card.style.transition='none'; 
  card.style.transform='translateX(0) rotate(0)'; 
  hideOverlayIndicator(); 
  requestAnimationFrame(()=>{card.style.transition='';});
}

function showOverlayIndicator(kind){ 
  if(kind==='like'){ document.querySelector('.overlay-like').style.opacity='1'; } 
  else{ document.querySelector('.overlay-dislike').style.opacity='1'; } 
}
function hideOverlayIndicator(){ document.querySelector('.overlay-like').style.opacity='0'; document.querySelector('.overlay-dislike').style.opacity='0'; }

function playLikeAnimation(){ likeSound.play().catch(()=>{}); card.classList.add('slide-right'); showOverlayIndicator('like'); setTimeout(()=>{card.classList.remove('slide-right'); resetCardPosition();},420);}
function playDislikeAnimation(){ dislikeSound.play().catch(()=>{}); card.classList.add('slide-left'); showOverlayIndicator('dislike'); setTimeout(()=>{card.classList.remove('slide-left'); resetCardPosition();},420); }

function doLike(){ history.push({idx:index,liked:true}); liked.push(images[index]); localStorage.setItem('likedCats',JSON.stringify(liked)); showLiked(); playLikeAnimation(); index++; setTimeout(()=>{renderCard();},420); }
function doDislike(){ history.push({idx:index,liked:false}); playDislikeAnimation(); index++; setTimeout(()=>{renderCard();},420); }
function undo(){ const last=history.pop(); if(!last) return; index=last.idx; if(last.liked){ liked.pop(); localStorage.setItem('likedCats',JSON.stringify(liked)); showLiked(); } renderCard(); }

// swipe gestures
let startX=0, startY=0, dragging=false;
function pointerDown(cx,cy){ dragging=true; startX=cx; startY=cy; card.style.transition='none'; }
function pointerMove(cx,cy){ if(!dragging) return; const dx=cx-startX; const dy=cy-startY; if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10) return; const rot=dx/18; card.style.transform=`translateX(${dx}px) rotate(${rot}deg)`; const ratio=Math.min(1,Math.abs(dx)/120); if(dx>0){ document.querySelector('.overlay-like').style.opacity=ratio; document.querySelector('.overlay-dislike').style.opacity=0; } else{ document.querySelector('.overlay-dislike').style.opacity=ratio; document.querySelector('.overlay-like').style.opacity=0; } }
function pointerUp(cx,cy){ if(!dragging) return; dragging=false; card.style.transition='transform 300ms cubic-bezier(.22,.9,.32,1)'; const dx=cx-startX; if(dx>120){ card.style.transform=`translateX(${window.innerWidth}px) rotate(30deg)`; doLike(); } else if(dx<-120){ card.style.transform=`translateX(-${window.innerWidth}px) rotate(-30deg)`; doDislike(); } else{ resetCardPosition(); } }

// event listeners
startBtn.addEventListener('click',()=>{ landing.classList.add('hidden'); swipeArea.classList.remove('hidden'); generateImages(); renderCard(); });
clearBtn.addEventListener('click',()=>{ liked=[]; localStorage.setItem('likedCats',JSON.stringify(liked)); showLiked(); });
likeBtn.addEventListener('click',doLike);
dislikeBtn.addEventListener('click',doDislike);
undoBtn.addEventListener('click',undo);
doneBtn.addEventListener('click',()=>{ swipeArea.classList.add('hidden'); landing.classList.remove('hidden'); showLiked(); });

// touch + mouse
card.addEventListener('touchstart', e=>pointerDown(e.touches[0].clientX,e.touches[0].clientY),{passive:true});
card.addEventListener('touchmove', e=>{e.preventDefault(); pointerMove(e.touches[0].clientX,e.touches[0].clientY);},{passive:false});
card.addEventListener('touchend', e=>pointerUp(e.changedTouches[0].clientX,e.changedTouches[0].clientY));

card.addEventListener('mousedown', e=>{ pointerDown(e.clientX,e.clientY); const move=ev=>pointerMove(ev.clientX,ev.clientY); const up=ev=>{ pointerUp(ev.clientX,ev.clientY); window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); }; window.addEventListener('mousemove',move); window.addEventListener('mouseup',up); });

showLiked();
