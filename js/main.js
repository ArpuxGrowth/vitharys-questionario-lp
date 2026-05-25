const BLOCOS = [
  "Metabolismo & Peso",
  "Energia & Vitalidade",
  "Sono & Recuperação",
  "Hormonal",
  "Força & Composição",
  "Saúde Preventiva",
];
const BLOCO_MAP = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]; // which bloco each question belongs to
const TOTAL_Q = 12;
const MAX_SCORE = 96;

let current = 0;
let answers = new Array(TOTAL_Q).fill(null);
let cards = document.querySelectorAll(".q-card");

function updateProgress(idx) {
  const i = idx !== undefined ? idx : current;
  const pct = Math.max(8, Math.round(((i + 1) / TOTAL_Q) * 100));
  document.getElementById("progBar").style.width = pct + "%";
  document.getElementById("progCount").textContent = i + 1 + " / " + TOTAL_Q;
  document.getElementById("blocoLabel").textContent =
    "Bloco " + (BLOCO_MAP[i] + 1) + " — " + BLOCOS[BLOCO_MAP[i]];
}

function showCard(idx) {
  cards.forEach((c) => {
    c.classList.remove("active", "exit");
    c.style.display = "none";
  });
  if (idx < TOTAL_Q) {
    const card = cards[idx];
    card.style.display = "block";
    requestAnimationFrame(() => {
      card.classList.add("active");
    });
    updateProgress(idx);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

let transitioning = false;
function nextQ() {
  if (transitioning) return;
  transitioning = true;
  if (current < TOTAL_Q - 1) {
    cards[current].classList.add("exit");
    setTimeout(() => {
      current++;
      showCard(current);
      transitioning = false;
    }, 340);
  } else {
    setTimeout(() => {
      showResult();
      transitioning = false;
    }, 200);
  }
}

// Bind option buttons
cards.forEach((card, qi) => {
  card.querySelectorAll(".opt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // mark selected
      card
        .querySelectorAll(".opt-btn")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      answers[qi] = parseInt(btn.dataset.val);
      // auto-advance after brief delay
      setTimeout(nextQ, 420);
    });
  });
});

function calcPilarScores() {
  // Each pilar has 2 questions, max 16 pts → convert to 0–100
  const scores = [];
  for (let p = 0; p < 6; p++) {
    const qIdx = [p * 2, p * 2 + 1];
    const sum = qIdx.reduce((acc, i) => acc + (answers[i] || 0), 0);
    scores.push(Math.round((sum / 16) * 100));
  }
  return scores;
}

function showResult() {
  document.getElementById("quiz").style.display = "none";
  const el = document.getElementById("result");
  el.style.display = "block";
  requestAnimationFrame(() => {
    el.classList.add("show");
  });

  const total = answers.reduce((a, b) => (a || 0) + (b || 0), 0);
  const pct = Math.round((total / MAX_SCORE) * 100);

  // animated count
  let n = 0;
  const scoreEl = document.getElementById("scoreNum");
  const ticker = setInterval(() => {
    n += Math.ceil((pct - n) / 8);
    if (n >= pct) {
      n = pct;
      clearInterval(ticker);
    }
    scoreEl.textContent = n;
  }, 40);

  // badge & message
  let badge, msg;
  if (pct <= 49) {
    badge = "Alerta Metabólico";
    msg =
      "Seu resultado mostra sinais iniciais de desaceleração metabólica e hormonal — comuns após os 40, mas totalmente reversíveis com a abordagem correta.";
  } else if (pct <= 69) {
    badge = "Zona de Transição";
    msg =
      "Seu resultado indica perda progressiva de performance e saúde. Com ajustes direcionados você pode reverter esse quadro com rapidez.";
  } else if (pct <= 84) {
    badge = "Boa Base";
    msg =
      "Você já tem uma boa base de saúde, mas ainda existem pontos importantes que podem estar acelerando seu envelhecimento silenciosamente.";
  } else {
    badge = "Longevidade Otimizada";
    msg =
      "Seu perfil está acima da média. Ajustes finos podem otimizar ainda mais sua longevidade e performance.";
  }
  document.getElementById("scoreBadge").textContent = badge;
  document.getElementById("resultMsg").textContent = msg;

  // capture for share
  _shareScores = calcPilarScores();
  _sharePct = pct;
  _shareBadge = badge;

  // Pilares
  const pilarScores = _shareScores;
  const grid = document.getElementById("pilaresGrid");
  grid.innerHTML = "";
  BLOCOS.forEach((name, i) => {
    const div = document.createElement("div");
    div.className = "pilar-card";
    div.innerHTML = `<div class="pilar-name">${name}</div>
      <div class="pilar-score-bar-bg"><div class="pilar-score-bar" style="width:0%" id="pb${i}"></div></div>
      <div class="pilar-score-val">${pilarScores[i]}</div>`;
    grid.appendChild(div);
  });
  // animate bars
  setTimeout(() => {
    BLOCOS.forEach((_, i) => {
      document.getElementById("pb" + i).style.width = pilarScores[i] + "%";
    });
  }, 300);

  // Radar canvas
  setTimeout(() => drawRadar(pilarScores), 400);
}

