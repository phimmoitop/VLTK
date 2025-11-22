// ============================================================================
// PHẦN 4: HỆ THỐNG PLAYER & CAMERA
// ============================================================================

let playerIndex = {};

// ==================== 1. BUILD PLAYER INDEX (LƯU CẢ TEXTURE & OFFSET) ====================
function buildPlayerIndex(sheet, type) {
    const actionPrefix = type === "Stand" ? "free-stand" : "free-run";
    console.log(`%c[buildPlayerIndex] Bắt đầu xử lý: ${actionPrefix}`, "color: cyan; font-weight: bold");

    let valid = 0;
    // Lấy raw data để đọc offset tùy chỉnh trong JSON
    const framesData = sheet.data.frames; 

    for (const key in sheet.textures) {
        // Filter nhanh
        if (!key.includes(actionPrefix)) continue;

        // Parse tên file
        const match = key.match(/(free[-_]?stand|free[-_]?run)[-_](\d+)[-_](\d+)[-_](\d+)[-_](\d+)/i);
        if (!match) continue;

        const actionMatch = match[1].toLowerCase();
        
        // Filter loại action
        const isStandFile = actionMatch.includes("stand");
        if (type === "Stand" && !isStandFile) continue;
        if (type === "Run" && isStandFile) continue;

        // Lấy thông tin ID
        const charIdRaw = match[2];
        const dir       = match[3];
        const part      = match[4]; // 0: Thân, 1: Tay, 2: Tay
        const frameNum  = Number(match[5]);
        const charId    = String(Number(charIdRaw));

        // ==== LOGIC MỚI: LẤY OFFSET TỪ DATA ====
        // Dựa trên JSON bạn cung cấp: "frame": { "x":..., "offsetX": 4, "offsetY": 34 }
        const frameRaw = framesData[key];
        let offX = 0, offY = 0;
        
        if (frameRaw) {
            // Kiểm tra xem offset nằm trực tiếp hay nằm trong object 'frame'
            // Code an toàn check cả 2 trường hợp
            if (frameRaw.frame && (frameRaw.frame.offsetX !== undefined)) {
                offX = frameRaw.frame.offsetX;
                offY = frameRaw.frame.offsetY;
            } else if (frameRaw.offsetX !== undefined) {
                offX = frameRaw.offsetX;
                offY = frameRaw.offsetY;
            } else if (frameRaw.spriteSourceSize) {
                 // Fallback nếu dùng chuẩn TexturePacker mặc định
                 offX = frameRaw.spriteSourceSize.x;
                 offY = frameRaw.spriteSourceSize.y;
            }
        }

        // Tạo cấu trúc object
        if (!playerIndex[actionPrefix]) playerIndex[actionPrefix] = {};
        if (!playerIndex[actionPrefix][charId]) playerIndex[actionPrefix][charId] = {};
        if (!playerIndex[actionPrefix][charId][dir]) playerIndex[actionPrefix][charId][dir] = {};
        if (!playerIndex[actionPrefix][charId][dir][part]) playerIndex[actionPrefix][charId][dir][part] = [];

        // Đẩy dữ liệu chi tiết vào (Texture + Offset)
        playerIndex[actionPrefix][charId][dir][part].push({ 
            frameNum: frameNum, 
            texture: sheet.textures[key],
            offsetX: offX,
            offsetY: offY
        });
        valid++;
    }

    // Sắp xếp lại frame theo thứ tự
    const currentActionData = playerIndex[actionPrefix];
    if (currentActionData) {
        for (const id in currentActionData) {
            for (const d in currentActionData[id]) {
                for (const p in currentActionData[id][d]) {
                    // Sort theo frameNum
                    currentActionData[id][d][p].sort((a, b) => a.frameNum - b.frameNum);
                    // LƯU Ý: Không map về texture nữa, giữ nguyên object để lấy offset khi render
                }
            }
        }
    }

    console.log(`%c[buildPlayerIndex] HOÀN TẤT ${actionPrefix} → Hợp lệ: ${valid}`, "color: lime");
}

// ==================== 2. HELPER: LẤY DATA FRAMES (TEXTURE + OFFSET) ====================
function getPlayerPartData(action, dir, part, charId) {
    dir = String(dir);
    part = String(part);
    charId = String(charId);

    const candidates = [
        charId,
        charId.padStart(4, '0'), 
        String(Number(charId))
    ];

    for (const id of candidates) {
        if (playerIndex[action]?.[id]?.[dir]?.[part]?.length > 0) {
            return playerIndex[action][id][dir][part];
        }
    }
    return []; // Trả về mảng rỗng nếu không tìm thấy
}

