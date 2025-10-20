class Inventory {
    constructor() {
        this.slots = 9; // ホットバーのスロット数
        this.items = new Array(this.slots).fill(null).map(() => ({ type: ItemType.AIR, count: 0 }));
        this.selectedSlot = 0;

        this.setupControls();

        // 初期アイテム
        this.addItem(ItemType.GRASS, 10);
        this.addItem(ItemType.DIRT, 10);
        this.addItem(ItemType.WOOD, 5);
    }

    setupControls() {
        // 数字キーでスロット選択
        document.addEventListener('keydown', (e) => {
            const key = parseInt(e.key);
            if (key >= 1 && key <= this.slots) {
                this.selectedSlot = key - 1;
                this.updateUI();
            }

            // マウスホイールでスロット切り替え
            if (e.code === 'BracketLeft') {
                this.selectedSlot = (this.selectedSlot - 1 + this.slots) % this.slots;
                this.updateUI();
            } else if (e.code === 'BracketRight') {
                this.selectedSlot = (this.selectedSlot + 1) % this.slots;
                this.updateUI();
            }
        });

        // マウスホイール
        document.addEventListener('wheel', (e) => {
            if (e.deltaY > 0) {
                this.selectedSlot = (this.selectedSlot + 1) % this.slots;
            } else {
                this.selectedSlot = (this.selectedSlot - 1 + this.slots) % this.slots;
            }
            this.updateUI();
        });
    }

    addItem(itemType, count = 1) {
        if (itemType === ItemType.AIR) return false;

        // 既存のスロットに追加
        for (let i = 0; i < this.slots; i++) {
            if (this.items[i].type === itemType) {
                this.items[i].count += count;
                this.updateUI();
                return true;
            }
        }

        // 空きスロットに追加
        for (let i = 0; i < this.slots; i++) {
            if (this.items[i].type === ItemType.AIR || this.items[i].count === 0) {
                this.items[i] = { type: itemType, count: count };
                this.updateUI();
                return true;
            }
        }

        return false; // インベントリが満杯
    }

    removeItem(itemType, count = 1) {
        for (let i = 0; i < this.slots; i++) {
            if (this.items[i].type === itemType) {
                this.items[i].count -= count;
                if (this.items[i].count <= 0) {
                    this.items[i] = { type: ItemType.AIR, count: 0 };
                }
                this.updateUI();
                return true;
            }
        }
        return false;
    }

    hasItem(itemType, count = 1) {
        for (let i = 0; i < this.slots; i++) {
            if (this.items[i].type === itemType && this.items[i].count >= count) {
                return true;
            }
        }
        return false;
    }

    getItemCount(itemType) {
        let total = 0;
        for (let i = 0; i < this.slots; i++) {
            if (this.items[i].type === itemType) {
                total += this.items[i].count;
            }
        }
        return total;
    }

    getSelectedItem() {
        return this.items[this.selectedSlot];
    }

    useSelectedItem() {
        const item = this.getSelectedItem();
        if (item.type !== ItemType.AIR && item.count > 0) {
            item.count--;
            if (item.count <= 0) {
                this.items[this.selectedSlot] = { type: ItemType.AIR, count: 0 };
            }
            this.updateUI();
            return item.type;
        }
        return null;
    }

    updateUI() {
        // UIの更新はui.jsで処理
        if (window.updateHotbar) {
            window.updateHotbar();
        }
    }

    getItems() {
        return this.items;
    }

    getSelectedSlot() {
        return this.selectedSlot;
    }

    clear() {
        this.items = new Array(this.slots).fill(null).map(() => ({ type: ItemType.AIR, count: 0 }));
        this.selectedSlot = 0;
        this.updateUI();
    }

    serialize() {
        return {
            slots: this.slots,
            items: this.items.map(item => ({ type: item.type, count: item.count })),
            selectedSlot: this.selectedSlot
        };
    }

    deserialize(data) {
        this.slots = data.slots || 9;
        this.items = data.items.map(item => ({ type: item.type, count: item.count }));
        this.selectedSlot = data.selectedSlot || 0;
        this.updateUI();
    }
}

class CraftingSystem {
    constructor(inventory) {
        this.inventory = inventory;
        this.craftingGrid = new Array(9).fill(ItemType.AIR);
        this.hasCraftingTable = false;
    }

    setCraftingGrid(grid) {
        this.craftingGrid = [...grid];
    }

    getCraftingGrid() {
        return [...this.craftingGrid];
    }

    checkRecipe2x2() {
        // 2x2レシピをチェック
        const grid2x2 = [
            this.craftingGrid[0], this.craftingGrid[1],
            this.craftingGrid[3], this.craftingGrid[4]
        ];

        for (const recipe of recipes2x2) {
            if (this.matchPattern(grid2x2, recipe.pattern)) {
                return { result: recipe.result, count: recipe.count };
            }
        }

        return null;
    }

    checkRecipe3x3() {
        // 3x3レシピをチェック（作業台が必要）
        if (!this.hasCraftingTable) return null;

        for (const recipe of recipes3x3) {
            if (this.matchPattern(this.craftingGrid, recipe.pattern)) {
                return { result: recipe.result, count: recipe.count };
            }
        }

        return null;
    }

    matchPattern(grid, pattern) {
        if (grid.length !== pattern.length) return false;

        for (let i = 0; i < grid.length; i++) {
            if (grid[i] !== pattern[i]) {
                return false;
            }
        }

        return true;
    }

    craft() {
        let recipe = this.checkRecipe3x3();
        if (!recipe) {
            recipe = this.checkRecipe2x2();
        }

        if (recipe) {
            // レシピの材料を消費
            const materialCounts = {};
            this.craftingGrid.forEach(type => {
                if (type !== ItemType.AIR) {
                    materialCounts[type] = (materialCounts[type] || 0) + 1;
                }
            });

            // インベントリから材料を削除
            for (const [type, count] of Object.entries(materialCounts)) {
                this.inventory.removeItem(parseInt(type), count);
            }

            // 結果アイテムを追加
            this.inventory.addItem(recipe.result, recipe.count);

            // クラフトグリッドをクリア
            this.craftingGrid.fill(ItemType.AIR);

            return recipe;
        }

        return null;
    }

    setHasCraftingTable(value) {
        this.hasCraftingTable = value;
    }

    updateCraftingTableStatus() {
        this.hasCraftingTable = this.inventory.hasItem(ItemType.CRAFTING_TABLE);
    }
}

window.Inventory = Inventory;
window.CraftingSystem = CraftingSystem;
