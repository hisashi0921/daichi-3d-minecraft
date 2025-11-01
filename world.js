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
                // 草ブロックは面ごとに異なる色
                if (parseInt(type) === ItemType.GRASS) {
                    this.materials.set(parseInt(type), [
                        new THREE.MeshBasicMaterial({ color: 0x5FAD56, side: THREE.DoubleSide }), // 上面：緑
                        new THREE.MeshBasicMaterial({ color: 0x8B7355, side: THREE.DoubleSide }), // 下面：茶色
                        new THREE.MeshBasicMaterial({ color: 0x8B9D6C, side: THREE.DoubleSide })  // 横面：茶色がかった緑
                    ]);
                } else {
                    // 他のブロックは単一色
                    this.materials.set(parseInt(type), new THREE.MeshBasicMaterial({
                        color: info.color,
                        side: THREE.DoubleSide
                    }));
                }
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

        // Y軸方向の描画範囲（プレイヤーの足元周辺を確実に描画）
        // プレイヤーの足元付近を中心に描画範囲を設定
        const minY = 0; // 地面の最下層から描画（確実性優先）
        const maxY = this.worldHeight; // 上限まで描画

        let blockCount = 0;
        let belowPlayerCount = 0;
        let topFaceCount = 0;

        for (let localX = 0; localX < this.chunkSize; localX++) {
            for (let localZ = 0; localZ < this.chunkSize; localZ++) {
                for (let localY = minY; localY < maxY; localY++) {
                    const worldX = chunkX * this.chunkSize + localX;
                    const worldZ = chunkZ * this.chunkSize + localZ;
                    const worldY = localY;

                    const blockType = this.getBlockType(worldX, worldY, worldZ);
                    if (blockType === ItemType.AIR || !itemInfo[blockType] || !itemInfo[blockType].solid) continue;

                    blockCount++;
                    if (worldY < playerY - 1) {
                        belowPlayerCount++;
                    }

                    if (!geometriesByType.has(blockType)) {
                        geometriesByType.set(blockType, {
                            positions: [],
                            normals: [],
                            indices: [],
                            groups: [], // 面ごとのマテリアルグループ
                            topFaces: 0
                        });
                    }

                    const geomData = geometriesByType.get(blockType);
                    const beforeLength = geomData.positions.length;
                    this.addBlockFaces(worldX, worldY, worldZ, geomData, blockType);
                    const afterLength = geomData.positions.length;

                    // 上面が追加されたかチェック（1面 = 4頂点 = 12 positions）
                    if (afterLength - beforeLength >= 12) {
                        topFaceCount++;
                    }
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

            // 草ブロックの場合、面ごとのマテリアルグループを適用
            if (blockType === ItemType.GRASS && geomData.groups.length > 0) {
                geomData.groups.forEach(g => {
                    geometry.addGroup(g.start, g.count, g.materialIndex);
                });
            }

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

            // デバッグログ
            let totalFaces = 0;
            geometriesByType.forEach((geomData, blockType) => {
                const faceCount = geomData.indices.length / 6; // 6インデックス = 1面
                totalFaces += faceCount;
            });
            console.log(`チャンク(${chunkX}, ${chunkZ})構築: ブロック数=${blockCount}, メッシュ数=${group.children.length / 2}, 面数=${totalFaces}`);
        } else {
            console.log(`チャンク(${chunkX}, ${chunkZ}): メッシュなし（ブロック数=${blockCount}）`);
        }

        // 再構築フラグをクリア
        const chunk = this.chunks.get(key);
        if (chunk) {
            chunk.needsRebuild = false;
        }
    }

    // ブロックの面を追加（隠れた面は除外）
    addBlockFaces(x, y, z, geomData, blockType) {
        const faces = [
            { name: '上', dir: [0, 1, 0], corners: [[0,1,0], [1,1,0], [1,1,1], [0,1,1]] },  // 上
            { name: '下', dir: [0, -1, 0], corners: [[0,0,1], [1,0,1], [1,0,0], [0,0,0]] }, // 下
            { name: '右', dir: [1, 0, 0], corners: [[1,0,0], [1,1,0], [1,1,1], [1,0,1]] },  // 右
            { name: '左', dir: [-1, 0, 0], corners: [[0,0,1], [0,1,1], [0,1,0], [0,0,0]] }, // 左
            { name: '前', dir: [0, 0, 1], corners: [[0,0,1], [1,0,1], [1,1,1], [0,1,1]] },  // 前
            { name: '後', dir: [0, 0, -1], corners: [[1,0,0], [0,0,0], [0,1,0], [1,1,0]] }  // 後
        ];

        faces.forEach(face => {
            const [dx, dy, dz] = face.dir;
            const neighborType = this.getBlockType(x + dx, y + dy, z + dz);

            // 全ての面に隠面除去を適用（隣接ブロックがAIRまたは非solidの場合のみ描画）
            const shouldRender = (neighborType === ItemType.AIR || !itemInfo[neighborType] || !itemInfo[neighborType].solid);

            if (shouldRender) {
                const baseIndex = geomData.positions.length / 3;
                const startIndex = geomData.indices.length;

                face.corners.forEach(corner => {
                    geomData.positions.push(x + corner[0], y + corner[1], z + corner[2]);
                    geomData.normals.push(dx, dy, dz);
                });

                geomData.indices.push(
                    baseIndex, baseIndex + 1, baseIndex + 2,
                    baseIndex, baseIndex + 2, baseIndex + 3
                );

                // 草ブロックの場合、面ごとにマテリアルインデックスを記録
                if (blockType === ItemType.GRASS) {
                    let materialIndex = 2; // デフォルトは横面
                    if (face.name === '上') materialIndex = 0;
                    else if (face.name === '下') materialIndex = 1;

                    geomData.groups.push({
                        start: startIndex,
                        count: 6, // 2つの三角形 = 6インデックス
                        materialIndex: materialIndex
                    });
                }
            }
        });
    }

    renderVisibleBlocks(playerX, playerY, playerZ, renderDistance = 5, forceAll = false) {
        const playerChunkX = Math.floor(playerX / this.chunkSize);
        const playerChunkZ = Math.floor(playerZ / this.chunkSize);

        // CPU負荷削減：フレームごとに最大1チャンクのみ再構築（forceAllがfalseの場合）
        let rebuiltThisFrame = false;

        // 表示範囲内のチャンクのメッシュを構築（Y座標も渡す）
        this.chunks.forEach((chunk, key) => {
            if (!forceAll && rebuiltThisFrame) return; // 今フレームは再構築済み（forceAll=falseの場合）

            const [chunkX, chunkZ] = key.split(',').map(Number);
            const dist = Math.max(Math.abs(chunkX - playerChunkX), Math.abs(chunkZ - playerChunkZ));

            if (dist <= renderDistance && chunk.needsRebuild) {
                this.buildChunkMesh(chunkX, chunkZ, playerY);
                rebuiltThisFrame = true;
            }
        });
    }

    placeBlock(x, y, z, type) {
        if (type !== ItemType.AIR && itemInfo[type] && itemInfo[type].solid) {
            this.setBlockType(x, y, z, type);

            // 即座にチャンクを再構築（見た目の更新）
            const chunkX = Math.floor(x / this.chunkSize);
            const chunkZ = Math.floor(z / this.chunkSize);
            const playerY = y;
            this.buildChunkMesh(chunkX, chunkZ, playerY);
        }
    }

    removeBlock(x, y, z) {
        this.setBlockType(x, y, z, ItemType.AIR);

        // 即座にチャンクを再構築（見た目の更新）
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const playerY = y;
        this.buildChunkMesh(chunkX, chunkZ, playerY);

        // 隣接チャンクも強制的に再構築
        this.buildChunkMesh(chunkX - 1, chunkZ, playerY);
        this.buildChunkMesh(chunkX + 1, chunkZ, playerY);
        this.buildChunkMesh(chunkX, chunkZ - 1, playerY);
        this.buildChunkMesh(chunkX, chunkZ + 1, playerY);
    }

    raycast(origin, direction, maxDistance = 10) {
        const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance);
        const meshes = [];

        this.chunkMeshes.forEach(group => {
            group.children.forEach(mesh => {
                // ワイヤーフレーム（LineSegments）を除外、Meshのみ対象
                if (mesh instanceof THREE.Mesh) {
                    meshes.push(mesh);
                }
            });
        });

        // デバッグ: メッシュ数を確認（最初の1回だけ）
        if (!this._raycastDebugDone) {
            console.log(`レイキャスト対象: チャンク数=${this.chunkMeshes.size}, メッシュ数=${meshes.length}, blockData数=${this.blockData.size}`);
            this._raycastDebugDone = true;
        }

        const intersects = raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
            const intersection = intersects[0];
            const point = intersection.point;
            const normal = intersection.face.normal;

            // ブロック座標を計算（改良版）
            // 交差点から法線と逆方向に0.001進んで、確実にブロック内部の座標を取得
            const epsilon = 0.001;
            const insideX = point.x - normal.x * epsilon;
            const insideY = point.y - normal.y * epsilon;
            const insideZ = point.z - normal.z * epsilon;

            let blockX = Math.floor(insideX);
            let blockY = Math.floor(insideY);
            let blockZ = Math.floor(insideZ);

            let blockType = this.getBlockType(blockX, blockY, blockZ);

            // 周囲のブロックも確認（デバッグ用）
            const aboveType = this.getBlockType(blockX, blockY + 1, blockZ);
            const belowType = this.getBlockType(blockX, blockY - 1, blockZ);

            // DoubleSideマテリアルの裏面ヒット問題の修正
            // 空気ブロックにヒットし、かつ法線が下向きの場合、下のブロックをチェック
            if (blockType === ItemType.AIR && normal.y < -0.5) {
                // 下向きの面にヒット = ブロックの下面の裏側 = DoubleSideの問題
                if (belowType !== ItemType.AIR) {
                    console.log(`🔧 DoubleSide修正: 空気(${blockY})の下面裏側 → 下のブロック(${blockY - 1})を使用`);
                    blockY = blockY - 1;
                    blockType = belowType;
                }
            }

            // デバッグログ
            console.log(`レイキャスト: 交差点=(${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)}), ` +
                       `法線=(${normal.x}, ${normal.y}, ${normal.z}), ` +
                       `内部座標=(${insideX.toFixed(3)}, ${insideY.toFixed(3)}, ${insideZ.toFixed(3)}), ` +
                       `ブロック座標=(${blockX}, ${blockY}, ${blockZ}), ` +
                       `タイプ=${blockType} (${itemInfo[blockType]?.name || '不明'}), ` +
                       `上=${aboveType} (${itemInfo[aboveType]?.name || '不明'}), ` +
                       `下=${belowType} (${itemInfo[belowType]?.name || '不明'})`);

            return {
                position: { x: blockX, y: blockY, z: blockZ },
                point: point,
                normal: normal,
                blockType: blockType
            };
        }

        console.log('レイキャスト: ヒットなし');
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
