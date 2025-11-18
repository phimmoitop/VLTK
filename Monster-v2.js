// ===================== MONSTER MODULE – TỐI ƯU + FIX LỖI =====================
const spriteSheetImage = new Image();
spriteSheetImage.src = 'https://p21-ad-sg.ibyteimg.com/obj/ad-site-i18n-sg/202511075d0d41e0fec7eef441688304';
const MONSTER_CSV_URL = 'https://raw.githubusercontent.com/phimmoitop/VLTK/refs/heads/main/Monster-v1.csv';

const monsters = [];
const monsterInfo = {
  ani001: "Đông Bắc Hổ", ani002: "Hoa Nam Hổ", ani003: "Bạch Ngọc Hổ",
  ani005: "Kim Tiền Báo", ani009: "Sói Xám", ani010: "Sói Nâu",
  ani011: "Sói Xanh", ani012: "Sói Tuyết", ani018: "Heo Rừng",
  ani019: "Nhím Xù", ani029: "Trâu Rừng", ani049: "Kim Miêu",
  ani052: "Linh Miêu", ani054: "Lục Diệp Hầu", ani055: "Hắc Diệp Hầu",
  ani056: "Kim Tơ Hầu", ani061: "Hươu Đốm", ani063: "Heo Trắng",
  enemy129: "Lang Bổng", enemy135: "Đao Tử", enemy137: "Ảnh Côn",
  enemy140: "Phá Lang", enemy150: "Sương Đao",
};
const monsterIds = Object.keys(monsterInfo);
const directions = [0,1,2,3,4,5,6,7];

function getMonsterFrame(monsterId, action, dir, frame) {
  const key = `${monsterId}-${action}-${dir}-${frame}`;
  return monsterSpriteData[key] || null;
}

// Lấy danh sách frame cho 1 action + direction
function getMonsterFrames(monsterId, action, dir) {
  const frames = [];
  let i = 1;
  while (true) {
    const frame = getMonsterFrame(monsterId, action, dir, i);
    if (!frame) break;
    frames.push(frame);
    i++;
  }
  return frames.length > 0 ? frames : null;
}

async function loadMonsterSpritesFromCSV() {
  try {
    const res = await fetch(MONSTER_CSV_URL + '?t=' + Date.now()); // bypass cache
    const text = await res.text();
    const lines = text.trim().split('\n');
    
    // Bỏ qua header nếu có
    const dataLines = lines[0].includes('id,x,y,w,h') ? lines.slice(1) : lines;
    
    for (const line of dataLines) {
      if (!line.trim()) continue;
      const [id, x, y, w, h] = line.split(',').map(s => s.trim());
      if (!id || !x || !y || !w || !h) continue;
      monsterSpriteData[id] = {
        x: parseInt(x),
        y: parseInt(y),
        w: parseInt(w),
        h: parseInt(h),
		anchorY: Math.floor(h * 0.935)
      };
    }
    console.log(`✅ Đã load ${Object.keys(monsterSpriteData).length} frame monster từ CSV`);
  } catch (err) {
    console.error("Lỗi load CSV monster:", err);
  }
}


// ✅ CULLING HELPER (THÊM MỚI)
function isInViewMonster(x, y, camX, camY, canvas) {
  const margin = 250; // Margin rộng hơn để quái không "biến mất" đột ngột
  return x >= (camX - margin) && x <= (camX + canvas.width + margin) &&
         y >= (camY - margin) && y <= (camY + canvas.height + margin);
}

