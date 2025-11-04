class UIManager {
    constructor(inventory, craftingSystem, player, dayNightCycle, enemyManager) {
        this.inventory = inventory;
        this.craftingSystem = craftingSystem;
        this.player = player;
        this.dayNightCycle = dayNightCycle;
        this.enemyManager = enemyManager;

        this.craftingMenuOpen = false;
        this.recipeMenuOpen = false;

        this.setupUI();
    }

    setupUI() {
        // ホットバーの作成
        this.createHotbar();

        // クラフトボタン
        document.getElementById('craft-button').addEventListener('click', () => {
            this.toggleCraftingMenu();
        });

        // レシピボタン
        document.getElementById('recipe-button').addEventListener('click', () => {
            this.toggleRecipeMenu();
        });

        // クラフトメニューを閉じる
        document.getElementById('close-craft').addEventListener('click', () => {
            this.toggleCraftingMenu();
        });

        // レシピメニューを閉じる
        document.getElementById('close-recipe').addEventListener('click', () => {
            this.toggleRecipeMenu();
        });

        // クラフトグリッドのセットアップ
        this.setupCraftingGrid();

        // レシピリストの作成
        this.createRecipeList();

        // 初期UI更新
        this.updateHotbar();
        this.updateStats();
    }

    createHotbar() {
        const hotbar = document.getElementById('hotbar');
        hotbar.innerHTML = '';

        for (let i = 0; i < this.inventory.slots; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            slot.dataset.slot = i;

            if (i === this.inventory.selectedSlot) {
                slot.classList.add('selected');
            }

            slot.addEventListener('click', () => {
                this.inventory.selectedSlot = i;
                this.updateHotbar();
            });

            hotbar.appendChild(slot);
        }
    }

    updateHotbar() {
        const items = this.inventory.getItems();
        const selectedSlot = this.inventory.getSelectedSlot();

        for (let i = 0; i < this.inventory.slots; i++) {
            const slot = document.querySelector(`.hotbar-slot[data-slot="${i}"]`);
            if (!slot) continue;

            const item = items[i];

            if (item.type !== ItemType.AIR && item.count > 0) {
                const info = itemInfo[item.type];
                slot.innerHTML = `
                    <span>${info.icon}</span>
                    <span class="count">${item.count}</span>
                `;
            } else {
                slot.innerHTML = '';
            }

            if (i === selectedSlot) {
                slot.classList.add('selected');
            } else {
                slot.classList.remove('selected');
            }
        }
    }

    setupCraftingGrid() {
        const grid = document.getElementById('crafting-grid');
        const slots = grid.querySelectorAll('.craft-slot:not(#craft-result)');

        slots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.handleCraftingSlotClick(index);
            });
        });

        // クラフト結果スロットのクリック
        document.getElementById('craft-result').addEventListener('click', () => {
            this.executeCraft();
        });
    }

    handleCraftingSlotClick(slotIndex) {
        const selectedItem = this.inventory.getSelectedItem();

        if (selectedItem.type !== ItemType.AIR && selectedItem.count > 0) {
            // アイテムを配置
            const grid = this.craftingSystem.getCraftingGrid();
            grid[slotIndex] = selectedItem.type;
            this.craftingSystem.setCraftingGrid(grid);
            this.inventory.removeItem(selectedItem.type, 1);
        } else {
            // アイテムを取り除く
            const grid = this.craftingSystem.getCraftingGrid();
            if (grid[slotIndex] !== ItemType.AIR) {
                this.inventory.addItem(grid[slotIndex], 1);
                grid[slotIndex] = ItemType.AIR;
                this.craftingSystem.setCraftingGrid(grid);
            }
        }

        this.updateCraftingGrid();
        this.updateHotbar();
    }

    updateCraftingGrid() {
        const grid = this.craftingSystem.getCraftingGrid();
        const slots = document.querySelectorAll('.craft-slot:not(#craft-result)');

        slots.forEach((slot, index) => {
            const itemType = grid[index];
            if (itemType !== ItemType.AIR) {
                const info = itemInfo[itemType];
                slot.innerHTML = `<span>${info.icon}</span>`;
            } else {
                slot.innerHTML = '';
            }
        });

        // クラフト結果をチェック
        this.craftingSystem.updateCraftingTableStatus();
        const recipe = this.craftingSystem.checkRecipe3x3() || this.craftingSystem.checkRecipe2x2();

        const resultSlot = document.getElementById('craft-result');
        if (recipe) {
            const info = itemInfo[recipe.result];
            resultSlot.innerHTML = `
                <span>${info.icon}</span>
                <span class="count">${recipe.count}</span>
            `;
            resultSlot.style.cursor = 'pointer';
        } else {
            resultSlot.innerHTML = '結果';
            resultSlot.style.cursor = 'default';
        }
    }

    executeCraft() {
        const recipe = this.craftingSystem.craft();
        if (recipe) {
            this.updateCraftingGrid();
            this.updateHotbar();
        }
    }

    toggleCraftingMenu() {
        this.craftingMenuOpen = !this.craftingMenuOpen;
        const menu = document.getElementById('crafting-menu');

        if (this.craftingMenuOpen) {
            menu.style.display = 'block';
            document.exitPointerLock();
            this.updateCraftingGrid();
        } else {
            menu.style.display = 'none';
            // クラフトグリッドに残っているアイテムを返却
            const grid = this.craftingSystem.getCraftingGrid();
            grid.forEach(itemType => {
                if (itemType !== ItemType.AIR) {
                    this.inventory.addItem(itemType, 1);
                }
            });
            this.craftingSystem.setCraftingGrid(new Array(9).fill(ItemType.AIR));
            this.updateHotbar();
        }
    }

    toggleRecipeMenu() {
        this.recipeMenuOpen = !this.recipeMenuOpen;
        const menu = document.getElementById('recipe-menu');

        if (this.recipeMenuOpen) {
            menu.style.display = 'block';
            document.exitPointerLock();
        } else {
            menu.style.display = 'none';
        }
    }

    createRecipeList() {
        const recipeList = document.getElementById('recipe-list');
        recipeList.innerHTML = '<h3>手でクラフト（2x2）</h3>';

        // 2x2レシピ
        recipes2x2.forEach(recipe => {
            const recipeDiv = this.createRecipeItem(recipe, false);
            recipeList.appendChild(recipeDiv);
        });

        recipeList.innerHTML += '<h3>作業台でクラフト（3x3）</h3>';

        // 3x3レシピ
        recipes3x3.forEach(recipe => {
            const recipeDiv = this.createRecipeItem(recipe, true);
            recipeList.appendChild(recipeDiv);
        });
    }

    createRecipeItem(recipe, is3x3) {
        const div = document.createElement('div');
        div.className = 'recipe-item';

        const resultInfo = itemInfo[recipe.result];
        div.innerHTML = `<h3>${resultInfo.icon} ${resultInfo.name} x${recipe.count}</h3>`;

        const patternDiv = document.createElement('div');
        patternDiv.className = `recipe-pattern ${is3x3 ? 'grid-3x3' : 'grid-2x2'}`;

        recipe.pattern.forEach(itemType => {
            const cell = document.createElement('div');
            cell.className = 'recipe-cell';

            if (itemType !== ItemType.AIR) {
                const info = itemInfo[itemType];
                cell.innerHTML = info.icon;
            }

            patternDiv.appendChild(cell);
        });

        div.appendChild(patternDiv);
        return div;
    }

    updateStats() {
        // 時刻表示
        document.getElementById('time-display').textContent = this.dayNightCycle.getTimeString();

        // 体力バー
        const healthBar = document.getElementById('health-bar');
        healthBar.innerHTML = '';
        const hearts = Math.ceil(this.player.health / 2);
        const maxHearts = Math.ceil(this.player.maxHealth / 2);

        for (let i = 0; i < maxHearts; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart';
            if (i < hearts) {
                if (this.player.health % 2 === 1 && i === hearts - 1) {
                    heart.textContent = '💔'; // 半分のハート
                } else {
                    heart.textContent = '❤️';
                }
            } else {
                heart.textContent = '🖤';
            }
            healthBar.appendChild(heart);
        }

        // 敵の数
        document.getElementById('enemy-count').textContent = this.enemyManager.getEnemyCount();
    }

    isCraftingMenuOpen() {
        return this.craftingMenuOpen;
    }

    isRecipeMenuOpen() {
        return this.recipeMenuOpen;
    }

    isAnyMenuOpen() {
        return this.craftingMenuOpen || this.recipeMenuOpen;
    }
}

// グローバル関数
window.updateHotbar = function() {
    if (window.uiManager) {
        window.uiManager.updateHotbar();
    }
};

window.UIManager = UIManager;
