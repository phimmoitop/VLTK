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
    // 1. Cấu hình Random
    const equipId = Math.random() < 0.5 ? Math.floor(Math.random() * 68) + 101 : Math.floor(Math.random() * 68) + 201;
    const name = OtherPlayerNames[Math.floor(Math.random() * OtherPlayerNames.length)];
    const OtherPlayerBangHoi = TenBangHoi[Math.floor(Math.random() * TenBangHoi.length)];
    
    // Random xem có cưỡi ngựa không (Ví dụ: 30% có ngựa)
    // Nếu bạn muốn tất cả đi bộ, set hasHorse = false
    const hasHorse = Math.random() < 0.3; 
    const horseId = hasHorse ? "92" : ""; 

    // 2. Tạo Container
    const container = new PIXI.Container();
    const skinContainer = new PIXI.Container();
    skinContainer.sortableChildren = true;
    container.addChild(skinContainer);

    // 3. [MỚI] Tạo 3 bộ phận NGỰA (Part 0, 1, 2)
    // Cần tạo sẵn để dùng chung hàm render, kể cả khi không cưỡi
    const horseParts = {};
    [0, 1, 2].forEach(partId => {
        const sprite = new PIXI.AnimatedSprite([PIXI.Texture.EMPTY]);
        sprite.anchor.set(0); // Ngựa anchor 0
        sprite.visible = false;
        horseParts[partId] = sprite;
        skinContainer.addChild(sprite);
    });

    // 4. Tạo 3 bộ phận NGƯỜI (Part 0, 1, 2)
    const parts = {};
    [0, 1, 2].forEach(partId => {
        const sprite = new PIXI.AnimatedSprite([PIXI.Texture.EMPTY]);
        sprite.anchor.set(0.5); // Người anchor 0.5
        sprite.visible = false;
        parts[partId] = sprite;
        skinContainer.addChild(sprite);
    });

    // 5. UI (Tên, HP) - Tính chiều cao chuẩn
    let realBodyHeight = 66; 
    const bodyData = getPlayerPartData("FreeStand", 0, 0, equipId);
    if (bodyData && bodyData.length > 0 && bodyData[0].texture) {
        realBodyHeight = bodyData[0].texture.height;
    }

	const lineSpacing = 25;
	const nameColors = [0xffffff, 0xFF7F00, 0x00f390, 0xCC33FF, 0xFF0000];
	const OtherPlayerNameColor = nameColors[Math.floor(Math.random() * nameColors.length)]
    
    const nameText = createNameText(name, realBodyHeight, OtherPlayerNameColor);
	const OtherPlayerBangHoiText = createNameText(OtherPlayerBangHoi, realBodyHeight + lineSpacing, OtherPlayerNameColor);
    container.addChild(nameText); container.addChild(OtherPlayerBangHoiText);

    const hpBar = CreatHPBar(realBodyHeight, 60, 8);
    hpBar.setPercent(Math.random() * 0.5 + 0.5);
    container.addChild(hpBar.container);

    // 6. Vị trí Random
    const startX = Math.random() * currentMap.width;
    const startY = Math.random() * currentMap.height;
    container.x = startX;
    container.y = startY;

    objectLayer.addChild(container);

    // 7. Tạo Entity Object (Cấu trúc giống MainPlayer)
    const entity = {
        container: container,
        skin: skinContainer,
        parts: parts,
        horseParts: horseParts, // [Quan trọng]
        
        equipId: String(equipId),
        horseId: String(horseId), // [Quan trọng]
        isRiding: hasHorse,       // [Quan trọng]
        
        x: startX,
        y: startY,
        targetX: startX,
        targetY: startY,
        
        speed: 3 + Math.random() * 2,
        
        currentAction: "FreeStand",
        currentDir: Math.floor(Math.random() * 8),
        
        // AI State
        isMoving: false,
        idleTime: Math.random() * 100,
    };

    AllOtherPlayers.push(entity);
}

// Hàm Update Logic Other Player (AI tự chạy)
function updateOtherPlayers(delta) {
    const mapW = currentMap.width;
    const mapH = currentMap.height;

    AllOtherPlayers.forEach(p => {
        // --- 1. AI LOGIC (GIỮ NGUYÊN) ---
        // Tự động tìm đường đi ngẫu nhiên
        if (!p.isMoving) {
            p.idleTime -= delta;
            if (p.idleTime <= 0) {
                const range = 300; 
                let nextX = p.x + (Math.random() - 0.5) * (range * 2);
                let nextY = p.y + (Math.random() - 0.5) * (range * 2);
                
                // Giới hạn trong bản đồ
                p.targetX = Math.max(50, Math.min(mapW - 50, nextX));
                p.targetY = Math.max(50, Math.min(mapH - 50, nextY));
                
                p.isMoving = true;
            }
        }

        // --- 2. MOVEMENT LOGIC (GIỮ NGUYÊN) ---
        // Tính toán di chuyển tới targetX, targetY
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const distSq = dx * dx + dy * dy;
        
        if (p.isMoving) {
            if (distSq < 10) { // Đã đến nơi
                p.isMoving = false;
                p.idleTime = 60 + Math.random() * 120; 
            } else {
                // Đang di chuyển
                const dist = Math.sqrt(distSq);
                p.x += (dx / dist) * p.speed * delta;
                p.y += (dy / dist) * p.speed * delta;
                
                // Cập nhật hướng
                p.currentDir = getDirectionIndex(dx, dy);
            }
        }

        // --- 3. GỌI HÀM HIỂN THỊ CHUNG ---
        renderEntityLogic(p);
    });
}
