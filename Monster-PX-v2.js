// ============================================================================
// PHẦN 5: HỆ THỐNG MONSTER (Đã sửa đổi để dùng hệ tọa độ Map)
// ============================================================================

const monsterInfo = {
  ani001: "Đông Bắc Hổ", ani002: "Hoa Nam Hổ", ani003: "Bạch Ngọc Hổ",
  ani005: "Kim Tiền Báo", ani009: "Sói Xám", ani010: "Sói Nâu",
  ani011: "Sói Xanh", ani012: "Sói Tuyết", ani018: "Heo Rừng",
  ani019: "Nhím Xù", ani029: "Trâu Rừng", ani049: "Kim Miêu",
  ani052: "Linh Miêu", ani054: "Lục Diệp Hầu", ani055: "Hắc Diệp Hầu",
  ani056: "Kim Tơ Hầu", ani061: "Hươu Đốm", ani063: "Heo Nái",
  enemy129: "Lang Bổng", enemy135: "Đao Tử", enemy137: "Ảnh Côn",
  enemy140: "Phá Lang", enemy150: "Sương Đao",
};
const monsterKeys = Object.keys(monsterInfo);

function updateMonsterLogic(delta) {
    const mapW = currentMap.width;
    const mapH = currentMap.height;

    for (const entity of AllMonsters) {
        const mContainer = entity.container;

        if (entity.action === "Walk") {
            const targetX = entity.targetX;
            const targetY = entity.targetY;
            const speed = entity.speed;
           
            const dx = targetX - mContainer.x;
            const dy = targetY - mContainer.y;
            const distSq = dx*dx + dy*dy;
           
            // --- XỬ LÝ HƯỚNG (Mới) ---
            // Tính hướng dựa trên dx, dy
            const newDir = getDirectionIndex(dx, dy);
            
            // Nếu hướng thay đổi so với frame trước
            if (newDir !== entity.currentDir) {
                // Lấy frames mới đúng hướng
                const newFrames = getMonsterFrames(entity.monsterId, "Walk", newDir);
                
                // Nếu có frames thì set lại texture và play
                if (newFrames && newFrames.length > 0) {
                    entity.sprite.textures = newFrames;
                    entity.sprite.play();
                    entity.currentDir = newDir; // Cập nhật hướng hiện tại
                }
            }
            // --------------------------

            if (distSq < 25) { 
                // Đến đích: Random điểm mới
                let newX = mContainer.x + (Math.random() - 0.5) * 400;
                let newY = mContainer.y + (Math.random() - 0.5) * 400;

                entity.targetX = Math.max(50, Math.min(mapW - 50, newX));
                entity.targetY = Math.max(50, Math.min(mapH - 50, newY));
            } else {
                const dist = Math.sqrt(distSq);
                mContainer.x += (dx / dist) * speed * delta;
                mContainer.y += (dy / dist) * speed * delta;
            }
            
            mContainer.x = Math.max(50, Math.min(mapW - 50, mContainer.x));
            mContainer.y = Math.max(50, Math.min(mapH - 50, mContainer.y));
            
            mContainer.zIndex = mContainer.y;
        } else {
            mContainer.zIndex = mContainer.y;
        }
    }
    
    objectLayer.sortableChildren = true; 
    if (playerInfo.sprite) playerInfo.sprite.zIndex = playerInfo.y; 
}

function createRandomMonster() {
    const id = monsterKeys[Math.floor(Math.random() * monsterKeys.length)];
    const RandomMonsterName = monsterInfo[id];
    const action = "Walk"; // Mặc định đi bộ luôn để test hướng
    
    // Random hướng ban đầu
    const dir = directions[Math.floor(Math.random() * directions.length)];
    
    // Dùng hàm helper mới lấy frames
    const frames = getMonsterFrames(id, action, dir);
    
    if (frames.length === 0) {
        return createRandomMonster();
    }

    // --- Tạo Container và các thành phần (Code cũ của bạn giữ nguyên) ---
    const monsterContainer = new PIXI.Container();
    monsterContainer.x = Math.random() * currentMap.width;
    monsterContainer.y = Math.random() * currentMap.height;

    const AllMonster = new PIXI.AnimatedSprite(frames);
    AllMonster.animationSpeed = 0.05;
    AllMonster.loop = true;
    AllMonster.play();
    AllMonster.anchor.set(0.5, 0.5);
    AllMonster.x = 0; 
    AllMonster.y = 0;
    monsterContainer.addChild(AllMonster);
    MonsterNameText = createNameText(RandomMonsterName, AllMonster.height, 0x66ccff);
    monsterContainer.addChild(MonsterNameText); 
  
    const hpPercent = Math.random() * 0.9 + 0.1; 
    MonsterHPBar = CreatHPBar(AllMonster.height, 60, 8);
    monsterContainer.addChild(MonsterHPBar);
    MonsterHPBar.setPercent(hpPercent);
  
    // --- Logic Entity (CẬP NHẬT: Lưu thêm ID và Dir để xử lý đổi hướng) ---
    const monsterEntity = {
        monsterId: id, 
        currentDir: dir,
        container: monsterContainer,
        sprite: AllMonster,
        action: action,
        targetX: 0,
        targetY: 0,
        speed: 0,
    };
   
    if (action === "Walk") {
        monsterEntity.targetX = monsterContainer.x + (Math.random() - 0.5) * 400;
        monsterEntity.targetY = monsterContainer.y + (Math.random() - 0.5) * 400;
        
        monsterEntity.targetX = Math.max(50, Math.min(currentMap.width - 50, monsterEntity.targetX));
        monsterEntity.targetY = Math.max(50, Math.min(currentMap.height - 50, monsterEntity.targetY));
        
        monsterEntity.speed = 0.5 + Math.random();
    }
   
    AllMonsters.push(monsterEntity);
    objectLayer.addChild(monsterContainer); 
}
