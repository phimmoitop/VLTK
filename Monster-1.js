// ===================== MONSTER MODULE – SIÊU TỐI ƯU 2500+ =====================
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

// ===== CULLING HELPER =====
function isInView(x, y, camX, camY, canvas) {
  const margin = 200;
  return x >= (camX - margin) && x <= (camX + canvas.width + margin) &&
         y >= (camY - margin) && y <= (camY + canvas.height + margin);
}

// ===== SPAWN (GIỮ NGUYÊN - ĐÃ TỐT) =====
function getFrames(id, state, dir) {
  return spriteData?.[id]?.[state]?.[dir] || [];
}

function spawnMonsters() {
  for (let i = 0; i < 2500; i++) {
    const id = monsterIds[Math.floor(Math.random() * monsterIds.length)];
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const standFrames = Object.values(getFrames(id, 'Stand', dir));
    if (!standFrames.length) { i--; continue; }
    const x = EDGE_MARGIN + Math.random() * (mapWidth - 2 * EDGE_MARGIN);
    const y = EDGE_MARGIN + Math.random() * (mapHeight - 2 * EDGE_MARGIN);
    const name = monsterInfo[id];
    const maxHp = 50 + Math.random() * 150;
    const hp = Math.random() * maxHp;
    const f0 = standFrames[0];
    const nameColor = Math.random() < 0.05 ? '#0040ff' : 'white';
    monsters.push({
      id, name, x, y, baseX: x, baseY: y,
      dir, moveDir: dir,
      state: 'Stand',
      frames: standFrames,
      currentFrame: 0,
      frameTime: 0,
      frameRate: 100 + Math.random() * 100,
      fixedHeight: f0.h,
      fixedWidth: f0.w,
      hp, maxHp,
      moveSpeed: 0.25,
      actionTimer: 1000 + Math.random() * 2000,
      nameColor
    });
  }
}

// ===== UPDATE TỐI ƯU: CHỈ UPDATE GẦN PLAYER (1500px) =====
function updateMonsters() {
  const updateRadiusSq = 1500 * 1500;
  const px = playerX, py = playerY;

  for (const m of monsters) {
    // CHỈ UPDATE MONSTER GẦN PLAYER
    if ((m.x - px) ** 2 + (m.y - py) ** 2 > updateRadiusSq) continue;

    // Animation frame (giữ nguyên)
    m.frameTime += 16;
    if (m.frameTime >= m.frameRate) {
      m.frameTime = 0;
      m.currentFrame = (m.currentFrame + 1) % m.frames.length;
    }

    m.actionTimer -= 16;
    if (m.state === 'Stand') {
      if (m.actionTimer <= 0 && Math.random() < 0.05) {
        m.state = 'Walk';
        m.dir = Math.floor(Math.random() * 8);
        m.moveDir = m.dir;
        m.frames = Object.values(getFrames(m.id, 'Walk', m.dir)) || m.frames;
        m.currentFrame = 0;
        m.actionTimer = 2000 + Math.random() * 2000;
      }
    }
    else if (m.state === 'Walk') {
      const angle = ((m.dir * 45) + 90) * Math.PI / 180;
      m.x += Math.cos(angle) * m.moveSpeed;
      m.y += Math.sin(angle) * m.moveSpeed;
      
      const distFromBaseSq = (m.x - m.baseX) ** 2 + (m.y - m.baseY) ** 2;
      if (Math.sqrt(distFromBaseSq) > 60 || m.actionTimer <= 0) {
        m.state = 'Stand';
        m.frames = Object.values(getFrames(m.id, 'Stand', m.dir)) || m.frames;
        m.currentFrame = 0;
        m.actionTimer = 1000 + Math.random() * 3000;
      }
      
      // Giới hạn biên (squared để nhanh)
      if (m.x < EDGE_MARGIN || m.x > mapWidth - EDGE_MARGIN || 
          m.y < EDGE_MARGIN || m.y > mapHeight - EDGE_MARGIN) {
        m.x = Math.max(EDGE_MARGIN, Math.min(m.x, mapWidth - EDGE_MARGIN));
        m.y = Math.max(EDGE_MARGIN, Math.min(m.y, mapHeight - EDGE_MARGIN));
        m.state = 'Stand';
        m.frames = Object.values(getFrames(m.id, 'Stand', (m.dir + 4) % 8)) || m.frames;
        m.actionTimer = 1500 + Math.random() * 2000;
      }
    }
  }
}

// ===== DRAW TỐI ƯU: BATCH + CULLING MẠNH =====
function drawMonsters(ctx, camX, camY, canvas) {
  // BATCH: Set state 1 LẦN cho tất cả 2500 monsters
  ctx.font = '15px Oswald';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.lineWidth = 1; // Thêm để ổn định

  for (const m of monsters) {
    // CULLING MẠNH: Chỉ vẽ trong màn hình + 200px margin
    if (!isInView(m.x, m.y, camX, camY, canvas)) continue;

    const f = m.frames[m.currentFrame];
    if (!f) continue;

    const cx = m.x - camX;
    const cy = m.y - camY;
    const sx = cx - f.w / 2;
    const sy = cy - m.fixedHeight + 10;

    // Screen culling cuối (nhanh)
    if (sx + f.w < 0 || sy + f.h < 0 || sx > canvas.width || sy > canvas.height) continue;

    const footY = sy + f.h - 3;
    const baseW = Math.max(8, f.w * 0.38);
    const baseH = Math.max(3, f.h * 0.07);
    const dir = m.moveDir ?? 0;
    
    // Shadow (giữ nguyên logic)
    let shadowW = baseW, shadowH = baseH, angle = 0;
    if (dir === 0 || dir === 4) {
      shadowW = baseW * 1.5; shadowH = baseH * 1.5;
    } else if (dir === 2 || dir === 6) {
      shadowW = baseW * 1.5; shadowH = baseH * 1.5;
    } else {
      shadowW = baseW * 1; shadowH = baseH * 2;
      angle = ((m.dir * 45) + 75) * Math.PI / 180;
    }
    
    ctx.save();
    ctx.translate(cx, footY);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, shadowW, shadowH, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fill();
    ctx.restore();

    // Name + HP (batch fillStyle)
    const nameY = cy - m.fixedHeight - 20;
    ctx.fillStyle = m.nameColor;
    ctx.fillText(m.name, cx, nameY);

    const barWidth = 50, barHeight = 5;
    const hpPercent = Math.max(0, Math.min(1, m.hp / m.maxHp));
    const bx = cx - barWidth / 2;
    const by = nameY + 5;
    ctx.fillStyle = '#555';
    ctx.fillRect(bx, by, barWidth, barHeight);
    ctx.fillStyle = 'limegreen';
    ctx.fillRect(bx, by, barWidth * hpPercent, barHeight);

    // Sprite (cuối cùng để không bị đè)
    ctx.drawImage(spriteSheetImage, f.x, f.y, f.w, f.h, sx, sy, f.w, f.h);
  }
}
// ==========================================================
