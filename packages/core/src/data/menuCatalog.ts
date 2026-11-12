import type { MenuItem } from '../types/store.js';

export interface MenuItemTemplate {
  templateId: string;
  name: string;
  category: MenuItem['category'];
  basePrice: number;
  costOfGoods: number; // 原価率はおよそ25〜30%(健全な水準)を目安に較正
  qualityScore: number; // 0-100。ベースメニューの提供品質(焙煎豆適用等で後から加点される)
  unlockCost: number; // レシピ開発費。会社全体で一度支払えば全店舗でaddMenuItemToStore可能になる
}

/**
 * 全50種のメニューカタログ(Phase G追加)。coffee/tea/tapioca/cake/sandwich/merchandiseの6カテゴリ。
 * unlockCostはEspresso/Americano/Latteの3種のみ0(店舗開業時から誰でも作れる定番)、
 * それ以外は複雑さ・原材料の希少性に応じて5,000円〜90,000円(ドリンク・食事)、
 * 25,000円〜55,000円(物販)の範囲で較正した。
 */
export const menuCatalog: MenuItemTemplate[] = [
  // --- coffee (12) ---
  { templateId: 'menu-espresso', name: 'Espresso', category: 'coffee', basePrice: 400, costOfGoods: 100, qualityScore: 65, unlockCost: 0 },
  { templateId: 'menu-americano', name: 'Americano', category: 'coffee', basePrice: 420, costOfGoods: 105, qualityScore: 62, unlockCost: 0 },
  { templateId: 'menu-latte', name: 'Café Latte', category: 'coffee', basePrice: 550, costOfGoods: 140, qualityScore: 68, unlockCost: 0 },
  { templateId: 'menu-cappuccino', name: 'Cappuccino', category: 'coffee', basePrice: 550, costOfGoods: 140, qualityScore: 68, unlockCost: 8_000 },
  { templateId: 'menu-mocha', name: 'Caffè Mocha', category: 'coffee', basePrice: 600, costOfGoods: 165, qualityScore: 70, unlockCost: 15_000 },
  { templateId: 'menu-caramel-macchiato', name: 'Caramel Macchiato', category: 'coffee', basePrice: 620, costOfGoods: 170, qualityScore: 70, unlockCost: 15_000 },
  { templateId: 'menu-flat-white', name: 'Flat White', category: 'coffee', basePrice: 580, costOfGoods: 150, qualityScore: 74, unlockCost: 25_000 },
  { templateId: 'menu-cortado', name: 'Cortado', category: 'coffee', basePrice: 500, costOfGoods: 130, qualityScore: 72, unlockCost: 20_000 },
  { templateId: 'menu-cold-brew', name: 'Cold Brew Coffee', category: 'coffee', basePrice: 580, costOfGoods: 155, qualityScore: 75, unlockCost: 35_000 },
  { templateId: 'menu-iced-latte', name: 'Iced Latte', category: 'coffee', basePrice: 570, costOfGoods: 145, qualityScore: 68, unlockCost: 10_000 },
  { templateId: 'menu-affogato', name: 'Affogato', category: 'coffee', basePrice: 680, costOfGoods: 190, qualityScore: 80, unlockCost: 60_000 },
  { templateId: 'menu-pour-over', name: 'Single Origin Pour Over', category: 'coffee', basePrice: 650, costOfGoods: 175, qualityScore: 85, unlockCost: 90_000 },

  // --- tea (8) ---
  { templateId: 'menu-earl-grey', name: 'Earl Grey', category: 'tea', basePrice: 450, costOfGoods: 110, qualityScore: 65, unlockCost: 5_000 },
  { templateId: 'menu-english-breakfast', name: 'English Breakfast Tea', category: 'tea', basePrice: 430, costOfGoods: 105, qualityScore: 62, unlockCost: 5_000 },
  { templateId: 'menu-green-tea', name: 'Green Tea', category: 'tea', basePrice: 420, costOfGoods: 100, qualityScore: 60, unlockCost: 5_000 },
  { templateId: 'menu-chamomile', name: 'Chamomile Tea', category: 'tea', basePrice: 460, costOfGoods: 115, qualityScore: 63, unlockCost: 8_000 },
  { templateId: 'menu-chai-latte', name: 'Chai Latte', category: 'tea', basePrice: 580, costOfGoods: 155, qualityScore: 72, unlockCost: 20_000 },
  { templateId: 'menu-iced-tea', name: 'Iced Tea', category: 'tea', basePrice: 440, costOfGoods: 105, qualityScore: 60, unlockCost: 6_000 },
  { templateId: 'menu-matcha-latte', name: 'Matcha Latte', category: 'tea', basePrice: 620, costOfGoods: 170, qualityScore: 76, unlockCost: 30_000 },
  { templateId: 'menu-hojicha-latte', name: 'Hojicha Latte', category: 'tea', basePrice: 600, costOfGoods: 160, qualityScore: 74, unlockCost: 28_000 },

  // --- tapioca (6) ---
  { templateId: 'menu-tapioca-classic', name: 'クラシックミルクティータピオカ', category: 'tapioca', basePrice: 550, costOfGoods: 155, qualityScore: 68, unlockCost: 20_000 },
  { templateId: 'menu-tapioca-brownsugar', name: '黒糖タピオカミルク', category: 'tapioca', basePrice: 620, costOfGoods: 175, qualityScore: 74, unlockCost: 40_000 },
  { templateId: 'menu-tapioca-taro', name: 'タロイモタピオカ', category: 'tapioca', basePrice: 630, costOfGoods: 180, qualityScore: 73, unlockCost: 45_000 },
  { templateId: 'menu-tapioca-mango', name: 'マンゴータピオカ', category: 'tapioca', basePrice: 680, costOfGoods: 195, qualityScore: 75, unlockCost: 55_000 },
  { templateId: 'menu-tapioca-matcha', name: '抹茶タピオカ', category: 'tapioca', basePrice: 700, costOfGoods: 200, qualityScore: 78, unlockCost: 65_000 },
  { templateId: 'menu-tapioca-strawberry', name: 'いちごタピオカ', category: 'tapioca', basePrice: 690, costOfGoods: 198, qualityScore: 76, unlockCost: 60_000 },

  // --- cake (10) ---
  { templateId: 'menu-cheesecake', name: 'ベイクドチーズケーキ', category: 'cake', basePrice: 550, costOfGoods: 150, qualityScore: 70, unlockCost: 15_000 },
  { templateId: 'menu-gateau-chocolat', name: 'ガトーショコラ', category: 'cake', basePrice: 580, costOfGoods: 160, qualityScore: 72, unlockCost: 20_000 },
  { templateId: 'menu-carrot-cake', name: 'キャロットケーキ', category: 'cake', basePrice: 560, costOfGoods: 150, qualityScore: 68, unlockCost: 15_000 },
  { templateId: 'menu-tiramisu', name: 'ティラミス', category: 'cake', basePrice: 620, costOfGoods: 175, qualityScore: 76, unlockCost: 35_000 },
  { templateId: 'menu-shortcake', name: 'ショートケーキ', category: 'cake', basePrice: 540, costOfGoods: 145, qualityScore: 68, unlockCost: 12_000 },
  { templateId: 'menu-matcha-roll', name: '抹茶ロールケーキ', category: 'cake', basePrice: 590, costOfGoods: 165, qualityScore: 74, unlockCost: 30_000 },
  { templateId: 'menu-baumkuchen', name: 'バウムクーヘン', category: 'cake', basePrice: 480, costOfGoods: 125, qualityScore: 64, unlockCost: 10_000 },
  { templateId: 'menu-montblanc', name: 'モンブラン', category: 'cake', basePrice: 680, costOfGoods: 195, qualityScore: 80, unlockCost: 50_000 },
  { templateId: 'menu-apple-pie', name: 'アップルパイ', category: 'cake', basePrice: 560, costOfGoods: 150, qualityScore: 68, unlockCost: 18_000 },
  { templateId: 'menu-cinnamon-roll', name: 'シナモンロール', category: 'cake', basePrice: 500, costOfGoods: 130, qualityScore: 65, unlockCost: 12_000 },

  // --- sandwich / light meal (10) ---
  { templateId: 'menu-ham-cheese', name: 'ハム&チーズサンドイッチ', category: 'sandwich', basePrice: 580, costOfGoods: 168, qualityScore: 62, unlockCost: 15_000 },
  { templateId: 'menu-club-sandwich', name: 'クラブサンドイッチ', category: 'sandwich', basePrice: 780, costOfGoods: 230, qualityScore: 70, unlockCost: 40_000 },
  { templateId: 'menu-egg-sandwich', name: 'たまごサンド', category: 'sandwich', basePrice: 560, costOfGoods: 165, qualityScore: 60, unlockCost: 12_000 },
  { templateId: 'menu-blt', name: 'BLTサンド', category: 'sandwich', basePrice: 680, costOfGoods: 200, qualityScore: 68, unlockCost: 25_000 },
  { templateId: 'menu-croque-monsieur', name: 'クロックムッシュ', category: 'sandwich', basePrice: 780, costOfGoods: 230, qualityScore: 74, unlockCost: 45_000 },
  { templateId: 'menu-bagel-sandwich', name: 'ベーグルサンド', category: 'sandwich', basePrice: 650, costOfGoods: 190, qualityScore: 66, unlockCost: 22_000 },
  { templateId: 'menu-quiche', name: 'キッシュ', category: 'sandwich', basePrice: 720, costOfGoods: 210, qualityScore: 72, unlockCost: 38_000 },
  { templateId: 'menu-panini', name: 'パニーニ', category: 'sandwich', basePrice: 700, costOfGoods: 205, qualityScore: 70, unlockCost: 32_000 },
  { templateId: 'menu-avocado-toast', name: 'アボカドトースト', category: 'sandwich', basePrice: 750, costOfGoods: 215, qualityScore: 76, unlockCost: 48_000 },
  { templateId: 'menu-soup-set', name: '本日のスープセット', category: 'sandwich', basePrice: 650, costOfGoods: 185, qualityScore: 66, unlockCost: 20_000 },

  // --- merchandise (4) ---
  { templateId: 'menu-beans-bag', name: '自家焙煎コーヒー豆(200g)', category: 'merchandise', basePrice: 1_500, costOfGoods: 420, qualityScore: 70, unlockCost: 25_000 },
  { templateId: 'menu-tumbler', name: 'オリジナルタンブラー', category: 'merchandise', basePrice: 2_200, costOfGoods: 650, qualityScore: 60, unlockCost: 40_000 },
  { templateId: 'menu-mug', name: 'ブランドマグカップ', category: 'merchandise', basePrice: 1_800, costOfGoods: 500, qualityScore: 60, unlockCost: 30_000 },
  { templateId: 'menu-bean-gift-set', name: 'コーヒー豆ギフトセット', category: 'merchandise', basePrice: 3_200, costOfGoods: 950, qualityScore: 68, unlockCost: 55_000 },
];
