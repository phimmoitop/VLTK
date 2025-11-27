// ============================================================================
// PHẦN 6: HỆ THỐNG OTHER PLAYERS (NGƯỜI CHƠI KHÁC)
// ============================================================================

const AllOtherPlayers = [];

// Danh sách tên ngẫu nhiên
const OtherPlayerNames = [
    "Độc Cô Cầu Bại", "Lệnh Hồ Xung", "Dương Quá", "Tiểu Long Nữ", "Quách Tĩnh",
    "Hoàng Dung", "Kiều Phong", "Hư Trúc", "Đoàn Dự", "Vương Ngữ Yên",
    "Đông Tà", "Tây Độc", "Nam Đế", "Bắc Cái", "Trung Thần Thông",
    "Lý Mạc Sầu", "Chu Bá Thông", "Tạ Tốn", "Trương Vô Kỵ", "Triệu Mẫn",
    "Chu Chỉ Nhược", "Tiểu Chiêu", "Dương Tiêu", "Phạm Dao", "Vi Nhất Tiếu",
    "Bạch Mi Ưng Vương", "Kim Mao Sư Vương", "Tử Sam Long Vương", "Thành Côn",
    "Huyền Minh Nhị Lão", "Trương Tam Phong", "Tống Viễn Kiều", "Du Liên Châu",
    "Du Đại Nham", "Trương Tùng Khê", "Trương Thúy Sơn", "Ân Lê Đình", "Mạc Thanh Cốc",
    "Diệt Tuyệt Sư Thái", "Kỷ Hiểu Phù", "Dương Bất Hối", "Tiểu Bảo", "Khang Hy",
    "Ngao Bái", "Trần Cận Nam", "Vi Tiểu Bảo", "Song Nhi", "A Kha", "Kiến Ninh", "Hàn Lão Ma", "Nam Cung Uyển", "Tử Linh Tiên Tử", "Mộ Phái Linh", "Mỹ Đỗ Toa", "Tiêu Viêm", "Đường Tam Tạng", "Lệ Phi Vũ", "Tôn Ngộ Không", "Mộc Kiếm Bình"
];
const TenBangHoi = [
  "Thích","Huyết Ma","Huynh Đệ","Sinh Tử","RockStorm","GALAXY","ThiênĐịaHội",
  "Thiên Ưng", "Tàn Sát"
];

function createOtherPlayer() {
    // 1. Cấu hình cơ bản
    const equipId = Math.random() < 0.5 ? Math.floor(Math.random() * 68) + 101 : Math.floor(Math.random() * 68) + 201;
    const name = OtherPlayerNames[Math.floor(Math.random() * OtherPlayerNames.length)];
    const OtherPlayerBangHoi = TenBangHoi[Math.floor(Math.random() * TenBangHoi.length)];
    // 2. Tạo Container chính
    const container = new PIXI.Container();
    
    // 3. Tạo Container Skin (Để xử lý lật ảnh)
    const skinContainer = new PIXI.Container();
    skinContainer.sortableChildren = true;
    container.addChild(skinContainer);

    // 4. Tạo 3 bộ phận (Thân, Tay Trái, Tay Phải)
    const parts = {};
    [0, 1, 2].forEach(partId => {
        const sprite = new PIXI.AnimatedSprite([PIXI.Texture.EMPTY]);
        sprite.anchor.set(0.5);
        sprite.visible = false;
        parts[partId] = sprite;
        skinContainer.addChild(sprite);
    });

    // 5. Tính toán chiều cao để đặt Tên & HP (Giống nhân vật chính)
    let realBodyHeight = 66; 
    const bodyData = getPlayerPartData("FreeStand", 0, 0, equipId);
    if (bodyData && bodyData.length > 0 && bodyData[0].texture) {
        realBodyHeight = bodyData[0].texture.height;
    }

    // 6. Tạo UI (Tên + HP)
	const lineSpacing = 25;
	const nameColors = [0xffffff, 0xFF7F00, 0x00f390, 0xCC33FF, 0xFF0000];
	const OtherPlayerNameColor = nameColors[Math.floor(Math.random() * nameColors.length)]
    const nameText = createNameText(name, realBodyHeight, OtherPlayerNameColor);
	const OtherPlayerBangHoiText = createNameText(OtherPlayerBangHoi, realBodyHeight + lineSpacing, OtherPlayerNameColor);
    container.addChild(nameText); container.addChild(OtherPlayerBangHoiText);

    const hpBar = CreatHPBar(realBodyHeight, 60, 8);
    hpBar.setPercent(Math.random() * 0.5 + 0.5); // Máu random từ 50-100%
    container.addChild(hpBar.container);

    // 7. Random vị trí ban đầu
    const startX = Math.random() * currentMap.width;
    const startY = Math.random() * currentMap.height;
    container.x = startX;
    container.y = startY;

    objectLayer.addChild(container);

    // 8. Tạo Entity Object để quản lý Logic
    const entity = {
        container: container,
        skin: skinContainer,
        parts: parts,
        equipId: equipId,
        
        x: startX,
        y: startY,
        targetX: startX,
        targetY: startY,
        
        speed: 3 + Math.random() * 2, // Tốc độ random từ 3-5
        
        currentAction: "FreeStand",
        currentDir: Math.floor(Math.random() * 8),
        
        // AI State
        isMoving: false,
        idleTime: Math.random() * 100, // Thời gian chờ ban đầu
    };

    AllOtherPlayers.push(entity);
}

