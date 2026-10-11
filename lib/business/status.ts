export const ORDER_STATUSES = [
  "open",
  "preparing",
  "ready",
  "served",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type Role = "admin" | "cashier" | "kitchen";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  open: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served"],
  served: [],
  completed: [],
  cancelled: [],
};

export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  options?: { viaPayment?: boolean },
): boolean {
  if (options?.viaPayment) {
    return from === "served" && to === "completed";
  }
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  options?: { viaPayment?: boolean },
): void {
  if (!canTransition(from, to, options)) {
    throw new Error(`Invalid status transition: ${from} → ${to}`);
  }
}

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return status !== "completed" && status !== "cancelled";
}

export function isEditableOrderStatus(status: OrderStatus): boolean {
  return status === "open" || status === "preparing";
}

export function canCancel(status: OrderStatus): boolean {
  return status === "open" || status === "preparing";
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  open: "Pending",
  preparing: "Preparing",
  ready: "Ready",
  served: "Served",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const KITCHEN_COLUMNS: OrderStatus[] = ["open", "preparing", "ready"];
