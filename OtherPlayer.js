// ===================== OTHER PLAYERS MODULE =====================
const otherPlayers = [];
const playerThreeLetterNames = [
  "Vô Thường", "Huyết Kiếm", "Lãnh Nguyệt", "Thiên Long", "Bạch Hổ",
  "Hắc Vân", "Tử Thần", "Phi Đao", "Kiếm Vương", "Đao Cuồng",
  "Thanh Phong", "Huyền Băng", "Liệt Hỏa", "Ám Dạ", "Tinh Vân"
];
const directions = [0,1,2,3,4,5,6,7];

// Tạo 10 người chơi khác
function spawnOtherPlayers() {
  for (let i = 0; i < 10; i++) {
    const name = playerThreeLetterNames[Math.floor(Math.random() * playerThreeLetterNames.length)];
    const color = `hsl(${Math.random() * 360}, 80%, 60%)`;
    const x = EDGE_MARGIN + Math.random() * (mapWidth - 2 * EDGE_MARGIN);
    const y = EDGE_MARGIN + Math.random() * (mapHeight - 2 * EDGE_MARGIN);
    const maxHp = 80 + Math.random() * 120;
    const hp = Math.random() * maxHp;

    otherPlayers.push({
      x, y, baseX: x, baseY: y,
      dir: Math.floor(Math.random() * 8),
      moveDir: 0,
      state: 'Stand',
      color,
      radius: 12,
      name,
      hp, maxHp,
      moveSpeed: 0.3 + Math.random() * 0.2,
      actionTimer: 1000 + Math.random() * 2000,
      nameColor: '#00ffff'
    });
  }
}

// Cập nhật di chuyển & hành vi người chơi khác
function updateOtherPlayers() {
  for (const p of otherPlayers) {
    p.actionTimer -= 16;

    if (p.state === 'Stand') {
      if (p.actionTimer <= 0 && Math.random() < 0.08) {
        p.state = 'Walk';
        p.dir = Math.floor(Math.random() * 8);
        p.moveDir = p.dir;
        p.actionTimer = 1500 + Math.random() * 2500;
      }
    }
    else if (p.state === 'Walk') {
      const angle = ((p.dir * 45) + 90) * Math.PI / 180;
      p.x += Math.cos(angle) * p.moveSpeed;
      p.y += Math.sin(angle) * p.moveSpeed;

      // Giới hạn trong vùng cho phép
      if (p.x < EDGE_MARGIN || p.x > mapWidth - EDGE_MARGIN ||
          p.y < EDGE_MARGIN || p.y > mapHeight - EDGE_MARGIN) {
        p.x = Math.max(EDGE_MARGIN, Math.min(p.x, mapWidth - EDGE_MARGIN));
        p.y = Math.max(EDGE_MARGIN, Math.min(p.y, mapHeight - EDGE_MARGIN));
        p.state = 'Stand';
        p.actionTimer = 1000 + Math.random() * 2000;
      }

      // Quay về gần vị trí gốc
      const distFromBase = Math.hypot(p.x - p.baseX, p.y - p.baseY);
      if (distFromBase > 80 || p.actionTimer <= 0) {
        p.state = 'Stand';
        p.actionTimer = 1000 + Math.random() * 3000;
      }
    }
  }
}

// Vẽ người chơi khác
function drawOtherPlayers(ctx, camX, camY, canvas) {
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  for (const p of otherPlayers) {
    const cx = p.x - camX;
    const cy = p.y - camY;
    const footY = cy + p.radius;

    // Kiểm tra trong tầm nhìn
    if (cx + 50 < 0 || cx - 50 > canvas.width || footY + 50 < 0 || footY - 50 > canvas.height) continue;

    // Bóng tròn dưới chân
    ctx.beginPath();
    ctx.ellipse(cx, footY + 5, 16, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fill();

    // Vẽ thân (hình tròn)
    ctx.beginPath();
    ctx.arc(cx, cy, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Tên
    const nameY = cy - p.radius - 8;
    ctx.fillStyle = p.nameColor;
    ctx.fillText(p.name, cx, nameY);

    // Thanh HP
    const barWidth = 40, barHeight = 4;
    const hpPercent = Math.max(0, Math.min(1, p.hp / p.maxHp));
    const bx = cx - barWidth / 2;
    const by = nameY + 8;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, barWidth, barHeight);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(bx, by, barWidth * hpPercent, barHeight);
  }
}
// ==========================================================
