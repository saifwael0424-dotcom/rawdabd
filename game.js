const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- Base design resolution ---
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

// --- Scale factor ---
let scaleX = 1;
let scaleY = 1;

// --- Resize canvas dynamically ---
function resizeCanvas() {
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight;

  // Scale to fit screen but maintain aspect ratio
  scaleX = maxWidth / BASE_WIDTH;
  scaleY = maxHeight / BASE_HEIGHT;
  const scale = Math.min(scaleX, scaleY);

  canvas.width = BASE_WIDTH * scale;
  canvas.height = BASE_HEIGHT * scale;

  scaleX = scaleY = scale;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// --- Images ---
const rawdaImg = new Image();
rawdaImg.src = "rawda.png";

const meImg = new Image();
meImg.src = "me.png";

const cakeImg = new Image();
cakeImg.src = "cake.png";

// --- Game state ---
let scene = "find"; // find, talk, follow, cake
const rawda = { x: 100, y: 200, r: 30 };
let t = 0; // animation timer
let firstMoveMade = false;

// --- NPCs ---
const npcPositions = [
  { x: 400, y: 300 },
  { x: 700, y: 200 },
];
let npcIndex = 0;
let npcActive = true;

// --- NPC dialogues ---
const npcDialogues = [
  ["احا بتقربي مني ليه يا ولية، ابعدي عني"],
  ["خخخخ مش قولتلك ابعدي عني، خلاص تعالي اوريكي حاجة"]
];
let dialogueIndex = 0;

// --- Flowers ---
const flowerPositions = [
  { x: 150, y: 150 },
  { x: 300, y: 100 },
  { x: 500, y: 180 },
  { x: 250, y: 250 },
  { x: 400, y: 80 },
];

// --- Confetti for cake ---
let confetti = [];
for (let i = 0; i < 100; i++) {
  confetti.push({
    x: Math.random() * BASE_WIDTH,
    y: Math.random() * BASE_HEIGHT,
    color: `hsl(${Math.random()*360},80%,60%)`,
    size: Math.random()*5 + 2,
    speed: Math.random() * 3 + 1
  });
}

// --- Movement ---
function move(dir) {
  firstMoveMade = true;
  if (scene !== "find") return;
  const speed = 15;

  if (dir === "left") rawda.x -= speed;
  if (dir === "right") rawda.x += speed;
  if (dir === "up") rawda.y -= speed;
  if (dir === "down") rawda.y += speed;

  // Keep Rawda inside canvas boundaries
  rawda.x = Math.max(rawda.r + 40, Math.min(BASE_WIDTH - rawda.r - 40, rawda.x));
  rawda.y = Math.max(rawda.r + 40, Math.min(BASE_HEIGHT - rawda.r - 40, rawda.y));
}

// --- Dialogue ---
function showDialogue(text) {
  const d = document.getElementById("dialogue");
  d.innerHTML = text + "<br><br><small>سيف:</small>";
  d.style.display = "block";
}

function nextDialogue() {
  const dialogues = npcDialogues[npcIndex]; // current NPC dialogues
  if (scene === "talk") {
    if (dialogueIndex < dialogues.length) {
      showDialogue(dialogues[dialogueIndex]);
      dialogueIndex++;
    } else {
      document.getElementById("dialogue").style.display = "none";
      dialogueIndex = 0;
      npcIndex++;
      if (npcIndex < npcPositions.length) {
        npcActive = true;
        scene = "find";
      } else {
        scene = "follow";
      }
    }
  }
}

// --- Character drawing ---
function drawGoofyCharacter(img, char, isMoving = false) {
  t += 0.05;

  const armSwing = isMoving ? Math.sin(t) * 4 : 0;
  const legOffset = isMoving ? Math.sin(t) * 2 : 0;

  // Scale positions for canvas
  const x = char.x * scaleX;
  const y = char.y * scaleY;
  const r = char.r * scaleX;

  // Legs
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 8*scaleX, y + 40*scaleY);
  ctx.lineTo(x - 8*scaleX, y + 70*scaleY + legOffset*scaleY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 8*scaleX, y + 40*scaleY);
  ctx.lineTo(x + 8*scaleX, y + 70*scaleY - legOffset*scaleY);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.moveTo(x, y + 30*scaleY);
  ctx.lineTo(x, y + 55*scaleY);
  ctx.stroke();

  // Arms
  ctx.beginPath();
  ctx.moveTo(x - 20*scaleX, y + 40*scaleY);
  ctx.lineTo(x - 20*scaleX - armSwing*scaleX, y + 40*scaleY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 20*scaleX, y + 40*scaleY);
  ctx.lineTo(x + 20*scaleX + armSwing*scaleX, y + 40*scaleY);
  ctx.stroke();

  // Head (photo)
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.clip();
  ctx.drawImage(img, x - r, y - r, r*2, r*2);
  ctx.restore();
}