// ==================== 3. INIT PLAYER (TẠO CONTAINER 3 PHẦN) ====================
function initPlayer() {
    const player = new PIXI.Container();
    playerInfo.container = player;
    playerInfo.equipId = "161"; // ID nhân vật

    // 1. Tạo Container Skin
    const skinContainer = new PIXI.Container();
    skinContainer.sortableChildren = true;
    player.addChild(skinContainer);
    playerInfo.skin = skinContainer;

    // 2. Khởi tạo 3 phần (Thân, Tay Trái, Tay Phải)
    playerInfo.parts = {}; 
    
    [0, 1, 2].forEach(partId => {
        const sprite = new PIXI.AnimatedSprite([PIXI.Texture.EMPTY]);
        sprite.anchor.set(0.5);
        sprite.visible = false; 
        playerInfo.parts[partId] = sprite;
        skinContainer.addChild(sprite);
    });

    // ==================== 3. TÍNH CHIỀU CAO THỰC TẾ (DYNAMIC HEIGHT) ====================
    let realBodyHeight = 66; // Giá trị mặc định phòng hờ chưa load được
    
    // Lấy thử data của hành động Đứng, Hướng 0, Phần Thân (0)
    const bodyData = getPlayerPartData("free-stand", 0, 0, playerInfo.equipId);
    
    if (bodyData && bodyData.length > 0 && bodyData[0].texture) {
        // Lấy chiều cao của frame đầu tiên
        realBodyHeight = bodyData[0].texture.height;
    }

    // Lưu chiều cao này vào playerInfo để dùng lại nếu cần
    playerInfo.bodyHeight = realBodyHeight;

    // ==================== 4. UI (NAME & HP) THEO CHIỀU CAO THỰC ====================
    // Truyền realBodyHeight vào thay vì số cứng 66
    // Lưu ý: Tên và HP thường nằm trên đầu, nên vị trí Y sẽ là số âm (ngược lên trên)
    
    // Giả sử hàm createNameText của bạn nhận tham số là chiều cao để tự tính toán offset Y
    const PlayerNameText = createNameText("MA PHONG BA", realBodyHeight, 0xffffff);
    
    // Nếu hàm createNameText chưa tự căn chỉnh, bạn có thể set vị trí thủ công:
    // PlayerNameText.y = -realBodyHeight - 10; // Ví dụ: Cao hơn đầu 10px
    
    player.addChild(PlayerNameText);
    
    // Tương tự với HP Bar
    const hpBar = CreatHPBar(realBodyHeight, 65, 8);
    // hpBar.container.y = -realBodyHeight - 5; 
    
    hpBar.setPercent(0.95);
    player.addChild(hpBar.container);

    // ==================== 5. SETUP VỊ TRÍ & LOGIC ====================
    playerInfo.x = currentMap.width / 2;
    playerInfo.y = currentMap.height / 2;
    player.position.set(playerInfo.x, playerInfo.y);

    playerInfo.currentDir = 0;
    playerInfo.currentAction = "free-stand";

    objectLayer.addChild(player);

    // Load hình ảnh lần đầu
    updatePlayerLogic(0.01); 

    // Input
    app.stage.interactive = true;
    app.stage.on("pointerdown", (e) => {
        const pos = worldContainer.toLocal(e.data.global);
        playerInfo.targetX = pos.x;
        playerInfo.targetY = pos.y;
        playerInfo.isMoving = true;
    });
}

// ==================== 4. HELPER: MAP HƯỚNG LOGIC -> RESOURCE & SCALE ====================
function getDisplayInfo(dir) {
    // Mặc định hướng 0, 4 và các hướng bên phải (1, 2, 3)
    let resDir = dir;
    let scaleX = 1;

    // Xử lý các hướng bên trái (cần lật ngược)
    if (dir === 5) {
        resDir = 3;
        scaleX = -1;
    } else if (dir === 6) {
        resDir = 2;
        scaleX = -1;
    } else if (dir === 7) {
        resDir = 1;
        scaleX = -1;
    }

    return { resDir, scaleX };
}

