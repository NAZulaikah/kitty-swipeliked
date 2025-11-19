let liked = JSON.parse(localStorage.getItem("likedCats") || "[]");
let historyStack = [];
let total = 15;
let index = 1;

const landing = document.getElementById("landing");
const popup = document.getElementById("popup");
const likedGallery = document.getElementById("likedGallery");
const likeCount = document.getElementById("likeCount");
const card = document.getElementById("card");
const cardImage = document.getElementById("cardImage");

updateGallery();

/*------------------------
    LOAD RANDOM CAT
------------------------*/
function loadCat() {
  cardImage.src = `https://cataas.com/cat?${Date.now()}`;
}

/*------------------------
     OPEN POPUP
------------------------*/
document.getElementById("startBtn").onclick = () => {
  landing.classList.add("hidden");
  popup.classList.remove("hidden");
  index = 1;
  updateProgress();
  loadCat();
};

/*------------------------
  CLOSE POPUP
------------------------*/
document.getElementById("closePopup").onclick = () => {
  popup.classList.add("hidden");
  landing.classList.remove("hidden");
};

/*------------------------
  LIKE / DISLIKE
------------------------*/
document.getElementById("likeBtn").onclick = () => {
  liked.push(cardImage.src);
  historyStack.push({ img: cardImage.src, action: "like" });
  nextCat();
};

document.getElementById("dislikeBtn").onclick = () => {
  historyStack.push({ img: cardImage.src, action: "dislike" });
  nextCat();
};

/* Undo */
document.getElementById("undoBtn").onclick = () => {
  const last = historyStack.pop();
  if (!last) return;

  if (last.action === "like") {
    liked.pop();
  }
  index--;
  updateProgress();
  cardImage.src = last.img;
};

/*------------------------
      NEXT CAT
------------------------*/
function nextCat() {
  index++;
  updateProgress();

  if (index > total) {
    popup.classList.add("hidden");
    landing.classList.remove("hidden");
  }

  updateGallery();
  loadCat();
}

/*------------------------
     PROGRESS BAR
------------------------*/
function updateProgress() {
  document.getElementById("progressText").textContent = `Cat ${index} of ${total}`;
  document.getElementById("progressFill").style.width =
    ((index - 1) / total) * 100 + "%";
}

/*------------------------
     UPDATE GALLERY
------------------------*/
function updateGallery() {
  likedGallery.innerHTML = "";
  likeCount.textContent = liked.length;

  liked.forEach((img, i) => {
    const el = document.createElement("img");
    el.src = img;
    el.onclick = () => openLightbox(i);
    likedGallery.appendChild(el);
  });

  localStorage.setItem("likedCats", JSON.stringify(liked));

  document.getElementById("likedSection").classList.toggle(
    "hidden",
    liked.length === 0
  );
}

/*------------------------
  CLEAR LIKES
------------------------*/
document.getElementById("clearBtn").onclick = () => {
  liked = [];
  updateGallery();
  localStorage.removeItem("likedCats");
};

/*------------------------
 FULLSCREEN LIGHTBOX
------------------------*/
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
let currentSlide = 0;

function openLightbox(i) {
  currentSlide = i;
  lightboxImage.src = liked[i];
  lightbox.classList.remove("hidden");
}

document.querySelector(".lightbox-close").onclick = () =>
  lightbox.classList.add("hidden");

document.querySelector(".lightbox-next").onclick = () => {
  currentSlide = (currentSlide + 1) % liked.length;
  openLightbox(currentSlide);
};

document.querySelector(".lightbox-prev").onclick = () => {
  currentSlide = (currentSlide - 1 + liked.length) % liked.length;
  openLightbox(currentSlide);
};

/* Swipe support for slideshow */
lightbox.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX));
lightbox.addEventListener("touchend", (e) => {
  let dx = e.changedTouches[0].clientX - startX;
  if (dx > 60) document.querySelector(".lightbox-prev").click();
  if (dx < -60) document.querySelector(".lightbox-next").click();
});

/*------------------------
    DRAG SWIPE
------------------------*/
let isDragging = false;
let offset = 0;

card.addEventListener("touchstart", (e) => {
  isDragging = true;
  offset = e.touches[0].clientX;
});

card.addEventListener("touchmove", (e) => {
  if (!isDragging) return;
  const dx = e.touches[0].clientX - offset;

  card.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;

  document.querySelector(".overlay-like").style.opacity = dx > 60 ? 1 : 0;
  document.querySelector(".overlay-dislike").style.opacity = dx < -60 ? 1 : 0;
});

card.addEventListener("touchend", (e) => {
  isDragging = false;
  const dx = e.changedTouches[0].clientX - offset;

  if (dx > 120) document.getElementById("likeBtn").click();
  else if (dx < -120) document.getElementById("dislikeBtn").click();

  card.style.transform = "";
  document.querySelector(".overlay-like").style.opacity = 0;
  document.querySelector(".overlay-dislike").style.opacity = 0;
});
