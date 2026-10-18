export const SKUS = [
  {
    id: "no-ads-month",
    title: "去广告",
    subtitle: "月卡",
    amount: 1800,
    priceLabel: "¥18",
    period: "每月",
    perk: "学习时不再出现广告",
    best: false,
  },
  {
    id: "subject-pack",
    title: "单科包",
    subtitle: "英语启蒙",
    amount: 3000,
    priceLabel: "¥30",
    period: "买断示意",
    perk: "记下英语课包权益",
    best: false,
  },
  {
    id: "all-year",
    title: "全科会员",
    subtitle: "年卡",
    amount: 12800,
    priceLabel: "¥128",
    period: "每年",
    perk: "四科与游戏次数示意开通",
    best: true,
  },
] as const;

export type SkuId = (typeof SKUS)[number]["id"];

export function findSku(id: string) {
  return SKUS.find((sku) => sku.id === id) ?? null;
}