// Hàm Update logic cho tất cả OtherPlayer
function updateOtherPlayers(delta) {
    const mapW = currentMap.width;
    const mapH = currentMap.height;

    AllOtherPlayers.forEach(p => {
        // --- 1. AI LOGIC (Tự động đi lại) ---
        if (!p.isMoving) {
            // Nếu đang đứng yên, trừ thời gian chờ
            p.idleTime -= delta;
            if (p.idleTime <= 0) {
                // Hết thời gian chờ -> Random điểm đến mới
                const range = 300; // Đi loanh quanh 300px
                let nextX = p.x + (Math.random() - 0.5) * (range * 2);
                let nextY = p.y + (Math.random() - 0.5) * (range * 2);
                
                // Clamp trong map
                p.targetX = Math.max(50, Math.min(mapW - 50, nextX));
                p.targetY = Math.max(50, Math.min(mapH - 50, nextY));
                
                p.isMoving = true;
            }
        }

        // --- 2. MOVEMENT LOGIC ---
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const distSq = dx * dx + dy * dy;
        
        let newAction = "FreeStand";
        let newDir = p.currentDir;

        if (p.isMoving) {
            if (distSq < 10) { // Đã đến nơi
                p.isMoving = false;
                p.idleTime = 60 + Math.random() * 120; // Chờ 1-3 giây (giả sử 60fps)
                newAction = "FreeStand";
            } else {
                // Đang di chuyển
                newAction = "FreeRun";
                const dist = Math.sqrt(distSq);
                
                p.x += (dx / dist) * p.speed * delta;
                p.y += (dy / dist) * p.speed * delta;
                
                newDir = getDirectionIndex(dx, dy);
            }
        } else {
            newAction = "FreeStand";
        }

        // Cập nhật trạng thái
        const stateChanged = (newAction !== p.currentAction) || (newDir !== p.currentDir);
        p.currentAction = newAction;
        p.currentDir = newDir;

        // Cập nhật vị trí container
        p.container.x = p.x;
        p.container.y = p.y;
        p.container.zIndex = p.y; // Sắp xếp độ sâu

        // --- 3. RENDER LOGIC (Tương tự updatePlayerLogic) ---
        p.skin.scale.x = 1;
		const resDir = p.currentDir;

        const animSpeed = (newAction === "free-run") ? 0.18 : 0.15;

        // Tính Dynamic Feet Offset (để chân chạm đất chuẩn)
        let dynamicFeetOffset = 33; 
        const bodyData = getPlayerPartData(newAction, resDir, 0, p.equipId);
        if (bodyData && bodyData.length > 0) {
             const bodySprite = p.parts[0];
             const currentIdx = bodySprite.currentFrame % bodyData.length;
             if (bodyData[currentIdx].texture.valid) {
                 dynamicFeetOffset = bodyData[currentIdx].texture.height * 0.5;
             }
        }

        // Render 3 phần (Thân, Tay, Tay)
        [0, 1, 2].forEach(partId => {
            const sprite = p.parts[partId];
            const partData = getPlayerPartData(newAction, resDir, partId, p.equipId);

            if (partData && partData.length > 0) {
        if (stateChanged || !sprite.playing) {
            sprite.textures = partData.map(d => d.texture);
            sprite.animationSpeed = animSpeed;
            sprite.play();
            sprite.visible = true;
        }

        const currentFrameIdx = sprite.currentFrame % partData.length;
        const currentInfo = partData[currentFrameIdx];

        if (currentInfo) {
            sprite.x = currentInfo.offsetX;
            sprite.y = -currentInfo.offsetY - dynamicFeetOffset;

            // ================= LOGIC Z-INDEX GIỐNG MAINPLAYER =================
            let zIndex = 0;

            if (newDir === 0) {
                // Hướng 0: Thân (0) đè lên 2 tay (1, 2)
                if (partId === 0) zIndex = 10;
                else zIndex = 1;
            }
            else if (newDir >= 1 && newDir <= 3) {
                if (partId === 2) zIndex = 1;  // Tay 2 dưới
                if (partId === 0) zIndex = 5;  // Thân giữa
                if (partId === 1) zIndex = 10; // Tay 1 trên
            }
            else if (newDir === 4) {
                if (partId === 1) zIndex = 1;  // Tay 1 dưới
                if (partId === 0) zIndex = 5;  // Thân giữa
                if (partId === 2) zIndex = 10; // Tay 2 trên
            }
            else {
                if (partId === 1) zIndex = 1;
                if (partId === 0) zIndex = 5;
                if (partId === 2) zIndex = 10;
            }

            sprite.zIndex = zIndex;
            // ==================================================================
        }
    } else {
        sprite.visible = false;
    }
        });
    });
}

