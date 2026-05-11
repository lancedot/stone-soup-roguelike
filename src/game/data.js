export const TILE_SIZE = 36;
export const MAP_WIDTH = 32;
export const MAP_HEIGHT = 22;
export const MAX_LOG = 8;

export const TILES = {
  wall: '#',
  floor: '.',
  stairs: '>',
};

export const CLASSES = {
  breadKnight: {
    id: 'breadKnight',
    name: '面包骑士',
    hp: 30,
    attack: 7,
    defense: 3,
    sprite: 'hero_bread_knight',
    victoryCg: 'cg_bread_knight',
    desc: '左手列巴，右手法棍，适合第一次失眠远征。',
    skill: { id: 'baguette_lance', name: '法棍突刺', cooldown: 4, fx: 'fx_baguette_lance', desc: '重击相邻敌人，并用列巴护住自己。' },
  },
  butterArcher: {
    id: 'butterArcher',
    name: '黄油射手',
    hp: 22,
    attack: 8,
    defense: 1,
    sprite: 'hero_butter_archer',
    victoryCg: 'cg_butter_archer',
    desc: '黄油玩得多，擅长远射和滑走。',
    skill: { id: 'butter_shot', name: '黄油箭', cooldown: 3, fx: 'fx_butter_shot', desc: '射击距离 6 内敌人，并滑到旁边空格。' },
  },
  hamWarrior: {
    id: 'hamWarrior',
    name: '火腿战士',
    hp: 26,
    attack: 6,
    defense: 2,
    sprite: 'hero_ham_warrior',
    victoryCg: 'cg_ham_warrior',
    desc: '梦是反的，所以水手战士变成了火腿战士。',
    skill: { id: 'ham_cleave', name: '火腿横扫', cooldown: 4, fx: 'fx_ham_cleave', desc: '挥斩相邻所有敌人，并获得短暂减伤。' },
  },
  lettucePriest: {
    id: 'lettucePriest',
    name: '生菜牧师',
    hp: 24,
    attack: 5,
    defense: 1,
    sprite: 'hero_lettuce_priest',
    victoryCg: 'cg_lettuce_priest',
    desc: '本来只想睡觉，现在负责让队友别倒下。',
    skill: { id: 'leaf_prayer', name: '生菜祈祷', cooldown: 5, fx: 'fx_leaf_prayer', desc: '回复生命；满血时获得清脆护盾。' },
  },
};

export const ENEMY_TYPES = [
  { id: 'nightmare_rat', name: '梦魇老鼠', hp: 8, attack: 3, defense: 0, xp: 3, sprite: 'enemy_nightmare_rat', depth: 1 },
  { id: 'hall_spirit', name: '走廊巡夜灵', hp: 13, attack: 5, defense: 1, xp: 6, sprite: 'enemy_hall_spirit', depth: 1 },
  { id: 'canteen_beetle', name: '食堂甲虫', hp: 18, attack: 7, defense: 2, xp: 10, sprite: 'enemy_canteen_beetle', depth: 2 },
  { id: 'warden_shadow', name: '宿管幻影', hp: 27, attack: 9, defense: 3, xp: 16, sprite: 'enemy_warden_shadow', depth: 3 },
  { id: 'insomnia_lord', name: '失眠魔王', hp: 42, attack: 11, defense: 4, xp: 50, sprite: 'enemy_insomnia_lord', depth: 4, boss: true },
];

export const ITEM_TYPES = [
  { id: 'warm_milk', name: '热牛奶', kind: 'heal', amount: 10, sprite: 'item_warm_milk', desc: '回复 10 点生命。', weight: 2, minDepth: 1, maxPerFloor: 1 },
  { id: 'lettuce_leaf', name: '生菜叶', kind: 'heal', amount: 6, sprite: 'item_lettuce_leaf', desc: '回复 6 点生命。', weight: 2, minDepth: 1, maxPerFloor: 1 },
  { id: 'hard_baguette', name: '硬法棍', kind: 'weapon', attack: 1, sprite: 'item_hard_baguette', desc: '永久攻击 +1。', weight: 4, minDepth: 1, maxPerFloor: 1 },
  { id: 'dense_rye', name: '厚列巴', kind: 'armor', defense: 1, sprite: 'item_dense_rye', desc: '永久防御 +1。', weight: 4, minDepth: 1, maxPerFloor: 1 },
  { id: 'butter_block', name: '黄油块', kind: 'scroll', damage: 7, sprite: 'item_butter_block', desc: '让视野内敌人打滑受伤。', weight: 2, minDepth: 2, maxPerFloor: 1 },
  { id: 'ham_slice', name: '火腿片', kind: 'scroll', damage: 9, sprite: 'item_ham_slice', desc: '对视野内敌人造成伤害。', weight: 1, minDepth: 3, maxPerFloor: 1 },
];
