class Player {
    constructor(camera, world) {
        this.camera = camera;
        this.world = world;

        // プレイヤーの位置（高い位置から落下させて確実に地面の上に着地）
        this.position = new THREE.Vector3(50, 50, 50);
        this.velocity = new THREE.Vector3(0, 0, 0);

        // プレイヤーの向き（少し下向きで地面が見える程度）
        this.rotation = new THREE.Euler(0.3, 0, 0, 'YXZ'); // 0.3 rad = ~17度下向き（足元が自然に見える）
        this.camera.rotation.order = 'YXZ';

        // 移動速度
        this.speed = 5;
        this.jumpPower = 10;
        this.gravity = -30;

        // プレイヤーのサイズ
        this.width = 0.6;
        this.height = 1.8;
        this.eyeHeight = 1.6; // 視点の高さ（足元の地面が見えるように）

        // 状態
        this.isOnGround = false;
        this.health = 20;
        this.maxHealth = 20;

        // 入力状態
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false,
            attack: false
        };

        // マウス感度
        this.mouseSensitivity = 0.002;
        this.isPointerLocked = false;

        // ブロック破壊
        this.breakingBlock = null;
        this.breakingProgress = 0;
        this.breakingSpeed = 0.5; // 1秒でブロック破壊

        this.setupControls();
    }

    setupControls() {
        // キーボード入力
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        document.addEventListener('keyup', (e) => {
            this.handleKeyUp(e);
        });

        // マウス入力
        document.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                document.body.requestPointerLock();
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === document.body;
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.rotation.y -= e.movementX * this.mouseSensitivity;
                this.rotation.x -= e.movementY * this.mouseSensitivity;

                // 上下の視点制限
                this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));
            }
        });

        // タッチコントロール
        this.setupMobileControls();
        this.setupMobileLook();
    }

    handleKeyDown(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.jump = true;
                break;
            case 'KeyF':
                this.keys.attack = true;
                break;
        }
    }

    handleKeyUp(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.jump = false;
                break;
            case 'KeyF':
                this.keys.attack = false;
                break;
        }
    }

    setupMobileControls() {
        const setupButton = (id, key, isToggle = false) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.keys[key] = true;
                });
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    this.keys[key] = false;
                });
            }
        };

        setupButton('mobile-forward', 'forward');
        setupButton('mobile-back', 'backward');
        setupButton('mobile-left', 'left');
        setupButton('mobile-right', 'right');
        setupButton('mobile-jump', 'jump');
        setupButton('mobile-attack', 'attack');
    }

    setupMobileLook() {
        const lookPad = document.getElementById('mobile-look');
        if (!lookPad) return;

        let touchStartX = 0;
        let touchStartY = 0;
        let isLooking = false;

        lookPad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isLooking = true;
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });

        lookPad.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!isLooking) return;

            const touch = e.touches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;

            // 視点を動かす（感度調整）
            this.rotation.y -= deltaX * 0.005;
            this.rotation.x -= deltaY * 0.005;

            // 上下の視点制限
            this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));

            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });

        lookPad.addEventListener('touchend', (e) => {
            e.preventDefault();
            isLooking = false;
        });
    }

    update(deltaTime) {
        // 移動処理
        const moveSpeed = this.speed * deltaTime;
        const direction = new THREE.Vector3();

        if (this.keys.forward) direction.z -= 1;
        if (this.keys.backward) direction.z += 1;
        if (this.keys.left) direction.x -= 1;
        if (this.keys.right) direction.x += 1;

        if (direction.length() > 0) {
            direction.normalize();
            direction.applyEuler(new THREE.Euler(0, this.rotation.y, 0));
            direction.y = 0; // Y軸方向の移動を無効化

            this.velocity.x = direction.x * moveSpeed;
            this.velocity.z = direction.z * moveSpeed;
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
        }

        // ジャンプ
        if (this.keys.jump && this.isOnGround) {
            this.velocity.y = this.jumpPower;
            this.isOnGround = false;
        }

        // 重力
        if (!this.isOnGround) {
            this.velocity.y += this.gravity * deltaTime;
        }

        // 衝突判定と移動
        this.moveWithCollision(deltaTime);

        // カメラの更新
        this.camera.position.copy(this.position);
        this.camera.position.y += this.eyeHeight;
        this.camera.rotation.copy(this.rotation);
    }

    moveWithCollision(deltaTime) {
        // X軸方向の移動
        const newX = this.position.x + this.velocity.x;
        const boxX = new THREE.Box3(
            new THREE.Vector3(newX - this.width / 2, this.position.y, this.position.z - this.width / 2),
            new THREE.Vector3(newX + this.width / 2, this.position.y + this.height, this.position.z + this.width / 2)
        );

        const collisionX = this.world.checkCollision(boxX);
        if (!collisionX) {
            this.position.x = newX;
        } else {
            this.velocity.x = 0;
        }

        // Z軸方向の移動
        const newZ = this.position.z + this.velocity.z;
        const boxZ = new THREE.Box3(
            new THREE.Vector3(this.position.x - this.width / 2, this.position.y, newZ - this.width / 2),
            new THREE.Vector3(this.position.x + this.width / 2, this.position.y + this.height, newZ + this.width / 2)
        );

        if (!this.world.checkCollision(boxZ)) {
            this.position.z = newZ;
        } else {
            this.velocity.z = 0;
        }

        // Y軸方向の移動（重力）
        const newY = this.position.y + this.velocity.y * deltaTime;
        const boxY = new THREE.Box3(
            new THREE.Vector3(this.position.x - this.width / 2, newY, this.position.z - this.width / 2),
            new THREE.Vector3(this.position.x + this.width / 2, newY + this.height, this.position.z + this.width / 2)
        );

        if (!this.world.checkCollision(boxY)) {
            this.position.y = newY;
            this.isOnGround = false;
        } else {
            if (this.velocity.y < 0) {
                // 着地 - 周囲の最も高い地面の上に配置
                this.isOnGround = true;

                const playerBlockX = Math.floor(this.position.x);
                const playerBlockZ = Math.floor(this.position.z);

                // 周囲3x3範囲で最も高い地面を探す
                let maxGroundY = 0;
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        let y = Math.floor(this.position.y) + 5;
                        while (y > 0 && !this.world.isBlockSolid(playerBlockX + dx, y, playerBlockZ + dz)) {
                            y--;
                        }
                        if (y > maxGroundY) {
                            maxGroundY = y;
                        }
                    }
                }

                // 最も高い地面の上に配置
                this.position.y = maxGroundY + 1.01;
            }
            this.velocity.y = 0;
        }

        // 落下死判定
        if (this.position.y < -10) {
            this.respawn();
        }
    }

    respawn() {
        this.position.set(50, 40, 50);
        this.velocity.set(0, 0, 0);
        this.health = this.maxHealth;
    }

    getTargetBlock() {
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyEuler(this.rotation);

        const origin = this.camera.position.clone();

        const result = this.world.raycast(origin, direction, 10);
        return result;
    }

    getBlockHardness(blockType) {
        // ブロックの硬さ（採掘時間）を返す
        // 数値が小さいほど速く掘れる
        switch(blockType) {
            case ItemType.DIRT:
            case ItemType.GRASS:
            case ItemType.SAND:
                return 0.3; // 土系は超速（0.3秒）

            case ItemType.WOOD:
            case ItemType.LEAVES:
                return 0.5; // 木系は速い（0.5秒）

            case ItemType.STONE:
                return 1.0; // 石は普通（1秒）

            case ItemType.COAL_ORE:
            case ItemType.IRON_ORE:
                return 1.5; // 鉱石は遅い（1.5秒）

            case ItemType.GOLD_ORE:
            case ItemType.DIAMOND_ORE:
                return 2.0; // レア鉱石は超遅い（2秒）

            default:
                return 1.0; // デフォルトは普通
        }
    }

    breakBlock(deltaTime) {
        const target = this.getTargetBlock();

        if (target) {
            if (this.breakingBlock &&
                this.breakingBlock.x === target.position.x &&
                this.breakingBlock.y === target.position.y &&
                this.breakingBlock.z === target.position.z) {
                // 同じブロックを破壊中
                const hardness = this.getBlockHardness(target.blockType);
                const breakSpeed = 1.0 / hardness;
                this.breakingProgress += deltaTime * breakSpeed;

                if (this.breakingProgress >= 1.0) {
                    // ブロック破壊完了
                    const blockType = target.blockType;
                    const dropType = itemInfo[blockType].drops;

                    this.world.removeBlock(target.position.x, target.position.y, target.position.z);

                    // インベントリに追加
                    if (window.inventory && dropType !== ItemType.AIR) {
                        window.inventory.addItem(dropType, 1);
                    }

                    this.breakingBlock = null;
                    this.breakingProgress = 0;
                }
            } else {
                // 新しいブロックを破壊開始
                this.breakingBlock = target.position;
                this.breakingProgress = 0;
            }
        } else {
            this.breakingBlock = null;
            this.breakingProgress = 0;
        }
    }

    placeBlock(blockType) {
        const target = this.getTargetBlock();

        if (target && blockType !== ItemType.AIR) {
            // ブロックの設置位置（レイキャストしたブロックの隣）
            const placePos = {
                x: Math.floor(target.position.x + target.normal.x),
                y: Math.floor(target.position.y + target.normal.y),
                z: Math.floor(target.position.z + target.normal.z)
            };

            // プレイヤーと重なっていないかチェック（足元と頭上は許可）
            const playerBox = new THREE.Box3(
                new THREE.Vector3(this.position.x - this.width / 2, this.position.y, this.position.z - this.width / 2),
                new THREE.Vector3(this.position.x + this.width / 2, this.position.y + this.height, this.position.z + this.width / 2)
            );

            const blockBox = new THREE.Box3(
                new THREE.Vector3(placePos.x, placePos.y, placePos.z),
                new THREE.Vector3(placePos.x + 1, placePos.y + 1, placePos.z + 1)
            );

            // 足元より下か、頭より上の場合は設置OK
            const isBelow = placePos.y + 1 <= this.position.y + 0.1;  // 足元より下
            const isAbove = placePos.y >= this.position.y + this.height - 0.1;  // 頭より上
            const intersects = !isBelow && !isAbove && playerBox.intersectsBox(blockBox);

            if (!intersects) {
                this.world.placeBlock(placePos.x, placePos.y, placePos.z, blockType);
                return true;
            }
        }

        return false;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.respawn();
        }
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
    }

    getPosition() {
        return this.position.clone();
    }

    getRotation() {
        return this.rotation.clone();
    }
}

window.Player = Player;