function drawRadar(scores) {
  const canvas = document.getElementById("radarCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width,
    H = canvas.height;
  const cx = W / 2,
    cy = H / 2,
    R = W * 0.38;
  const N = 6;
  const labels = [
    "Metabolismo",
    "Energia",
    "Sono",
    "Hormonal",
    "Força",
    "Preventiva",
  ];
  const angleStep = (Math.PI * 2) / N;
  const startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, W, H);

  // web lines
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = startAngle + i * angleStep;
      const r = (R * ring) / 4;
      const x = cx + Math.cos(a) * r,
        y = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "rgba(211,211,179,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // spokes
  for (let i = 0; i < N; i++) {
    const a = startAngle + i * angleStep;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.strokeStyle = "rgba(211,211,179,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // data polygon
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const a = startAngle + i * angleStep;
    const r = R * (scores[i] / 100);
    const x = cx + Math.cos(a) * r,
      y = cy + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(211,211,179,0.1)";
  ctx.fill();
  ctx.strokeStyle = "rgba(211,211,179,0.45)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // dots
  for (let i = 0; i < N; i++) {
    const a = startAngle + i * angleStep;
    const r = R * (scores[i] / 100);
    const x = cx + Math.cos(a) * r,
      y = cy + Math.sin(a) * r;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(211,211,179,0.7)";
    ctx.fill();
  }

  // labels
  ctx.font = '200 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = "rgba(211,211,179,0.38)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const LR = R + 22;
  for (let i = 0; i < N; i++) {
    const a = startAngle + i * angleStep;
    const x = cx + Math.cos(a) * LR,
      y = cy + Math.sin(a) * LR;
    ctx.fillText(labels[i], x, y);
  }
}

function restart() {
  current = 0;
  answers = new Array(TOTAL_Q).fill(null);
  document.getElementById("result").classList.remove("show");
  document.getElementById("result").style.display = "none";
  document.getElementById("quiz").style.display = "block";
  cards.forEach((c) => {
    c.classList.remove("active", "exit", "selected");
    c.style.display = "none";
    c.querySelectorAll(".opt-btn").forEach((b) =>
      b.classList.remove("selected"),
    );
  });
  showCard(0);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── SHARE CARD ──
let _shareScores = [];
let _sharePct = 0;
let _shareBadge = "";

function openShare() {
  document.getElementById("shareOverlay").classList.add("open");
  drawShareCard();
}
function closeShare() {
  document.getElementById("shareOverlay").classList.remove("open");
}

function drawShareCard() {
  const canvas = document.getElementById("shareCanvas");
  const ctx = canvas.getContext("2d");
  const W = 540,
    H = 960;
  ctx.clearRect(0, 0, W, H);

  // BG gradient
  ctx.fillStyle = "#2A3120";
  ctx.fillRect(0, 0, W, H);

  // texture lines
  ctx.strokeStyle = "rgba(255,255,255,0.012)";
  ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // vignette radial
  const vig = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, W);
  vig.addColorStop(0, "rgba(10,14,7,0.5)");
  vig.addColorStop(1, "transparent");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // top line
  const tl = ctx.createLinearGradient(0, 0, W, 0);
  tl.addColorStop(0, "transparent");
  tl.addColorStop(0.2, "rgba(211,211,179,0.35)");
  tl.addColorStop(0.5, "rgba(228,224,198,0.65)");
  tl.addColorStop(0.8, "rgba(211,211,179,0.35)");
  tl.addColorStop(1, "transparent");
  ctx.fillStyle = tl;
  ctx.fillRect(0, 0, W, 2);

  // bottom line
  const bl = ctx.createLinearGradient(0, 0, W, 0);
  bl.addColorStop(0, "transparent");
  bl.addColorStop(0.25, "rgba(211,211,179,0.25)");
  bl.addColorStop(0.5, "rgba(211,211,179,0.45)");
  bl.addColorStop(0.75, "rgba(211,211,179,0.25)");
  bl.addColorStop(1, "transparent");
  ctx.fillStyle = bl;
  ctx.fillRect(0, H - 2, W, 2);

  // LOGO WORDMARK
  ctx.font = '200 28px "Plus Jakarta Sans",sans-serif';
  ctx.fillStyle = "rgba(211,211,179,0.6)";
  ctx.letterSpacing = "12px";
  ctx.textAlign = "center";
  ctx.fillText("VITHARYS", W / 2, 88);
  ctx.font = '200 11px "Plus Jakarta Sans",sans-serif';
  ctx.fillStyle = "rgba(211,211,179,0.28)";
  ctx.fillText("MEDICINA INTEGRADA", W / 2, 112);

  // divider
  ctx.strokeStyle = "rgba(211,211,179,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 30, 132);
  ctx.lineTo(W / 2 + 30, 132);
  ctx.stroke();

  // SCORE label
  ctx.font = '200 13px "Plus Jakarta Sans",sans-serif';
  ctx.fillStyle = "rgba(211,211,179,0.3)";
  ctx.letterSpacing = "4px";
  ctx.fillText("SEU SCORE DE LONGEVIDADE", W / 2, 170);

  // SCORE NUMBER
  ctx.font = '100 148px "Plus Jakarta Sans",sans-serif';
  ctx.fillStyle = "rgba(240,234,222,0.88)";
  ctx.letterSpacing = "-4px";
  ctx.fillText(_sharePct, W / 2, 320);

  // /100
  ctx.font = '200 18px "Plus Jakarta Sans",sans-serif';
  ctx.fillStyle = "rgba(211,211,179,0.28)";
  ctx.letterSpacing = "2px";
  ctx.fillText("DE 100", W / 2, 358);

  // BADGE
  ctx.font = '300 13px "Plus Jakarta Sans",sans-serif';
  ctx.fillStyle = "rgba(211,211,179,0.55)";
  ctx.letterSpacing = "3px";
  const badge = _shareBadge.toUpperCase();
  const bw = ctx.measureText(badge).width + 40;
  const bx = (W - bw) / 2,
    by = 382;
  ctx.strokeStyle = "rgba(211,211,179,0.22)";
  ctx.lineWidth = 1;
  ctx.strokeRect(bx, by, bw, 30);
  ctx.fillText(badge, W / 2, by + 20);

  // RADAR
  const rcx = W / 2,
    rcy = 580,
    rR = 150;
  const N = 6,
    aStep = (Math.PI * 2) / N,
    aStart = -Math.PI / 2;
  const rlabels = [
    "Metabolismo",
    "Energia",
    "Sono",
    "Hormonal",
    "Força",
    "Preventiva",
  ];

  // grid rings
  for (let ring = 1; ring <= 4; ring++) {
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = aStart + i * aStep,
        r = (rR * ring) / 4;
      const x = rcx + Math.cos(a) * r,
        y = rcy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = "rgba(211,211,179,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // spokes
  for (let i = 0; i < N; i++) {
    const a = aStart + i * aStep;
    ctx.beginPath();
    ctx.moveTo(rcx, rcy);
    ctx.lineTo(rcx + Math.cos(a) * rR, rcy + Math.sin(a) * rR);
    ctx.strokeStyle = "rgba(211,211,179,0.1)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  // data
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const a = aStart + i * aStep,
      r = rR * (_shareScores[i] / 100);
    const x = rcx + Math.cos(a) * r,
      y = rcy + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(211,211,179,0.12)";
  ctx.fill();
  ctx.strokeStyle = "rgba(211,211,179,0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
  // dots
  for (let i = 0; i < N; i++) {
    const a = aStart + i * aStep,
      r = rR * (_shareScores[i] / 100);
    const x = rcx + Math.cos(a) * r,
      y = rcy + Math.sin(a) * r;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(211,211,179,0.75)";
    ctx.fill();
  }
  // labels
  const LR = rR + 26;
  ctx.font = '300 13px "Plus Jakarta Sans",sans-serif';
  ctx.fillStyle = "rgba(211,211,179,0.38)";
  ctx.letterSpacing = "1px";
  for (let i = 0; i < N; i++) {
    const a = aStart + i * aStep;
    const x = rcx + Math.cos(a) * LR,
      y = rcy + Math.sin(a) * LR;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(rlabels[i], x, y);
  }

  // PILARES scores below radar
  const ps = _shareScores;
  const names = [
    "Metabolismo",
    "Energia",
    "Sono",
    "Hormonal",
    "Força",
    "Preventiva",
  ];
  const colW = W / 3,
    rowH = 70;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i < 6; i++) {
    const col = i % 3,
      row = Math.floor(i / 3);
    const px = col * colW + colW / 2,
      py = 760 + row * rowH;
    ctx.font = '200 22px "Plus Jakarta Sans",sans-serif';
    ctx.fillStyle = "rgba(240,234,222,0.75)";
    ctx.fillText(ps[i], px, py);
    ctx.font = '200 9px "Plus Jakarta Sans",sans-serif';
    ctx.fillStyle = "rgba(211,211,179,0.3)";
    ctx.fillText(names[i].toUpperCase(), px, py + 28);
    // mini bar
    const barW = 60,
      barH = 1,
      bx = px - barW / 2,
      by2 = py + 44;
    ctx.fillStyle = "rgba(211,211,179,0.1)";
    ctx.fillRect(bx, by2, barW, barH);
    ctx.fillStyle = "rgba(211,211,179,0.4)";
    ctx.fillRect(bx, by2, barW * (ps[i] / 100), barH);
  }

  // bottom tag
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '200 11px "Plus Jakarta Sans",sans-serif';
  ctx.fillStyle = "rgba(211,211,179,0.2)";
  ctx.letterSpacing = "2px";
  ctx.fillText("vitharys.com.br", W / 2, 938);
}

function downloadShare() {
  const canvas = document.getElementById("shareCanvas");
  const link = document.createElement("a");
  link.download = "vitharys-longevidade.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// init
showCard(0);
