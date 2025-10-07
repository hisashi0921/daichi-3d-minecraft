class World {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 16;
        this.worldWidth = 100; // チャンク数
        this.worldDepth = 100;
        this.worldHeight = 80;

        this.chunks = new Map(); // チャンクデータ
        this.blockMeshes = new Map(); // ブロックメッシュ
        this.blockData = new Map(); // ブロックタイプ

        // マテリアルキャッシュ
        this.materials = new Map();
        this.createMaterials();

        // ジオメトリキャッシュ
        this.blockGeometry = new THREE.BoxGeometry(1, 1, 1);
    }

    createMaterials() {
        // 各ブロックタイプのマテリアルを作成
        for (let type in itemInfo) {
            const info = itemInfo[type];
            if (info.solid && type != ItemType.AIR) {
                this.materials.set(parseInt(type), new THREE.MeshLambertMaterial({
                    color: info.color,
                    flatShading: true
                }));
            }
        }
    }

    getBlockKey(x, y, z) {
        return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
    }

    getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }

    worldToChunk(x, z) {
        return {
            chunkX: Math.floor(x / this.chunkSize),
            chunkZ: Math.floor(z / this.chunkSize),
            localX: ((x % this.chunkSize) + this.chunkSize) % this.chunkSize,
            localZ: ((z % this.chunkSize) + this.chunkSize) % this.chunkSize
        };
    }

    generateTerrain(chunkX, chunkZ) {
        const chunk = [];

        for (let localX = 0; localX < this.chunkSize; localX++) {
            for (let localZ = 0; localZ < this.chunkSize; localZ++) {
                const worldX = chunkX * this.chunkSize + localX;
                const worldZ = chunkZ * this.chunkSize + localZ;

                // 地形生成（サイン波ベース）
                const height = Math.floor(
                    30 +
                    Math.sin(worldX * 0.05) * 5 +
                    Math.cos(worldZ * 0.05) * 5 +
                    Math.sin(worldX * 0.1) * 2 +
                    Math.cos(worldZ * 0.1) * 2
                );

                for (let y = 0; y < this.worldHeight; y++) {
                    const key = this.getBlockKey(worldX, y, worldZ);
                    let blockType = ItemType.AIR;

                    if (y === 0) {
                        blockType = ItemType.STONE; // 基盤
                    } else if (y < height - 5) {
                        // 地下
                        if (y < 10) {
                            blockType = ItemType.STONE;
                            // 深層鉱石
                            if (Math.random() < 0.002) blockType = ItemType.DIAMOND_ORE;
                            else if (Math.random() < 0.005) blockType = ItemType.GOLD_ORE;
                        } else if (y < 20) {
                            blockType = ItemType.STONE;
                            // 中層鉱石
                            if (Math.random() < 0.005) blockType = ItemType.IRON_ORE;
                            else if (Math.random() < 0.008) blockType = ItemType.COAL_ORE;
                        } else {
                            blockType = ItemType.STONE;
                            if (Math.random() < 0.01) blockType = ItemType.COAL_ORE;
                        }
                    } else if (y < height - 1) {
                        blockType = ItemType.DIRT;
                    } else if (y === height - 1) {
                        blockType = ItemType.GRASS;

                        // 地表の植物
                        if (Math.random() < 0.05) {
                            const plantKey = this.getBlockKey(worldX, y + 1, worldZ);
                            if (Math.random() < 0.3) {
                                this.setBlockType(worldX, y + 1, worldZ, ItemType.FLOWER_RED);
                            } else if (Math.random() < 0.3) {
                                this.setBlockType(worldX, y + 1, worldZ, ItemType.FLOWER_YELLOW);
                            }
                        }

                        // 木の生成
                        if (Math.random() < 0.02) {
                            this.generateTree(worldX, y + 1, worldZ);
                        }
                    }

                    if (blockType !== ItemType.AIR) {
                        this.setBlockType(worldX, y, worldZ, blockType);
                    }
                }
            }
        }

        return chunk;
    }

    generateTree(x, y, z) {
        const trunkHeight = 4 + Math.floor(Math.random() * 2);

        // 幹
        for (let i = 0; i < trunkHeight; i++) {
            this.setBlockType(x, y + i, z, ItemType.WOOD);
        }

        // 葉
        const leafY = y + trunkHeight;
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -2; dz <= 2; dz++) {
                    if (dx === 0 && dy === -1 && dz === 0) continue; // 幹の位置
                    if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && Math.random() < 0.5) continue; // 角をランダムに削る
                    this.setBlockType(x + dx, leafY + dy, z + dz, ItemType.LEAVES);
                }
            }
        }
    }

    loadChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        if (this.chunks.has(key)) return;

        this.chunks.set(key, true);
        this.generateTerrain(chunkX, chunkZ);
    }

    unloadChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        if (!this.chunks.has(key)) return;

        // チャンク内のブロックメッシュを削除
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldZ = chunkZ * this.chunkSize + z;

                for (let y = 0; y < this.worldHeight; y++) {
                    const blockKey = this.getBlockKey(worldX, y, worldZ);
                    const mesh = this.blockMeshes.get(blockKey);
                    if (mesh) {
                        this.scene.remove(mesh);
                        mesh.geometry.dispose();
                        this.blockMeshes.delete(blockKey);
                    }
                    this.blockData.delete(blockKey);
                }
            }
        }

        this.chunks.delete(key);
    }

    updateChunks(playerX, playerZ, renderDistance = 5) {
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkZ = Math.floor(playerZ / this.chunkSize);

        // 読み込むチャンク
        for (let dx = -renderDistance; dx <= renderDistance; dx++) {
            for (let dz = -renderDistance; dz <= renderDistance; dz++) {
                this.loadChunk(playerChunkX + dx, playerChunkZ + dz);
            }
        }

        // 遠いチャンクをアンロード
        const chunksToUnload = [];
        this.chunks.forEach((_, key) => {
            const [chunkX, chunkZ] = key.split(',').map(Number);
            const dist = Math.max(Math.abs(chunkX - playerChunkX), Math.abs(chunkZ - playerChunkZ));
            if (dist > renderDistance + 2) {
                chunksToUnload.push({ chunkX, chunkZ });
            }
        });

        chunksToUnload.forEach(({ chunkX, chunkZ }) => {
            this.unloadChunk(chunkX, chunkZ);
        });
    }

    setBlockType(x, y, z, type) {
        const key = this.getBlockKey(x, y, z);
        this.blockData.set(key, type);
    }

    getBlockType(x, y, z) {
        const key = this.getBlockKey(x, y, z);
        return this.blockData.get(key) || ItemType.AIR;
    }

    placeBlock(x, y, z, type) {
        const key = this.getBlockKey(x, y, z);

        // 既存のブロックを削除
        this.removeBlock(x, y, z);

        // 新しいブロックを設置
        if (type !== ItemType.AIR && itemInfo[type] && itemInfo[type].solid) {
            this.setBlockType(x, y, z, type);
            this.createBlockMesh(x, y, z, type);
        }
    }

    removeBlock(x, y, z) {
        const key = this.getBlockKey(x, y, z);
        const mesh = this.blockMeshes.get(key);

        if (mesh) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            this.blockMeshes.delete(key);
        }

        this.blockData.delete(key);
    }

    createBlockMesh(x, y, z, type) {
        const key = this.getBlockKey(x, y, z);

        // 既存のメッシュがあれば削除
        if (this.blockMeshes.has(key)) {
            const oldMesh = this.blockMeshes.get(key);
            this.scene.remove(oldMesh);
            oldMesh.geometry.dispose();
        }

        const material = this.materials.get(type);
        if (!material) return;

        const mesh = new THREE.Mesh(this.blockGeometry, material);
        mesh.position.set(x, y, z);
        mesh.userData = { blockType: type, x, y, z };

        this.scene.add(mesh);
        this.blockMeshes.set(key, mesh);
    }

    renderVisibleBlocks(playerX, playerY, playerZ, renderDistance = 30) {
        const minX = Math.floor(playerX - renderDistance);
        const maxX = Math.floor(playerX + renderDistance);
        const minY = Math.max(0, Math.floor(playerY - renderDistance));
        const maxY = Math.min(this.worldHeight, Math.floor(playerY + renderDistance));
        const minZ = Math.floor(playerZ - renderDistance);
        const maxZ = Math.floor(playerZ + renderDistance);

        // 描画範囲内のブロックを更新
        this.blockData.forEach((type, key) => {
            const [x, y, z] = key.split(',').map(Number);

            if (x >= minX && x <= maxX && y >= minY && y <= maxY && z >= minZ && z <= maxZ) {
                if (!this.blockMeshes.has(key)) {
                    this.createBlockMesh(x, y, z, type);
                }
            } else {
                // 範囲外のメッシュを削除
                const mesh = this.blockMeshes.get(key);
                if (mesh) {
                    this.scene.remove(mesh);
                    mesh.geometry.dispose();
                    this.blockMeshes.delete(key);
                }
            }
        });
    }

    raycast(origin, direction, maxDistance = 10) {
        const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance);
        const intersects = raycaster.intersectObjects(Array.from(this.blockMeshes.values()));

        if (intersects.length > 0) {
            const intersection = intersects[0];
            const block = intersection.object;
            const point = intersection.point;
            const normal = intersection.face.normal;

            return {
                block: block,
                position: { x: block.userData.x, y: block.userData.y, z: block.userData.z },
                point: point,
                normal: normal,
                blockType: block.userData.blockType
            };
        }

        return null;
    }

    isBlockSolid(x, y, z) {
        const type = this.getBlockType(x, y, z);
        return type !== ItemType.AIR && itemInfo[type] && itemInfo[type].solid;
    }

    checkCollision(box) {
        const minX = Math.floor(box.min.x);
        const maxX = Math.ceil(box.max.x);
        const minY = Math.floor(box.min.y);
        const maxY = Math.ceil(box.max.y);
        const minZ = Math.floor(box.min.z);
        const maxZ = Math.ceil(box.max.z);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                for (let z = minZ; z <= maxZ; z++) {
                    if (this.isBlockSolid(x, y, z)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}

window.World = World;
