class World {
    constructor(scene) {
        this.scene = scene;
        this.chunkSize = 16;
        this.worldWidth = 100;
        this.worldDepth = 100;
        this.worldHeight = 50; // 極限軽量化：60→50に削減

        this.chunks = new Map(); // チャンクデータ
        this.chunkMeshes = new Map(); // チャンク単位のメッシュ（最適化）
        this.blockData = new Map(); // ブロックタイプ

        // マテリアルキャッシュ
        this.materials = new Map();
        this.createMaterials();
    }

    createMaterials() {
        // 各ブロックタイプのマテリアルを作成
        for (let type in itemInfo) {
            const info = itemInfo[type];
            if (info.solid && type != ItemType.AIR) {
                this.materials.set(parseInt(type), new THREE.MeshLambertMaterial({
                    color: info.color,
                    flatShading: true,
                    vertexColors: false
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
        for (let localX = 0; localX < this.chunkSize; localX++) {
            for (let localZ = 0; localZ < this.chunkSize; localZ++) {
                const worldX = chunkX * this.chunkSize + localX;
                const worldZ = chunkZ * this.chunkSize + localZ;

                // 地形生成を簡略化（CPU削減）
                const height = Math.floor(
                    30 +
                    Math.sin(worldX * 0.1) * 3 +
                    Math.cos(worldZ * 0.1) * 3
                );

                for (let y = 0; y < this.worldHeight; y++) {
                    let blockType = ItemType.AIR;

                    if (y === 0) {
                        blockType = ItemType.STONE;
                    } else if (y < height - 5) {
                        // 鉱石生成を削減（軽量化）
                        if (y < 10) {
                            blockType = ItemType.STONE;
                            if (Math.random() < 0.001) blockType = ItemType.DIAMOND_ORE;
                            else if (Math.random() < 0.002) blockType = ItemType.GOLD_ORE;
                        } else if (y < 20) {
                            blockType = ItemType.STONE;
                            if (Math.random() < 0.003) blockType = ItemType.IRON_ORE;
                            else if (Math.random() < 0.004) blockType = ItemType.COAL_ORE;
                        } else {
                            blockType = ItemType.STONE;
                            if (Math.random() < 0.005) blockType = ItemType.COAL_ORE;
                        }
                    } else if (y < height - 1) {
                        blockType = ItemType.DIRT;
                    } else if (y === height - 1) {
                        blockType = ItemType.GRASS;

                        // 花の生成を大幅削減（軽量化）
                        if (Math.random() < 0.01) {
                            if (Math.random() < 0.5) {
                                this.setBlockType(worldX, y + 1, worldZ, ItemType.FLOWER_RED);
                            }
                        }

                        // 木の生成を大幅削減（2%→0.3%、85%削減で軽量化）
                        if (Math.random() < 0.003) {
                            this.generateTree(worldX, y + 1, worldZ);
                        }
                    }

                    if (blockType !== ItemType.AIR) {
                        this.setBlockType(worldX, y, worldZ, blockType);
                    }
                }
            }
        }
    }

    generateTree(x, y, z) {
        // 幹を短く（軽量化）
        const trunkHeight = 3;

        for (let i = 0; i < trunkHeight; i++) {
            this.setBlockType(x, y + i, z, ItemType.WOOD);
        }

        // 葉を小さく簡略化（-2～2 → -1～1、60%削減で軽量化）
        const leafY = y + trunkHeight;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = 0; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    if (dx === 0 && dy === 0 && dz === 0) continue; // 幹の位置
                    this.setBlockType(x + dx, leafY + dy, z + dz, ItemType.LEAVES);
                }
            }
        }
    }

    loadChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        if (this.chunks.has(key)) return;

        this.chunks.set(key, { needsRebuild: true });
        this.generateTerrain(chunkX, chunkZ);
    }

    unloadChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        if (!this.chunks.has(key)) return;

        // チャンクメッシュを削除
        const mesh = this.chunkMeshes.get(key);
        if (mesh) {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            this.chunkMeshes.delete(key);
        }

        // ブロックデータを削除
        for (let x = 0; x < this.chunkSize; x++) {
            for (let z = 0; z < this.chunkSize; z++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldZ = chunkZ * this.chunkSize + z;

                for (let y = 0; y < this.worldHeight; y++) {
                    this.blockData.delete(this.getBlockKey(worldX, y, worldZ));
                }
            }
        }

        this.chunks.delete(key);
    }

