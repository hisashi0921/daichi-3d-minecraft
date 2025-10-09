// アイテムタイプの定義
const ItemType = {
    AIR: 0,

    // 基本ブロック (1-6)
    DIRT: 1,
    GRASS: 2,
    STONE: 3,
    WOOD: 4,
    LEAVES: 5,
    SAND: 6,

    // クラフト可能ブロック (7-22)
    PLANKS: 7,
    STICK: 8,
    CRAFTING_TABLE: 9,
    WOODEN_PICKAXE: 10,
    STONE_PICKAXE: 11,
    IRON_PICKAXE: 12,
    DIAMOND_PICKAXE: 13,
    WOODEN_AXE: 14,
    STONE_AXE: 15,
    CHEST: 16,
    FURNACE: 17,
    GLASS: 18,
    BRICK: 19,
    IRON_BLOCK: 20,
    GOLD_BLOCK: 21,
    DIAMOND_BLOCK: 22,

    // 楽しいアイテム (23-32)
    RAINBOW_BLOCK: 23,
    SMILE_BLOCK: 24,
    CAKE: 25,
    FLOWER_RED: 26,
    FLOWER_YELLOW: 27,
    MUSHROOM_RED: 28,
    MUSHROOM_BROWN: 29,
    TORCH: 30,
    LADDER: 31,
    DOOR: 32,

    // 鉱石 (33-36)
    COAL_ORE: 33,
    IRON_ORE: 34,
    GOLD_ORE: 35,
    DIAMOND_ORE: 36,

    // 剣 (37-41)
    WOODEN_SWORD: 37,
    STONE_SWORD: 38,
    IRON_SWORD: 39,
    GOLD_SWORD: 40,
    DIAMOND_SWORD: 41,

    // 防具 (42-49)
    LEATHER_HELMET: 42,
    LEATHER_CHESTPLATE: 43,
    LEATHER_LEGGINGS: 44,
    LEATHER_BOOTS: 45,
    IRON_HELMET: 46,
    IRON_CHESTPLATE: 47,
    IRON_LEGGINGS: 48,
    IRON_BOOTS: 49,

    // その他アイテム (50-60)
    COAL: 50,
    IRON_INGOT: 51,
    GOLD_INGOT: 52,
    DIAMOND: 53,
    ARROW: 54,
    BOW: 55,
    BREAD: 56,
    APPLE: 57,
    GOLDEN_APPLE: 58,
    BUCKET: 59,
    WATER_BUCKET: 60
};