// ==================== 5. UPDATE PLAYER LOGIC (UPDATE 3 PARTS + Z-INDEX) ====================
function updatePlayerLogic(delta) {
    const p = playerInfo;
    if (!p.skin) return; 

    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // --- A. Xác định Action và Hướng ---
    let newAction = p.currentAction;
    let newDir = p.currentDir;

    if (p.isMoving && dist > p.speed * delta) {
        newAction = "free-run";
        newDir = getDirectionIndex(dx, dy);
        
        p.x += (dx / dist) * p.speed * delta;
        p.y += (dy / dist) * p.speed * delta;
    } else {
        newAction = "free-stand";
        p.isMoving = false;
    }

    const stateChanged = (newAction !== p.currentAction) || (newDir !== p.currentDir);

    p.currentAction = newAction;
    p.currentDir = newDir;

    p.container.x = p.x;
    p.container.y = p.y;

    // --- B. Chuẩn bị Data hiển thị ---
    const displayInfo = getDisplayInfo(p.currentDir);
    if (p.skin.scale.x !== displayInfo.scaleX) {
        p.skin.scale.x = displayInfo.scaleX;
    }
    
    const animSpeed = (newAction === "free-run") ? 0.18 : 0.15;

    // --- C. TÍNH TOÁN FEET OFFSET ĐỘNG (Dựa theo chiều cao Body) ---
    let dynamicFeetOffset = 33; // Fallback mặc định nếu chưa load xong

    // Lấy data của phần Thân (Part 0) để đo chiều cao
    const bodyPartData = getPlayerPartData(newAction, displayInfo.resDir, 0, p.equipId);
    const bodySprite = p.parts[0];

    if (bodyPartData && bodyPartData.length > 0) {
        // Lấy frame index hiện tại của body
        const currentIdx = bodySprite.currentFrame % bodyPartData.length;
        const currentBodyTex = bodyPartData[currentIdx].texture;
        
        // Nếu texture hợp lệ, lấy chiều cao thực tế / 2
        if (currentBodyTex && currentBodyTex.valid) {
            dynamicFeetOffset = currentBodyTex.height * 0.5; 
            // * 0.5 vì anchor.y đang là 0.5 (ở giữa)
        }
    }

    // --- D. Loop render các bộ phận ---
    [0, 1, 2].forEach(partId => {
        const sprite = p.parts[partId];
        const partData = getPlayerPartData(newAction, displayInfo.resDir, partId, p.equipId);

        if (partData && partData.length > 0) {
            // Update Textures
            if (stateChanged || !sprite.playing) {
                sprite.textures = partData.map(d => d.texture);
                sprite.animationSpeed = animSpeed;
                sprite.play();
                sprite.visible = true;
            }

            // Lấy thông tin frame hiện tại
            const currentFrameIdx = sprite.currentFrame % partData.length;
            const currentInfo = partData[currentFrameIdx];

            if (currentInfo) {
                // 1. X: Giữ nguyên dấu JSON
                sprite.x = currentInfo.offsetX;

                // 2. Y: Đảo dấu JSON - dynamicFeetOffset
                // Giải thích:
                // - currentInfo.offsetY: offset riêng của từng frame
                // - dynamicFeetOffset: nâng cả cụm lên để chân (đáy ảnh Body) chạm đất
                sprite.y = -currentInfo.offsetY - dynamicFeetOffset;

                // 3. Z-Index: Y càng cao -> Hiện sau
                sprite.zIndex = -currentInfo.offsetY;
            }
        } else {
            sprite.visible = false;
        }
    });

    centerCameraOnPlayer();
}

// Hàm Camera: Di chuyển World ngược lại với Player để Player luôn ở giữa
function centerCameraOnPlayer() {
    const screenW = app.renderer.width;
    const screenH = app.renderer.height;

    // Đặt vị trí world sao cho (player.x, player.y) trùng với tâm màn hình
    worldContainer.x = screenW / 2 - playerInfo.x;
	worldContainer.y = screenH / 2 - playerInfo.y;

    // (Nâng cao: Nếu muốn camera không chạy ra ngoài map khi player ở mép)
    // Phần này giữ nguyên yêu cầu "nhân vật ở giữa màn hình" nên ta dùng pivot đơn giản.
    // Nếu muốn clamp camera, cần logic phức tạp hơn một chút ở đây.
}