    updateChunks(playerX, playerZ, renderDistance = 5) {
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkZ = Math.floor(playerZ / this.chunkSize);

        for (let dx = -renderDistance; dx <= renderDistance; dx++) {
            for (let dz = -renderDistance; dz <= renderDistance; dz++) {
                this.loadChunk(playerChunkX + dx, playerChunkZ + dz);
            }
        }

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
        const oldType = this.blockData.get(key);

        // 変更がなければ何もしない（CPU削減）
        if (oldType === type) return;

        this.blockData.set(key, type);

        // 影響を受けるチャンクに再構築フラグを立てる（遅延実行）
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        this.markChunkForRebuild(chunkX, chunkZ);

        // チャンク境界のブロックなら隣接チャンクも再構築
        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;
        if (localX === 0) this.markChunkForRebuild(chunkX - 1, chunkZ);
        if (localX === this.chunkSize - 1) this.markChunkForRebuild(chunkX + 1, chunkZ);
        if (localZ === 0) this.markChunkForRebuild(chunkX, chunkZ - 1);
        if (localZ === this.chunkSize - 1) this.markChunkForRebuild(chunkX, chunkZ + 1);
    }

    getBlockType(x, y, z) {
        const key = this.getBlockKey(x, y, z);
        return this.blockData.get(key) || ItemType.AIR;
    }

    markChunkForRebuild(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        const chunk = this.chunks.get(key);
        if (chunk) {
            chunk.needsRebuild = true;
        }
    }