// アイテム情報
const itemInfo = {
    [ItemType.AIR]: { name: '空気', color: 0x000000, icon: '', drops: ItemType.AIR, solid: false },
    [ItemType.DIRT]: { name: '土', color: 0x654321, icon: '🟤土', drops: ItemType.DIRT, solid: true },
    [ItemType.GRASS]: { name: '草', color: 0x5FAD56, icon: '🟢草', drops: ItemType.DIRT, solid: true },
    [ItemType.STONE]: { name: '石', color: 0x999999, icon: '⚪石', drops: ItemType.STONE, solid: true },
    [ItemType.WOOD]: { name: '原木', color: 0x8B4513, icon: '🟫木', drops: ItemType.WOOD, solid: true },
    [ItemType.LEAVES]: { name: '葉', color: 0x228B22, icon: '🍃葉', drops: ItemType.AIR, solid: true },
    [ItemType.SAND]: { name: '砂', color: 0xF4A460, icon: '🟡砂', drops: ItemType.SAND, solid: true },

    [ItemType.PLANKS]: { name: '板', color: 0xDEB887, icon: '🟫板', drops: ItemType.PLANKS, solid: true },
    [ItemType.STICK]: { name: '棒', color: 0x8B7355, icon: '🟫棒', drops: ItemType.STICK, solid: false },
    [ItemType.CRAFTING_TABLE]: { name: '作業台', color: 0x8B4513, icon: '🔨台', drops: ItemType.CRAFTING_TABLE, solid: true },
    [ItemType.WOODEN_PICKAXE]: { name: '木のツルハシ', color: 0x8B4513, icon: '⛏️木', drops: ItemType.WOODEN_PICKAXE, solid: false },
    [ItemType.STONE_PICKAXE]: { name: '石のツルハシ', color: 0x808080, icon: '⛏️石', drops: ItemType.STONE_PICKAXE, solid: false },
    [ItemType.IRON_PICKAXE]: { name: '鉄のツルハシ', color: 0xC0C0C0, icon: '⛏️鉄', drops: ItemType.IRON_PICKAXE, solid: false },
    [ItemType.DIAMOND_PICKAXE]: { name: 'ダイヤツルハシ', color: 0x00FFFF, icon: '⛏️💎', drops: ItemType.DIAMOND_PICKAXE, solid: false },
    [ItemType.WOODEN_AXE]: { name: '木の斧', color: 0x8B4513, icon: '🪓木', drops: ItemType.WOODEN_AXE, solid: false },
    [ItemType.STONE_AXE]: { name: '石の斧', color: 0x808080, icon: '🪓石', drops: ItemType.STONE_AXE, solid: false },
    [ItemType.CHEST]: { name: 'チェスト', color: 0x8B4513, icon: '📦箱', drops: ItemType.CHEST, solid: true },
    [ItemType.FURNACE]: { name: 'かまど', color: 0x696969, icon: '🔥炉', drops: ItemType.FURNACE, solid: true },
    [ItemType.GLASS]: { name: 'ガラス', color: 0xE0FFFF, icon: '⬜️G', drops: ItemType.GLASS, solid: true },
    [ItemType.BRICK]: { name: 'レンガ', color: 0xB22222, icon: '🧱赤', drops: ItemType.BRICK, solid: true },
    [ItemType.IRON_BLOCK]: { name: '鉄ブロック', color: 0xC0C0C0, icon: '⚪鉄', drops: ItemType.IRON_BLOCK, solid: true },
    [ItemType.GOLD_BLOCK]: { name: '金ブロック', color: 0xFFD700, icon: '🟡金', drops: ItemType.GOLD_BLOCK, solid: true },
    [ItemType.DIAMOND_BLOCK]: { name: 'ダイヤブロック', color: 0x00FFFF, icon: '💎💎', drops: ItemType.DIAMOND_BLOCK, solid: true },

    [ItemType.RAINBOW_BLOCK]: { name: '虹ブロック', color: 0xFF00FF, icon: '🌈虹', drops: ItemType.RAINBOW_BLOCK, solid: true },
    [ItemType.SMILE_BLOCK]: { name: 'にっこりブロック', color: 0xFFFF00, icon: '😊笑', drops: ItemType.SMILE_BLOCK, solid: true },
    [ItemType.CAKE]: { name: 'ケーキ', color: 0xFFB6C1, icon: '🍰', drops: ItemType.CAKE, solid: true },
    [ItemType.FLOWER_RED]: { name: '赤い花', color: 0xFF0000, icon: '🌹赤', drops: ItemType.FLOWER_RED, solid: false },
    [ItemType.FLOWER_YELLOW]: { name: '黄色い花', color: 0xFFFF00, icon: '🌻黄', drops: ItemType.FLOWER_YELLOW, solid: false },
    [ItemType.MUSHROOM_RED]: { name: '赤キノコ', color: 0xFF0000, icon: '🍄赤', drops: ItemType.MUSHROOM_RED, solid: false },
    [ItemType.MUSHROOM_BROWN]: { name: '茶キノコ', color: 0x8B4513, icon: '🍄茶', drops: ItemType.MUSHROOM_BROWN, solid: false },
    [ItemType.TORCH]: { name: 'たいまつ', color: 0xFFA500, icon: '🔦光', drops: ItemType.TORCH, solid: false },
    [ItemType.LADDER]: { name: 'はしご', color: 0x8B4513, icon: '🪜梯', drops: ItemType.LADDER, solid: false },
    [ItemType.DOOR]: { name: 'ドア', color: 0x8B4513, icon: '🚪扉', drops: ItemType.DOOR, solid: true },

    [ItemType.COAL_ORE]: { name: '石炭鉱石', color: 0x2F4F4F, icon: '⚫炭', drops: ItemType.COAL, solid: true },
    [ItemType.IRON_ORE]: { name: '鉄鉱石', color: 0xD2B48C, icon: '🟤鉄', drops: ItemType.IRON_ORE, solid: true },
    [ItemType.GOLD_ORE]: { name: '金鉱石', color: 0xFFD700, icon: '🟡金', drops: ItemType.GOLD_ORE, solid: true },
    [ItemType.DIAMOND_ORE]: { name: 'ダイヤ鉱石', color: 0x00CED1, icon: '💎鉱', drops: ItemType.DIAMOND, solid: true },

    [ItemType.WOODEN_SWORD]: { name: '木の剣', color: 0x8B4513, icon: '⚔️木', drops: ItemType.WOODEN_SWORD, solid: false },
    [ItemType.STONE_SWORD]: { name: '石の剣', color: 0x808080, icon: '⚔️石', drops: ItemType.STONE_SWORD, solid: false },
    [ItemType.IRON_SWORD]: { name: '鉄の剣', color: 0xC0C0C0, icon: '⚔️鉄', drops: ItemType.IRON_SWORD, solid: false },
    [ItemType.GOLD_SWORD]: { name: '金の剣', color: 0xFFD700, icon: '⚔️金', drops: ItemType.GOLD_SWORD, solid: false },
    [ItemType.DIAMOND_SWORD]: { name: 'ダイヤの剣', color: 0x00FFFF, icon: '⚔️💎', drops: ItemType.DIAMOND_SWORD, solid: false },

    [ItemType.LEATHER_HELMET]: { name: '革の帽子', color: 0x8B4513, icon: '🎩革', drops: ItemType.LEATHER_HELMET, solid: false },
    [ItemType.LEATHER_CHESTPLATE]: { name: '革の上着', color: 0x8B4513, icon: '👕革', drops: ItemType.LEATHER_CHESTPLATE, solid: false },
    [ItemType.LEATHER_LEGGINGS]: { name: '革のズボン', color: 0x8B4513, icon: '👖革', drops: ItemType.LEATHER_LEGGINGS, solid: false },
    [ItemType.LEATHER_BOOTS]: { name: '革のブーツ', color: 0x8B4513, icon: '👢革', drops: ItemType.LEATHER_BOOTS, solid: false },
    [ItemType.IRON_HELMET]: { name: '鉄の兜', color: 0xC0C0C0, icon: '🎩鉄', drops: ItemType.IRON_HELMET, solid: false },
    [ItemType.IRON_CHESTPLATE]: { name: '鉄の鎧', color: 0xC0C0C0, icon: '👕鉄', drops: ItemType.IRON_CHESTPLATE, solid: false },
    [ItemType.IRON_LEGGINGS]: { name: '鉄のレギンス', color: 0xC0C0C0, icon: '👖鉄', drops: ItemType.IRON_LEGGINGS, solid: false },
    [ItemType.IRON_BOOTS]: { name: '鉄のブーツ', color: 0xC0C0C0, icon: '👢鉄', drops: ItemType.IRON_BOOTS, solid: false },

    [ItemType.COAL]: { name: '石炭', color: 0x2F4F4F, icon: '⚫炭', drops: ItemType.COAL, solid: false },
    [ItemType.IRON_INGOT]: { name: '鉄インゴット', color: 0xC0C0C0, icon: '◼️鉄', drops: ItemType.IRON_INGOT, solid: false },
    [ItemType.GOLD_INGOT]: { name: '金インゴット', color: 0xFFD700, icon: '◼️金', drops: ItemType.GOLD_INGOT, solid: false },
    [ItemType.DIAMOND]: { name: 'ダイヤモンド', color: 0x00FFFF, icon: '💎', drops: ItemType.DIAMOND, solid: false },
    [ItemType.ARROW]: { name: '矢', color: 0x8B4513, icon: '➡️矢', drops: ItemType.ARROW, solid: false },
    [ItemType.BOW]: { name: '弓', color: 0x8B4513, icon: '🏹弓', drops: ItemType.BOW, solid: false },
    [ItemType.BREAD]: { name: 'パン', color: 0xFFE4B5, icon: '🍞', drops: ItemType.BREAD, solid: false },
    [ItemType.APPLE]: { name: 'リンゴ', color: 0xFF0000, icon: '🍎', drops: ItemType.APPLE, solid: false },
    [ItemType.GOLDEN_APPLE]: { name: '金のリンゴ', color: 0xFFD700, icon: '🍎✨', drops: ItemType.GOLDEN_APPLE, solid: false },
    [ItemType.BUCKET]: { name: 'バケツ', color: 0x808080, icon: '🪣空', drops: ItemType.BUCKET, solid: false },
    [ItemType.WATER_BUCKET]: { name: '水入りバケツ', color: 0x1E90FF, icon: '🪣水', drops: ItemType.WATER_BUCKET, solid: false }
};

