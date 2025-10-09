const EnemyType = {
    ZOMBIE: 'zombie',
    SKELETON: 'skeleton',
    SPIDER: 'spider',
    CREEPER: 'creeper'
};

class Enemy {
    constructor(scene, world, x, y, z, type = EnemyType.ZOMBIE) {
        this.scene = scene;
        this.world = world;
        this.type = type;

        this.position = new THREE.Vector3(x, y, z);
        this.velocity = new THREE.Vector3(0, 0, 0);

        // 敵のパラメータ
        this.setTypeParameters(type);

        // サイズ
        this.width = 0.6;
        this.height = 1.8;

        // 状態
        this.isOnGround = false;
        this.targetPlayer = null;
        this.detectionRange = 20;
        this.attackRange = 2;
        this.attackCooldown = 0;
        this.attackDelay = 1.0;

        // 物理
        this.gravity = -30;

        // メッシュ作成
        this.createMesh();
    }

    setTypeParameters(type) {
        switch (type) {
            case EnemyType.ZOMBIE:
                this.health = 20;
                this.maxHealth = 20;
                this.speed = 2;
                this.damage = 3;
                this.color = 0x00AA00;
                this.jumpPower = 8;
                break;
            case EnemyType.SKELETON:
                this.health = 15;
                this.maxHealth = 15;
                this.speed = 2.5;
                this.damage = 4;
                this.color = 0xCCCCCC;
                this.jumpPower = 8;
                break;
            case EnemyType.SPIDER:
                this.health = 16;
                this.maxHealth = 16;
                this.speed = 3;
                this.damage = 2;
                this.color = 0x330000;
                this.jumpPower = 10;
                break;
            case EnemyType.CREEPER:
                this.health = 20;
                this.maxHealth = 20;
                this.speed = 1.5;
                this.damage = 10; // 爆発ダメージ
                this.color = 0x00FF00;
                this.jumpPower = 8;
                this.explosionRadius = 5;
                this.fuseDuration = 1.5;
                this.fuseTimer = 0;
                this.isExploding = false;
                break;
        }
    }

    createMesh() {
        // シンプルなボックス形状の敵
        const bodyGeometry = new THREE.BoxGeometry(this.width, this.height * 0.6, this.width);
        const headGeometry = new THREE.BoxGeometry(this.width * 0.8, this.height * 0.4, this.width * 0.8);

        const material = new THREE.MeshLambertMaterial({ color: this.color });

        this.bodyMesh = new THREE.Mesh(bodyGeometry, material);
        this.headMesh = new THREE.Mesh(headGeometry, material);

        this.group = new THREE.Group();
        this.bodyMesh.position.y = this.height * 0.3;
        this.headMesh.position.y = this.height * 0.8;

        this.group.add(this.bodyMesh);
        this.group.add(this.headMesh);
        this.group.position.copy(this.position);

        this.scene.add(this.group);

        // 体力バー
        this.createHealthBar();
    }

    createHealthBar() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        this.healthBarSprite = new THREE.Sprite(material);
        this.healthBarSprite.scale.set(1, 0.25, 1);
        this.healthBarSprite.position.y = this.height + 0.5;
        this.group.add(this.healthBarSprite);

