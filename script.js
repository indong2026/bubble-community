import {
  db,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "./firebase.js";

import { badWords } from "./badWords.js";

const world = document.getElementById("world");
const addBtn = document.getElementById("addBtn");
const writeSheet = document.getElementById("writeSheet");
const submitBtn = document.getElementById("submitBtn");
const titleInput = document.getElementById("titleInput");
const detailInput = document.getElementById("detailInput");

const bubbles = [];

let selectedBubble = null;

let currentPostId = null;

const commentSheet = document.getElementById("commentSheet");

const postTitle = document.getElementById("postTitle");

const postDetail = document.getElementById("postDetail");

const comments = document.getElementById("comments");

const commentInput = document.getElementById("commentInput");

const commentBtn = document.getElementById("commentBtn");

const commentOverlay = document.getElementById("commentOverlay");

commentOverlay.addEventListener("click", (e) => {
  if (e.target === commentOverlay) {
    commentOverlay.classList.remove("open");

    commentSheet.classList.remove("open");
  }
});

/* ---------------- 버블 생성 ---------------- */

function createBubble(data) {
  const bubble = {
    ...data,
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  };

  const div = document.createElement("div");
  div.className = "bubble";

  div.innerHTML = `
    <div class="commentCount">
      💬 ${data.commentCount || 0}
    </div>

    <div class="bubbleTitle">
      ${data.title}
    </div>
  `;

  bubble.element = div;

  world.appendChild(div);
  bubbles.push(bubble);

  div.addEventListener("pointerdown", (e) => {
    e.preventDefault();

    selectedBubble = bubble;
    bubble.dragging = true;

    bubble.offsetX = e.clientX - bubble.x;
    bubble.offsetY = e.clientY - bubble.y;
  });

  div.onclick = () => {
    openPost(bubble);
  };
}

window.addEventListener("pointermove", (e) => {
  if (!selectedBubble) return;

  selectedBubble.x = e.clientX - selectedBubble.offsetX;

  selectedBubble.y = e.clientY - selectedBubble.offsetY;
});

window.addEventListener("pointerup", () => {
  if (!selectedBubble) return;

  selectedBubble.dragging = false;
  selectedBubble = null;
});

/* ---------------- 게시글 불러오기 ---------------- */

async function loadPosts() {
  const DAY = 24 * 60 * 60 * 1000;

  const snapshot = await getDocs(collection(db, "posts"));

  for (const d of snapshot.docs) {
    const data = d.data();

    if (Date.now() - data.createdAt >= DAY) {
      await deleteDoc(doc(db, "posts", d.id));

      continue;
    }

    createBubble({
      id: d.id,
      ...data,
    });
  }
}

/* ---------------- 애니메이션 ---------------- */

function animate() {
  bubbles.forEach((b) => {
    if (!b.dragging) {
      b.x += b.vx;
      b.y += b.vy;
    }

    const width = b.element.offsetWidth;
    const height = b.element.offsetHeight;

    if (b.x <= 0 || b.x >= window.innerWidth - width) {
      b.vx *= -1;
    }

    if (b.y <= 70 || b.y >= window.innerHeight - height - 20) {
      b.vy *= -1;
    }

    b.element.style.left = b.x + "px";

    b.element.style.top = b.y + "px";
  });

  requestAnimationFrame(animate);
}

/* ---------------- 작성창 열기 ---------------- */

addBtn.onclick = () => {
  writeSheet.classList.add("open");
};

/* ---------------- 바깥 클릭 시 닫기 ---------------- */

document.addEventListener("click", (e) => {
  if (
    writeSheet.classList.contains("open") &&
    !writeSheet.contains(e.target) &&
    e.target !== addBtn
  ) {
    writeSheet.classList.remove("open");
  }
});

/* ---------------- 게시글 작성 ---------------- */

submitBtn.onclick = async () => {
  const title = titleInput.value.trim();

  const detail = detailInput.value.trim();

  const angle = Math.random() * Math.PI * 2;

  const speed = Math.random() * 2 + 1.5;

  if (!title) {
    alert("메인 주제를 입력하세요.");
    return;
  }

  if (hasBadWord(title) || hasBadWord(detail)) {
    alert("비속어가 포함되어 있습니다.");
    return;
  }

  await addDoc(collection(db, "posts"), {
    title,
    detail,

    createdAt: Date.now(),
    expireAt: Date.now() + 86400000,
    commentCount: 0,

    x: window.innerWidth / 2 - 90,
    y: window.innerHeight / 2 - 50,

    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  });

  titleInput.value = "";
  detailInput.value = "";

  writeSheet.classList.remove("open");

  location.reload();
};

/* ---------------- 시작 ---------------- */
onSnapshot(collection(db, "posts"), (snapshot) => {
  world.innerHTML = "";
  bubbles.length = 0;

  snapshot.forEach((d) => {
    const data = d.data();

    if (Date.now() - data.createdAt >= 24 * 60 * 60 * 1000) {
      return;
    }

    createBubble({
      id: d.id,
      ...data,
    });
  });
});

animate();

async function openPost(bubble) {
  currentPostId = bubble.id;

  postTitle.textContent = bubble.title;

  postDetail.textContent = bubble.detail;

  commentOverlay.classList.add("open");
  commentSheet.classList.add("open");

  loadComments();
}

function loadComments() {
  comments.innerHTML = "";

  onSnapshot(collection(db, "comments"), (snapshot) => {
    comments.innerHTML = "";

    snapshot.forEach((docu) => {
      const data = docu.data();

      if (data.postId !== currentPostId) return;

      const div = document.createElement("div");

      div.className = "comment";

      div.textContent = data.text;

      comments.appendChild(div);
    });
  });
}

commentBtn.onclick = async () => {
  const text = commentInput.value.trim();

  if (!text) return;

  if (hasBadWord(text)) {
    alert("비속어가 포함되어 있습니다.");
    return;
  }

  await addDoc(collection(db, "comments"), {
    postId: currentPostId,
    text,
    createdAt: Date.now(),
  });

  const bubble = bubbles.find((b) => b.id === currentPostId);

  if (bubble) {
    bubble.commentCount = (bubble.commentCount || 0) + 1;

    await updateDoc(doc(db, "posts", currentPostId), {
      commentCount: bubble.commentCount,
    });

    const count = bubble.element.querySelector(".commentCount");

    if (count) {
      count.textContent = `💬 ${bubble.commentCount}`;
    }
  }

  commentInput.value = "";

  await loadComments();
};

function hasBadWord(text) {
  const lower = text.toLowerCase();

  return badWords.some((word) => lower.includes(word.toLowerCase()));
}