    // チャンク単位でメッシュを構築（GPU最適化 + Y軸範囲制限）
    buildChunkMesh(chunkX, chunkZ, playerY = 40) {
        const key = this.getChunkKey(chunkX, chunkZ);

        // 既存のメッシュを削除
        const oldMesh = this.chunkMeshes.get(key);
        if (oldMesh) {
            this.scene.remove(oldMesh);
            if (oldMesh.geometry) oldMesh.geometry.dispose();
        }

        // ブロックタイプごとにジオメトリを分ける
        const geometriesByType = new Map();

        // Y軸方向の描画範囲を制限（プレイヤー周辺のみ）超軽量化
        const minY = Math.max(0, Math.floor(playerY) - 10);
        const maxY = Math.min(this.worldHeight, Math.floor(playerY) + 10);

        for (let localX = 0; localX < this.chunkSize; localX++) {
            for (let localZ = 0; localZ < this.chunkSize; localZ++) {
                for (let localY = minY; localY < maxY; localY++) {
                    const worldX = chunkX * this.chunkSize + localX;
                    const worldZ = chunkZ * this.chunkSize + localZ;
                    const worldY = localY;

                    const blockType = this.getBlockType(worldX, worldY, worldZ);
                    if (blockType === ItemType.AIR || !itemInfo[blockType] || !itemInfo[blockType].solid) continue;

                    if (!geometriesByType.has(blockType)) {
                        geometriesByType.set(blockType, {
                            positions: [],
                            normals: [],
                            indices: []
                        });
                    }

                    const geomData = geometriesByType.get(blockType);
                    this.addBlockFaces(worldX, worldY, worldZ, geomData);
                }
            }
        }

        // メッシュグループを作成
        const group = new THREE.Group();

        geometriesByType.forEach((geomData, blockType) => {
            if (geomData.positions.length === 0) return;

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(geomData.positions, 3));
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(geomData.normals, 3));
            geometry.setIndex(geomData.indices);

            const material = this.materials.get(blockType);
            if (material) {
                const mesh = new THREE.Mesh(geometry, material);
                group.add(mesh);

                // エッジライン追加（視認性向上）
                const edges = new THREE.EdgesGeometry(geometry, 30);
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0x000000,
                    opacity: 0.3,
                    transparent: true,
                    linewidth: 1
                });
                const wireframe = new THREE.LineSegments(edges, lineMaterial);
                group.add(wireframe);
            }
        });

        if (group.children.length > 0) {
            this.scene.add(group);
            this.chunkMeshes.set(key, group);
        }

        // 再構築フラグをクリア
        const chunk = this.chunks.get(key);
        if (chunk) {
            chunk.needsRebuild = false;
        }
    }

    // ブロックの面を追加（隠れた面は除外）
    addBlockFaces(x, y, z, geomData) {
        const faces = [
            { dir: [0, 1, 0], corners: [[0,1,0], [1,1,0], [1,1,1], [0,1,1]] },  // 上
            { dir: [0, -1, 0], corners: [[0,0,1], [1,0,1], [1,0,0], [0,0,0]] }, // 下
            { dir: [1, 0, 0], corners: [[1,0,0], [1,1,0], [1,1,1], [1,0,1]] },  // 右
            { dir: [-1, 0, 0], corners: [[0,0,1], [0,1,1], [0,1,0], [0,0,0]] }, // 左
            { dir: [0, 0, 1], corners: [[0,0,1], [1,0,1], [1,1,1], [0,1,1]] },  // 前
            { dir: [0, 0, -1], corners: [[1,0,0], [0,0,0], [0,1,0], [1,1,0]] }  // 後
        ];

        faces.forEach(face => {
            const [dx, dy, dz] = face.dir;
            const neighborType = this.getBlockType(x + dx, y + dy, z + dz);

            // 隣接ブロックが透明なら面を描画
            if (neighborType === ItemType.AIR || !itemInfo[neighborType] || !itemInfo[neighborType].solid) {
                const baseIndex = geomData.positions.length / 3;

                face.corners.forEach(corner => {
                    geomData.positions.push(x + corner[0], y + corner[1], z + corner[2]);
                    geomData.normals.push(dx, dy, dz);
                });

                geomData.indices.push(
                    baseIndex, baseIndex + 1, baseIndex + 2,
                    baseIndex, baseIndex + 2, baseIndex + 3
                );
            }
        });
    }

    renderVisibleBlocks(playerX, playerY, playerZ, renderDistance = 5) {
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkZ = Math.floor(playerZ / this.chunkSize);

        // CPU負荷削減：フレームごとに最大1チャンクのみ再構築
        let rebuiltThisFrame = false;

        // 表示範囲内のチャンクのメッシュを構築（Y座標も渡す）
        this.chunks.forEach((chunk, key) => {
            if (rebuiltThisFrame) return; // 今フレームは再構築済み

            const [chunkX, chunkZ] = key.split(',').map(Number);
            const dist = Math.max(Math.abs(chunkX - playerChunkX), Math.abs(chunkZ - playerChunkZ));

            if (dist <= renderDistance && chunk.needsRebuild) {
                this.buildChunkMesh(chunkX, chunkZ, playerY);
                rebuiltThisFrame = true;
            }
        });
    }

    placeBlock(x, y, z, type) {
        this.removeBlock(x, y, z);

        if (type !== ItemType.AIR && itemInfo[type] && itemInfo[type].solid) {
            this.setBlockType(x, y, z, type);
        }
    }

    removeBlock(x, y, z) {
        this.setBlockType(x, y, z, ItemType.AIR);
    }

    raycast(origin, direction, maxDistance = 10) {
        const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance);
        const meshes = [];

        this.chunkMeshes.forEach(group => {
            group.children.forEach(mesh => meshes.push(mesh));
        });

        const intersects = raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            const intersection = intersects[0];
            const point = intersection.point;
            const normal = intersection.face.normal;

            // ブロック座標を計算
            const blockX = Math.floor(point.x - normal.x * 0.5);
            const blockY = Math.floor(point.y - normal.y * 0.5);
            const blockZ = Math.floor(point.z - normal.z * 0.5);

            return {
                position: { x: blockX, y: blockY, z: blockZ },
                point: point,
                normal: normal,
                blockType: this.getBlockType(blockX, blockY, blockZ)
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
