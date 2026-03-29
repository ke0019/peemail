/** 动物标识符 → 中文名 */
export const ANIMALS = [
  { id: 'otter',       name: '水獭'   },
  { id: 'hamster',     name: '仓鼠'   },
  { id: 'fox',         name: '狐狸'   },
  { id: 'rabbit',      name: '兔子'   },
  { id: 'cat',         name: '猫咪'   },
  { id: 'panda',       name: '熊猫'   },
  { id: 'koala',       name: '考拉'   },
  { id: 'penguin',     name: '企鹅'   },
  { id: 'dolphin',     name: '海豚'   },
  { id: 'owl',         name: '猫头鹰' },
  { id: 'hedgehog',    name: '刺猬'   },
  { id: 'squirrel',    name: '松鼠'   },
  { id: 'raccoon',     name: '浣熊'   },
  { id: 'wolf',        name: '狼'     },
  { id: 'bear',        name: '熊'     },
  { id: 'deer',        name: '鹿'     },
  { id: 'duck',        name: '鸭子'   },
  { id: 'monkey',      name: '猴子'   },
  { id: 'tiger',       name: '老虎'   },
  { id: 'lion',        name: '狮子'   },
  { id: 'zebra',       name: '斑马'   },
  { id: 'elephant',    name: '大象'   },
  { id: 'giraffe',     name: '长颈鹿' },
  { id: 'hippo',       name: '河马'   },
  { id: 'rhino',       name: '犀牛'   },
  { id: 'crocodile',   name: '鳄鱼'   },
  { id: 'turtle',      name: '乌龟'   },
  { id: 'octopus',     name: '章鱼'   },
  { id: 'crab',        name: '螃蟹'   },
  { id: 'butterfly',   name: '蝴蝶'   },
  { id: 'bee',         name: '蜜蜂'   },
  { id: 'ladybug',     name: '瓢虫'   },
  { id: 'dragonfly',   name: '蜻蜓'   },
  { id: 'meerkat',     name: '猫鼬'   },
  { id: 'alpaca',      name: '羊驼'   },
  { id: 'camel',       name: '骆驼'   },
  { id: 'polar_bear',  name: '北极熊' },
  { id: 'seal',        name: '海豹'   },
  { id: 'walrus',      name: '海象'   },
  { id: 'parrot',      name: '鹦鹉'   },
  { id: 'flamingo',    name: '火烈鸟' },
  { id: 'peacock',     name: '孔雀'   },
  { id: 'swan',        name: '天鹅'   },
  { id: 'crane',       name: '仙鹤'   },
  { id: 'ostrich',     name: '鸵鸟'   },
  { id: 'kangaroo',    name: '袋鼠'   },
  { id: 'sloth',       name: '树懒'   },
  { id: 'capybara',    name: '水豚'   },
  { id: 'axolotl',     name: '六角龙' },
  { id: 'red_panda',   name: '小熊猫' },
] as const;

export type AnimalId = (typeof ANIMALS)[number]['id'];

/** 昵称形容词池 */
export const ADJECTIVES = [
  '慵懒的', '急躁的', '好奇的', '害羞的', '开朗的',
  '安静的', '活泼的', '淡定的', '迷糊的', '机灵的',
  '孤独的', '温柔的', '倔强的', '贪吃的', '勤劳的',
  '傲娇的', '迷人的', '憨厚的', '灵动的', '多虑的',
  '豁达的', '敏感的', '幽默的', '严肃的', '随性的',
] as const;

/** 头像主题色（5 种） */
export const AVATAR_COLORS = [
  '#A8D8A8', // 苔绿
  '#F9C784', // 暖黄
  '#FF8C69', // 珊瑚橙
  '#87CEEB', // 天蓝
  '#DDA0DD', // 薰衣草紫
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

/**
 * 随机选取一个形容词 + 动物，组成昵称
 * e.g. "慵懒的水獭"
 */
export function randomNickname(): { nickname: string; avatarAnimal: AnimalId } {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return { nickname: `${adj}${animal.name}`, avatarAnimal: animal.id };
}

/** 随机选取一个主题色 */
export function randomAvatarColor(): AvatarColor {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