// 2x2レシピ（手でクラフト可能）
const recipes2x2 = [
    { pattern: [ItemType.WOOD, 0, 0, 0], result: ItemType.PLANKS, count: 4 },
    { pattern: [ItemType.PLANKS, 0, 0, ItemType.PLANKS], result: ItemType.STICK, count: 4 },
    { pattern: [ItemType.PLANKS, ItemType.PLANKS, ItemType.PLANKS, ItemType.PLANKS], result: ItemType.CRAFTING_TABLE, count: 1 },
    { pattern: [ItemType.STONE, ItemType.STONE, ItemType.STONE, ItemType.STONE], result: ItemType.BRICK, count: 1 },
    { pattern: [ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT], result: ItemType.IRON_BLOCK, count: 1 },
    { pattern: [ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT, ItemType.GOLD_INGOT], result: ItemType.GOLD_BLOCK, count: 1 },
    { pattern: [ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND], result: ItemType.DIAMOND_BLOCK, count: 1 }
];

// 3x3レシピ（作業台が必要）
const recipes3x3 = [
    // ツール
    { pattern: [ItemType.PLANKS, ItemType.PLANKS, ItemType.PLANKS, 0, ItemType.STICK, 0, 0, ItemType.STICK, 0], result: ItemType.WOODEN_PICKAXE, count: 1 },
    { pattern: [ItemType.STONE, ItemType.STONE, ItemType.STONE, 0, ItemType.STICK, 0, 0, ItemType.STICK, 0], result: ItemType.STONE_PICKAXE, count: 1 },
    { pattern: [ItemType.IRON_INGOT, ItemType.IRON_INGOT, ItemType.IRON_INGOT, 0, ItemType.STICK, 0, 0, ItemType.STICK, 0], result: ItemType.IRON_PICKAXE, count: 1 },
    { pattern: [ItemType.DIAMOND, ItemType.DIAMOND, ItemType.DIAMOND, 0, ItemType.STICK, 0, 0, ItemType.STICK, 0], result: ItemType.DIAMOND_PICKAXE, count: 1 },

    { pattern: [ItemType.PLANKS, ItemType.PLANKS, 0, ItemType.PLANKS, ItemType.STICK, 0, 0, ItemType.STICK, 0], result: ItemType.WOODEN_AXE, count: 1 },
    { pattern: [ItemType.STONE, ItemType.STONE, 0, ItemType.STONE, ItemType.STICK, 0, 0, ItemType.STICK, 0], result: ItemType.STONE_AXE, count: 1 },

    // 剣
    { pattern: [0, ItemType.PLANKS, 0, 0, ItemType.PLANKS, 0, 0, ItemType.STICK, 0], result: ItemType.WOODEN_SWORD, count: 1 },
    { pattern: [0, ItemType.STONE, 0, 0, ItemType.STONE, 0, 0, ItemType.STICK, 0], result: ItemType.STONE_SWORD, count: 1 },
    { pattern: [0, ItemType.IRON_INGOT, 0, 0, ItemType.IRON_INGOT, 0, 0, ItemType.STICK, 0], result: ItemType.IRON_SWORD, count: 1 },
    { pattern: [0, ItemType.GOLD_INGOT, 0, 0, ItemType.GOLD_INGOT, 0, 0, ItemType.STICK, 0], result: ItemType.GOLD_SWORD, count: 1 },
    { pattern: [0, ItemType.DIAMOND, 0, 0, ItemType.DIAMOND, 0, 0, ItemType.STICK, 0], result: ItemType.DIAMOND_SWORD, count: 1 },

    // その他
    { pattern: [ItemType.PLANKS, ItemType.PLANKS, ItemType.PLANKS, ItemType.PLANKS, 0, ItemType.PLANKS, ItemType.PLANKS, ItemType.PLANKS, ItemType.PLANKS], result: ItemType.CHEST, count: 1 },
    { pattern: [ItemType.STONE, ItemType.STONE, ItemType.STONE, ItemType.STONE, 0, ItemType.STONE, ItemType.STONE, ItemType.STONE, ItemType.STONE], result: ItemType.FURNACE, count: 1 },
    { pattern: [0, ItemType.COAL, 0, 0, ItemType.STICK, 0, 0, 0, 0], result: ItemType.TORCH, count: 4 },
    { pattern: [ItemType.IRON_INGOT, 0, ItemType.IRON_INGOT, 0, ItemType.IRON_INGOT, 0, 0, 0, 0], result: ItemType.BUCKET, count: 1 },

    // 楽しいアイテム
    { pattern: [ItemType.DIAMOND, ItemType.GOLD_INGOT, ItemType.IRON_INGOT, ItemType.GOLD_INGOT, ItemType.DIAMOND, ItemType.GOLD_INGOT, ItemType.IRON_INGOT, ItemType.GOLD_INGOT, ItemType.DIAMOND], result: ItemType.RAINBOW_BLOCK, count: 1 },
    { pattern: [ItemType.GOLD_INGOT, ItemType.DIAMOND, ItemType.GOLD_INGOT, ItemType.DIAMOND, ItemType.GOLD_INGOT, ItemType.DIAMOND, ItemType.GOLD_INGOT, ItemType.DIAMOND, ItemType.GOLD_INGOT], result: ItemType.SMILE_BLOCK, count: 1 },
    { pattern: [ItemType.PLANKS, ItemType.PLANKS, ItemType.PLANKS, ItemType.APPLE, ItemType.APPLE, ItemType.APPLE, ItemType.PLANKS, ItemType.PLANKS, ItemType.PLANKS], result: ItemType.CAKE, count: 1 }
];

// グローバルに公開
window.ItemType = ItemType;
window.itemInfo = itemInfo;
window.recipes2x2 = recipes2x2;
window.recipes3x3 = recipes3x3;
