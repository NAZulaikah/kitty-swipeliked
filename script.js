const TOTAL = 15;
const PRELOAD_AHEAD = 3;

const card = document.getElementById('card');
const cardImage = document.getElementById('cardImage');

const likeBtn = document.getElementById('likeBtn');
const dislikeBtn = document.getElementById('dislikeBtn');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');

const likedListEl = document.getElementById('likedList');
const likedCountEl = document.getElementById('likedCount');

const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');

let images = [];
let index = 0;
let liked = JSON.parse(localStorage.getItem('likedCats') || '[]');
let history = [];

function catURL(){ return `https://cataas.com/cat?${Math.random()}`; }
function generateImages(){ images = Array.from({length:TOTAL},()=>catURL()); }
function preloadAt(i){ for(let j=i;j<Math.min(images.length,i+PRELOAD_AHEAD);j++){ const img=new Image(); img.src = images[j]; } }

function updateProgress(){ 
  progressText.textContent = `Cat ${Math.min(index+1,TOTAL)} of ${TOTAL}`;
  progressFill.style.width = `${Math.round((index/TOTAL)*100)}%`;
}

function showLiked(){
  likedListEl.innerHTML='';
  if(liked.length===0){ likedCountEl.textContent = '❤️ 0 cats'; return; }
  liked.forEach(url=>{
    const img=document.createElement('img'); 
    img.src=url; 
    likedListEl.appendChild(img);
  });
  likedCountEl.textContent = `❤️ ${liked.length} cat${liked.length>1?'s':''}`;
}

function renderCard(){
  if(index>=images.length){ index=0; generateImages(); }
  const url = images[index];
  cardImage.src = url;
  preloadAt(index+1);
  updateProgress();
}

function resetCardPosition(){ card.style.transform='translateX(0) rotate(0)'; hideOverlay(); }

function showOverlay(kind){ if(kind==='like'){ document.querySelector('.overlay-like').style.opacity='1'; document.querySelector('.overlay-dislike').style.opacity='0'; } else { document.querySelector('.overlay-dislike').style.opacity='1'; document.querySelector('.overlay-like').style.opacity='0'; } }
function hideOverlay(){ document.querySelector('.overlay-like').style.opacity='0'; document.querySelector('.overlay-dislike').style.opacity='0'; }

function doLike(){ history.push({idx:index,liked:true}); liked.push(images[index]); localStorage.setItem('likedCats',JSON.stringify(liked)); showLiked(); card.style.transform=`translateX(500px) rotate(30deg)`; setTimeout(()=>{ index++; renderCard(); resetCardPosition(); },300); }
function doDislike(){ history.push({idx:index,liked:false}); card.style.transform=`translateX(-500px) rotate(-30deg)`; setTimeout(()=>{ index++; renderCard(); resetCardPosition(); },300); }
function undo(){ const last=history.pop(); if(!last) return; index=last.idx; if(last.liked){ liked.pop(); localStorage.setItem('likedCats',JSON.stringify(liked)); showLiked(); } renderCard(); }

let startX=0, dragging=false;
function pointerDown(x){ dragging=true; startX=x; card.style.transition='none'; }
function pointerMove(x){ if(!dragging) return; const dx=x-startX; card.style.transform=`translateX(${dx}px) rotate(${dx/20}deg)`; if(dx>0) showOverlay('like'); else showOverlay('dislike'); }
function pointerUp(x){ if(!dragging) return; dragging=false; card.style.transition='transform 0.3s ease'; const dx=x-startX; if(dx>120) doLike(); else if(dx<-120) doDislike(); else resetCardPosition(); }

likeBtn.addEventListener('click',doLike);
dislikeBtn.addEventListener('click',doDislike);
undoBtn.addEventListener('click',undo);
clearBtn.addEventListener('click',()=>{ liked=[]; localStorage.setItem('likedCats',JSON.stringify(liked)); showLiked(); });

card.addEventListener('mousedown', e=>{ pointerDown(e.clientX); const move=ev=>pointerMove(ev.clientX); const up=ev=>{ pointerUp(ev.clientX); window.removeEventListener('mousemove',move); window.removeEventListener('mouseup',up); }; window.addEventListener('mousemove',move); window.addEventListener('mouseup',up); });
card.addEventListener('touchstart', e=>pointerDown(e.touches[0].clientX), {passive:true});
card.addEventListener('touchmove', e=>{ e.preventDefault(); pointerMove(e.touches[0].clientX); }, {passive:false});
card.addEventListener('touchend', e=>pointerUp(e.changedTouches[0].clientX));

generateImages();
showLiked();
renderCard();
