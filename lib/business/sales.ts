import { numericToCentavos } from "./money";

export type PaidOrderItem = {
  itemName: string;
  quantity: number;
  unitPrice: string | number;
  paidAt: string;
};

export function aggregateSales(items: PaidOrderItem[], now = new Date()) {
  const startOfDay = startOfManilaDay(now);
  const todayItems = items.filter((item) => new Date(item.paidAt) >= startOfDay);

  const revenueCentavos = todayItems.reduce(
    (sum, item) => sum + numericToCentavos(item.unitPrice) * item.quantity,
    0,
  );

  const orderKeys = new Set(
    todayItems.map((item) => `${item.paidAt}|${item.itemName}|${item.quantity}`),
  );

  const topSelling = topItems(todayItems);

  return {
    revenueCentavos,
    itemCount: todayItems.reduce((sum, item) => sum + item.quantity, 0),
    uniqueLineCount: orderKeys.size,
    topSelling,
  };
}

export function topItems(
  items: Array<{ itemName: string; quantity: number; unitPrice: string | number }>,
  limit = 5,
) {
  const map = new Map<string, { name: string; quantity: number; revenueCentavos: number }>();
  for (const item of items) {
    const current = map.get(item.itemName) ?? {
      name: item.itemName,
      quantity: 0,
      revenueCentavos: 0,
    };
    current.quantity += item.quantity;
    current.revenueCentavos += numericToCentavos(item.unitPrice) * item.quantity;
    map.set(item.itemName, current);
  }
  return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}

export function startOfManilaDay(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return new Date(`${parts}T00:00:00+08:00`);
}

export function manilaDayRange(date = new Date()): { start: Date; end: Date } {
  const start = startOfManilaDay(date);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