// --- Draw confetti ---
function drawConfetti() {
  confetti.forEach(c => {
    const x = c.x * scaleX;
    const y = c.y * scaleY;
    const size = c.size * scaleX;
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI*2);
    ctx.fill();
    c.y += c.speed;
    if (c.y > BASE_HEIGHT) c.y = 0;
  });
}

// --- Draw multiline text ---
function drawMultilineText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lines = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight);
  }
}

// --- Game loop ---
function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // --- Background ---
  if (scene !== "cake") {
    ctx.fillStyle = "#6fbf73";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Flowers
    flowerPositions.forEach(f => {
      const x = f.x * scaleX;
      const y = f.y * scaleY;
      ctx.fillStyle = "pink";
      ctx.beginPath(); ctx.arc(x-5*scaleX, y, 5*scaleX, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+5*scaleX, y, 5*scaleX, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y-5*scaleY, 5*scaleY, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y+5*scaleY, 5*scaleY, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle="yellow";
      ctx.beginPath(); ctx.arc(x, y, 4*scaleX, 0, Math.PI*2); ctx.fill();
    });

    // Walls
    ctx.fillStyle = "#3a3a3a";
    ctx.fillRect(0,0,canvas.width,40*scaleY);
    ctx.fillRect(0,canvas.height-40*scaleY,canvas.width,40*scaleY);
    ctx.fillRect(0,0,40*scaleX,canvas.height);
    ctx.fillRect(canvas.width-40*scaleX,0,40*scaleX,canvas.height);
  }

  // --- Check NPC interaction ---
  if (npcActive && npcIndex < npcPositions.length && firstMoveMade) {
    const npc = npcPositions[npcIndex];
    const dx = rawda.x - npc.x;
    const dy = rawda.y - npc.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 50) {
      npcActive = false;
      scene = "talk";
      dialogueIndex = 0;
      nextDialogue(); // start first line
    }
  }

  // --- Follow logic ---
  if (scene === "follow") {
    rawda.x += 3;
    rawda.y = BASE_HEIGHT / 2; // keep centered vertically
    if (rawda.x > BASE_WIDTH - 200) scene = "cake";
  }

  // --- Cake scene ---
  if (scene === "cake") {
    ctx.fillStyle = "#ffb6c1";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.drawImage(cakeImg, canvas.width/2-80*scaleX, canvas.height/2-80*scaleY, 160*scaleX, 160*scaleY);

    ctx.fillStyle = "white";
    ctx.font = `${18*scaleX}px Arial`;
    ctx.textAlign = "center";

    const cakeMessage = "🎉 كل سنة وانتي طيبة يا روضتي، مقتنع اني مش هلاقي حد كويس زيك في حياتي كمية الحاجات الحلوة اللي انتي عملتيهالي مش قادر اوصفهالك ولا اعبرلك عنها بجد بجد اتمنى تكوني بخير على طول واتمنالك على طول عيد ميلاد تكوني كويسة ومبسوطة فيه وتكوني مع اللي بتحبيهم ودايمًا وع طول كوني اجمل بنوتة يا روضتي 🎉";

    drawMultilineText(ctx, cakeMessage, canvas.width/2, canvas.height/2 + 120*scaleY, canvas.width * 0.8, 28*scaleY);

    drawConfetti();
    requestAnimationFrame(update);
    return;
  }

  // --- Draw Rawda ---
  drawGoofyCharacter(rawdaImg, rawda, scene==="find");

  // --- Draw current NPC ---
  if (npcActive && npcIndex < npcPositions.length) {
    drawGoofyCharacter(meImg, npcPositions[npcIndex], false);
  }

  requestAnimationFrame(update);
}

// --- Start game after images load ---
let imagesLoaded = 0;
function checkImagesLoaded() {
  imagesLoaded++;
  if(imagesLoaded===3) update();
}

rawdaImg.onload = checkImagesLoaded;
meImg.onload = checkImagesLoaded;
cakeImg.onload = checkImagesLoaded;
