// メインゲームクラス
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.loadingScreen = document.getElementById('loading');

        // Three.jsの初期化
        this.scene = new THREE.Scene();
        // カメラ設定（FOV 85で広い視野、地面が見やすい）
        this.camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 100);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false,
            powerPreference: 'high-performance' // GPU優先モード
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(1); // パフォーマンス優先で1に固定

        // ゲームシステムの初期化
        this.world = new World(this.scene);
        this.dayNightCycle = new DayNightCycle(this.scene);
        this.player = new Player(this.camera, this.world);
        this.enemyManager = new EnemyManager(this.scene, this.world);

        // インベントリとクラフティング
        window.inventory = new Inventory();
        this.craftingSystem = new CraftingSystem(window.inventory);

        // UI
        this.uiManager = new UIManager(
            window.inventory,
            this.craftingSystem,
            this.player,
            this.dayNightCycle,
            this.enemyManager
        );
        window.uiManager = this.uiManager;

        // ゲームループ
        this.lastTime = performance.now();
        this.isRunning = false;
        this.targetFPS = 60; // フレームレート制限（CPU削減）
        this.frameInterval = 1000 / this.targetFPS;
        this.lastFrameTime = 0;

        // AI更新の間引き（CPU削減）
        this.enemyUpdateCounter = 0;
        this.enemyUpdateInterval = 5; // 5フレームに1回更新（さらに軽量化）

        // 入力状態
        this.mouseDown = false;
        this.rightMouseDown = false;

        this.setupControls();
        this.init();
    }

    async init() {
        // ワールドの初期生成（レンダー距離2チャンク、地面が見えるように）
        this.world.updateChunks(this.player.position.x, this.player.position.z, 2);
        // 初期化時は全チャンクを一度に構築（forceAll=true）
        this.world.renderVisibleBlocks(
            this.player.position.x,
            this.player.position.y,
            this.player.position.z,
            2,
            true
        );

        // プレイヤーを地面の上に配置
        this.teleportPlayerToGround();

        // ローディング画面を非表示
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.start();
        }, 1000);

        // リサイズ対応
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    teleportPlayerToGround() {
        let y = this.world.worldHeight - 1;
        const x = Math.floor(this.player.position.x);
        const z = Math.floor(this.player.position.z);

        while (y > 0 && !this.world.isBlockSolid(x, y, z)) {
            y--;
        }

        this.player.position.y = y + 2;
    }

    setupControls() {
        // マウスクリック（ブロック破壊）
        document.addEventListener('mousedown', (e) => {
            if (this.uiManager.isAnyMenuOpen()) return;

            if (e.button === 0) { // 左クリック
                this.mouseDown = true;
            } else if (e.button === 2) { // 右クリック
                this.rightMouseDown = true;
                this.placeBlock();
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouseDown = false;
            } else if (e.button === 2) {
                this.rightMouseDown = false;
            }
        });

        // 右クリックメニューを無効化
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 攻撃キー（敵への攻撃）
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyF' && !this.uiManager.isAnyMenuOpen()) {
                this.attackEnemies();
            }
        });

        // モバイル用：十字（＋）部分をタップでブロック破壊
        const tapToBreak = document.getElementById('tap-to-break');
        if (tapToBreak) {
            tapToBreak.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!this.uiManager.isAnyMenuOpen()) {
                    this.mouseDown = true;
                }
            });

            tapToBreak.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.mouseDown = false;
            });

            tapToBreak.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.mouseDown = false;
            });
        }

        // モバイル用：ブロック設置ボタン
        const mobilePlaceBtn = document.getElementById('mobile-place');
        if (mobilePlaceBtn) {
            mobilePlaceBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (!this.uiManager.isAnyMenuOpen()) {
                    this.placeBlock();
                }
            });
        }

        // セーブボタン
        const saveBtn = document.getElementById('save-button');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveGame();
            });
        }

        // ロードボタン
        const loadBtn = document.getElementById('load-button');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                this.loadGame();
            });
        }
    }

    placeBlock() {
        const selectedItem = window.inventory.getSelectedItem();
        console.log('📦 placeBlock呼び出し:', selectedItem);

        if (selectedItem.type !== ItemType.AIR && selectedItem.count > 0) {
            const info = itemInfo[selectedItem.type];
            console.log('アイテム情報:', info);

            // 固体ブロックのみ設置可能
            if (info && info.solid) {
                console.log('ブロック設置試行...');
                const placed = this.player.placeBlock(selectedItem.type);
                console.log('設置結果:', placed);
                if (placed) {
                    window.inventory.removeItem(selectedItem.type, 1);
                    console.log('✅ ブロック設置成功！');
                } else {
                    console.log('❌ ブロック設置失敗（場所が無効）');
                }
            } else {
                console.log('❌ 固体ブロックではありません');
            }
        } else {
            console.log('❌ アイテムなし、または個数0');
        }
    }

    attackEnemies() {
        const selectedItem = window.inventory.getSelectedItem();
        let damage = 1; // 素手ダメージ
        let range = 3;

        // 武器のダメージ
        if (selectedItem.type !== ItemType.AIR) {
            switch (selectedItem.type) {
                case ItemType.WOODEN_SWORD:
                    damage = 4;
                    break;
                case ItemType.STONE_SWORD:
                    damage = 5;
                    break;
                case ItemType.IRON_SWORD:
                    damage = 6;
                    break;
                case ItemType.GOLD_SWORD:
                    damage = 4;
                    break;
                case ItemType.DIAMOND_SWORD:
                    damage = 7;
                    break;
            }
        }

        // 攻撃範囲内の敵にダメージ
        const hitCount = this.enemyManager.attackEnemies(this.player.position, range, damage);

        if (hitCount > 0) {
            console.log(`${hitCount}体の敵を攻撃！`);
        }
    }

    update(deltaTime) {
        // プレイヤー更新
        this.player.update(deltaTime);

        // ブロック破壊（マウス長押し）
        if (this.mouseDown && !this.uiManager.isAnyMenuOpen()) {
            this.player.breakBlock(deltaTime);
        } else {
            this.player.breakingBlock = null;
            this.player.breakingProgress = 0;
        }

        // ワールド更新（レンダー距離2チャンク、地面が見えるバランス）
        this.world.updateChunks(this.player.position.x, this.player.position.z, 2);
        this.world.renderVisibleBlocks(
            this.player.position.x,
            this.player.position.y,
            this.player.position.z,
            2
        );

        // 昼夜サイクル更新
        this.dayNightCycle.update(deltaTime);

        // 敵更新（3フレームに1回に間引き、CPU削減）
        this.enemyUpdateCounter++;
        if (this.enemyUpdateCounter >= this.enemyUpdateInterval) {
            this.enemyManager.update(deltaTime * this.enemyUpdateInterval, this.player, this.dayNightCycle.isNight());
            this.enemyUpdateCounter = 0;
        }

        // UI更新
        this.uiManager.updateStats();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    gameLoop() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.gameLoop());

        const currentTime = performance.now();
        const elapsed = currentTime - this.lastFrameTime;

        // フレームレート制限：60fps (CPU削減)
        if (elapsed < this.frameInterval) return;

        this.lastFrameTime = currentTime - (elapsed % this.frameInterval);

        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
    }

    saveGame() {
        try {
            const saveData = {
                version: 1,
                timestamp: Date.now(),
                player: {
                    position: {
                        x: this.player.position.x,
                        y: this.player.position.y,
                        z: this.player.position.z
                    },
                    rotation: {
                        x: this.player.rotation.x,
                        y: this.player.rotation.y
                    },
                    health: this.player.health
                },
                inventory: window.inventory.serialize(),
                world: {
                    modifiedBlocks: Array.from(this.world.blockData.entries())
                },
                time: this.dayNightCycle.currentTime
            };

            localStorage.setItem('minecraftSave', JSON.stringify(saveData));
            alert('ゲームをセーブしました！');
            console.log('セーブ完了:', saveData);
            return true;
        } catch (error) {
            console.error('セーブエラー:', error);
            alert('セーブに失敗しました');
            return false;
        }
    }

    loadGame() {
        try {
            const saveDataStr = localStorage.getItem('minecraftSave');
            if (!saveDataStr) {
                alert('セーブデータが見つかりません');
                return false;
            }

            const saveData = JSON.parse(saveDataStr);
            console.log('ロード開始:', saveData);

            // プレイヤー位置
            this.player.position.set(
                saveData.player.position.x,
                saveData.player.position.y,
                saveData.player.position.z
            );

            // プレイヤー向き
            this.player.rotation.x = saveData.player.rotation.x;
            this.player.rotation.y = saveData.player.rotation.y;

            // 体力
            this.player.health = saveData.player.health;

            // インベントリ
            if (window.inventory && saveData.inventory) {
                window.inventory.deserialize(saveData.inventory);
            }

            // ワールドのブロックデータ
            this.world.blockData.clear();
            saveData.world.modifiedBlocks.forEach(([key, type]) => {
                this.world.blockData.set(key, type);
            });

            // 全チャンクを再構築
            this.world.chunks.forEach((chunk, key) => {
                chunk.needsRebuild = true;
            });

            // 時刻
            this.dayNightCycle.currentTime = saveData.time;

            // 画面更新
            this.world.renderVisibleBlocks(
                this.player.position.x,
                this.player.position.y,
                this.player.position.z,
                2,
                true
            );

            alert('ゲームをロードしました！');
            console.log('ロード完了');
            return true;
        } catch (error) {
            console.error('ロードエラー:', error);
            alert('ロードに失敗しました');
            return false;
        }
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

// デバッグ用コンソールコマンド
window.giveItem = (itemType, count = 1) => {
    if (window.inventory) {
        window.inventory.addItem(itemType, count);
        console.log(`${itemInfo[itemType].name} x${count} を入手しました`);
    }
};

window.setTime = (phase) => {
    if (window.game && window.game.dayNightCycle) {
        const cycle = window.game.dayNightCycle;
        switch (phase) {
            case 'noon':
                cycle.setToNoon();
                break;
            case 'midnight':
                cycle.setToMidnight();
                break;
            case 'sunrise':
                cycle.setToSunrise();
                break;
            case 'sunset':
                cycle.setToSunset();
                break;
        }
        console.log(`時刻を ${phase} に設定しました`);
    }
};

window.teleport = (x, y, z) => {
    if (window.game && window.game.player) {
        window.game.player.position.set(x, y, z);
        console.log(`(${x}, ${y}, ${z}) にテレポートしました`);
    }
};

window.clearEnemies = () => {
    if (window.game && window.game.enemyManager) {
        window.game.enemyManager.clear();
        console.log('すべての敵を削除しました');
    }
};

console.log(`
🎮 3Dクラフトマスター・アドベンチャー 🎮

デバッグコマンド:
- giveItem(ItemType.DIAMOND, 10) : アイテムを入手
- setTime('noon') : 時刻を変更 (noon/midnight/sunrise/sunset)
- teleport(100, 50, 100) : テレポート
- clearEnemies() : 敵を全削除

操作方法:
- WASD / 矢印キー : 移動
- スペース : ジャンプ
- マウス : 視点移動
- 左クリック長押し : ブロック破壊
- 右クリック : ブロック設置
- F : 敵を攻撃
- 1-9 : アイテム選択
- マウスホイール : アイテム切り替え
`);