// SPAWN (GIỮ NGUYÊN)
function spawnMonsters() {
  const monsterTypes = Object.keys(monsterInfo);
  for (let i = 0; i < 2500; i++) {
    const id = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
    const dir = Math.floor(Math.random() * 8);

    const standFrames = getMonsterFrames(id, 'Stand', dir) || getMonsterFrames(id, 'Stand', 0);
    if (!standFrames || standFrames.length === 0) {
      i--; continue;
    }

    const x = EDGE_MARGIN + Math.random() * (mapWidth - 2 * EDGE_MARGIN);
    const y = EDGE_MARGIN + Math.random() * (mapHeight - 2 * EDGE_MARGIN);

    monsters.push({
      id,
      name: monsterInfo[id],
      x, y,
      baseX: x, baseY: y,
      dir,
      state: 'Stand',
      frames: standFrames,
      currentFrame: 0,
      frameTimer: 0,
      frameDelay: 200, // ms mỗi frame
      hp: 10 + Math.random() * 90,
      maxHp: 100,
      moveSpeed: 0.3,
      actionTimer: 1000 + Math.random() * 3000,
      nameColor: Math.random() < 0.05 ? '#0040ff' : '#ffffff'
    });
  }
}

// UPDATE TỐI ƯU (FIX distFromBaseSq)
function updateMonsters() {
  const now = performance.now();
  const updateRadiusSq = 1800 * 1800;

  for (const m of monsters) {
    const dx = m.x - playerX;
    const dy = m.y - playerY;
    if (dx * dx + dy * dy > updateRadiusSq) continue;

    // Animation
    m.frameTimer += 16;
    if (m.frameTimer >= m.frameDelay) {
      m.frameTimer = 0;
      m.currentFrame = (m.currentFrame + 1) % m.frames.length;
    }

    // AI
    m.actionTimer -= 16;
    if (m.state === 'Stand' && m.actionTimer <= 0 && Math.random() < 0.04) {
      m.state = 'Walk';
      m.dir = Math.floor(Math.random() * 8);
      m.frames = getMonsterFrames(m.id, 'Walk', m.dir) || getMonsterFrames(m.id, 'Walk', 0) || m.frames;
      if (m.frames) m.currentFrame = 0;
      m.actionTimer = 3000 + Math.random() * 4000;
    }

    if (m.state === 'Walk') {
      const angle = (m.dir * 45 + 90) * Math.PI / 180;
      m.x += Math.cos(angle) * m.moveSpeed;
      m.y += Math.sin(angle) * m.moveSpeed;

      const distSq = (m.x - m.baseX) ** 2 + (m.y - m.baseY) ** 2;
      if (distSq > 80*80 || m.actionTimer <= 0) {
        m.state = 'Stand';
        m.frames = getMonsterFrames(m.id, 'Stand', m.dir) || m.frames;
        m.actionTimer = 2000 + Math.random() * 4000;
      }
    }
  }
}

function drawMonsters(ctx, camX, camY) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = '14px Oswald';

  const viewLeft = camX - 300;
  const viewRight = camX + canvas.width + 300;
  const viewTop = camY - 300;
  const viewBottom = camY + canvas.height + 300;

  for (const m of monsters) {
    if (m.x < viewLeft || m.x > viewRight || m.y < viewTop || m.y > viewBottom) continue;

    const frame = m.frames[m.currentFrame];
    if (!frame) continue;

    const screenX = m.x - camX;
    const screenY = m.y - camY;
    const drawX = screenX - frame.w / 2;
    const drawY = screenY - frame.anchorY;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 1, frame.w * 0.5, frame.w * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Name
    ctx.fillStyle = m.nameColor;
    ctx.fillText(m.name, screenX, screenY - frame.h - 10);

    // HP Bar
    const hpRatio = Math.max(0, m.hp / m.maxHp);
    ctx.fillStyle = '#333';
    ctx.fillRect(screenX - 25, screenY - frame.h - 5, 50, 5);
    ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ffeb3b' : 'red';
    ctx.fillRect(screenX - 25, screenY - frame.h - 5, 50 * hpRatio, 5);

    // Draw sprite
    ctx.drawImage(
      spriteSheetImage,
      frame.x, frame.y, frame.w, frame.h,
      drawX, drawY, frame.w, frame.h
    );
  }

}
// ==========================================================
