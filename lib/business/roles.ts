import type { Role } from "./status";

export type Permission =
  | "menu.manage"
  | "menu.view"
  | "tables.manage"
  | "orders.manage"
  | "orders.viewKitchen"
  | "kitchen.update"
  | "payments.record"
  | "reports.view"
  | "staff.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "menu.manage",
    "menu.view",
    "tables.manage",
    "orders.manage",
    "orders.viewKitchen",
    "kitchen.update",
    "payments.record",
    "reports.view",
    "staff.manage",
  ],
  cashier: [
    "menu.view",
    "tables.manage",
    "orders.manage",
    "orders.viewKitchen",
    "kitchen.update",
    "payments.record",
  ],
  kitchen: ["menu.view", "orders.viewKitchen", "kitchen.update"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function assertPermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error("You do not have permission to perform this action");
  }
}

export function homePathForRole(role: Role): string {
  if (role === "kitchen") return "/kitchen";
  if (role === "cashier") return "/tables";
  return "/dashboard";
}