        this.healthBarCanvas = canvas;
        this.healthBarContext = ctx;
        this.updateHealthBar();
    }

    updateHealthBar() {
        const ctx = this.healthBarContext;
        const canvas = this.healthBarCanvas;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 体力
        const healthWidth = (this.health / this.maxHealth) * canvas.width;
        ctx.fillStyle = this.health > this.maxHealth * 0.5 ? '#0F0' : this.health > this.maxHealth * 0.25 ? '#FF0' : '#F00';
        ctx.fillRect(0, 0, healthWidth, canvas.height);

        // 枠
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        this.healthBarSprite.material.map.needsUpdate = true;
    }

    update(deltaTime, player) {
        if (this.health <= 0) return;

        this.targetPlayer = player;

        // プレイヤーとの距離
        const distanceToPlayer = this.position.distanceTo(player.position);

        if (distanceToPlayer < this.detectionRange) {
            this.moveTowardsPlayer(deltaTime, player);

            // 攻撃
            if (distanceToPlayer < this.attackRange) {
                this.attack(deltaTime, player);
            }
        }

        // 物理更新
        this.applyPhysics(deltaTime);

        // メッシュ位置更新
        this.group.position.copy(this.position);

        // 攻撃クールダウン
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // クリーパーの爆発タイマー
        if (this.type === EnemyType.CREEPER && this.isExploding) {
            this.fuseTimer += deltaTime;
            // 点滅エフェクト
            const flash = Math.sin(this.fuseTimer * 20) > 0;
            this.bodyMesh.material.color.setHex(flash ? 0xFFFFFF : this.color);

            if (this.fuseTimer >= this.fuseDuration) {
                this.explode(player);
            }
        }
    }

    moveTowardsPlayer(deltaTime, player) {
        const direction = new THREE.Vector3();
        direction.subVectors(player.position, this.position);
        direction.y = 0;
        direction.normalize();

        this.velocity.x = direction.x * this.speed * deltaTime;
        this.velocity.z = direction.z * this.speed * deltaTime;

        // ジャンプ（障害物を越える）
        if (this.isOnGround) {
            const frontX = Math.floor(this.position.x + direction.x * 2);
            const frontZ = Math.floor(this.position.z + direction.z * 2);
            const frontY = Math.floor(this.position.y + 1);

            if (this.world.isBlockSolid(frontX, frontY, frontZ)) {
                this.velocity.y = this.jumpPower;
            }
        }

        // メッシュの向きを更新
        const angle = Math.atan2(direction.x, direction.z);
        this.group.rotation.y = angle;
    }

    attack(deltaTime, player) {
        if (this.attackCooldown <= 0) {
            if (this.type === EnemyType.CREEPER) {
                // クリーパーは爆発開始
                if (!this.isExploding) {
                    this.isExploding = true;
                    this.fuseTimer = 0;
                }
            } else {
                // 通常攻撃
                player.takeDamage(this.damage);
                this.attackCooldown = this.attackDelay;
            }
        }
    }

    explode(player) {
        // 爆発範囲内のプレイヤーにダメージ
        const distanceToPlayer = this.position.distanceTo(player.position);
        if (distanceToPlayer < this.explosionRadius) {
            const damageScale = 1 - (distanceToPlayer / this.explosionRadius);
            player.takeDamage(Math.floor(this.damage * damageScale));
        }

        // 爆発範囲内のブロックを破壊
        for (let x = -2; x <= 2; x++) {
            for (let y = -2; y <= 2; y++) {
                for (let z = -2; z <= 2; z++) {
                    const blockX = Math.floor(this.position.x + x);
                    const blockY = Math.floor(this.position.y + y);
                    const blockZ = Math.floor(this.position.z + z);

                    if (Math.random() < 0.5) {
                        this.world.removeBlock(blockX, blockY, blockZ);
                    }
                }
            }
        }

        this.health = 0;
        this.remove();
    }

    applyPhysics(deltaTime) {
        // 重力
        if (!this.isOnGround) {
            this.velocity.y += this.gravity * deltaTime;
        }

        // 衝突判定と移動
        this.moveWithCollision(deltaTime);
    }

    moveWithCollision(deltaTime) {
        // X軸方向の移動
        const newX = this.position.x + this.velocity.x;
        const boxX = new THREE.Box3(
            new THREE.Vector3(newX - this.width / 2, this.position.y, this.position.z - this.width / 2),
            new THREE.Vector3(newX + this.width / 2, this.position.y + this.height, this.position.z + this.width / 2)
        );

        if (!this.world.checkCollision(boxX)) {
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

        // Y軸方向の移動
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
                this.isOnGround = true;
            }
            this.velocity.y = 0;
        }

        // 落下死
        if (this.position.y < -10) {
            this.health = 0;
            this.remove();
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.updateHealthBar();

        if (this.health <= 0) {
            this.health = 0;
            this.remove();
        }
    }

    remove() {
        this.scene.remove(this.group);
        this.bodyMesh.geometry.dispose();
        this.bodyMesh.material.dispose();
        this.headMesh.geometry.dispose();
        this.headMesh.material.dispose();
        this.healthBarSprite.material.map.dispose();
        this.healthBarSprite.material.dispose();
    }
}

class EnemyManager {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.enemies = [];
        this.maxEnemies = 3; // 極限軽量化：5→3に削減
        this.spawnTimer = 0;
        this.spawnInterval = 30; // 極限軽量化：20秒→30秒に変更
        this.isNight = false;
    }

    update(deltaTime, player, isNight) {
        this.isNight = isNight;

        // 敵の更新
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, player);

            if (enemy.health <= 0) {
                this.enemies.splice(i, 1);
            }
        }

        // 夜間のみスポーン
        if (isNight && this.enemies.length < this.maxEnemies) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnEnemy(player);
            }
        }
    }

    spawnEnemy(player) {
        // プレイヤーの周囲にランダムスポーン
        const angle = Math.random() * Math.PI * 2;
        const distance = 15 + Math.random() * 10;
        const x = player.position.x + Math.cos(angle) * distance;
        const z = player.position.z + Math.sin(angle) * distance;

        // 地面の高さを見つける
        let y = this.world.worldHeight - 1;
        while (y > 0 && !this.world.isBlockSolid(Math.floor(x), y, Math.floor(z))) {
            y--;
        }
        y += 2; // 地面の上に配置

        // 敵のタイプをランダムに選択
        const types = [EnemyType.ZOMBIE, EnemyType.SKELETON, EnemyType.SPIDER, EnemyType.CREEPER];
        const type = types[Math.floor(Math.random() * types.length)];

        const enemy = new Enemy(this.scene, this.world, x, y, z, type);
        this.enemies.push(enemy);
    }

    getEnemyCount() {
        return this.enemies.length;
    }

    attackEnemies(position, range, damage) {
        let hitCount = 0;
        this.enemies.forEach(enemy => {
            const distance = enemy.position.distanceTo(position);
            if (distance < range) {
                enemy.takeDamage(damage);
                hitCount++;
            }
        });
        return hitCount;
    }

    clear() {
        this.enemies.forEach(enemy => enemy.remove());
        this.enemies = [];
    }
}

window.EnemyType = EnemyType;
window.Enemy = Enemy;
window.EnemyManager = EnemyManager;
