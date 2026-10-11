import type { OrderStatus, Role } from "./business/status";

export type { OrderStatus, Role };

export type Profile = {
  id: string;
  display_name: string;
  role: Role;
};

export type Category = {
  id: string;
  name: string;
};

export type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: string | number;
  is_available: boolean;
  estimated_prep_minutes: number | null;
};

export type DiningTable = {
  id: string;
  table_number: string;
  capacity: number | null;
  status: "available" | "occupied";
};

export type Order = {
  id: string;
  table_id: string;
  created_by: string;
  status: OrderStatus;
  ordered_at: string;
  preparation_started_at: string | null;
  ready_at: string | null;
  served_at: string | null;
  created_at: string;
  completed_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  quantity: number;
  unit_price_snapshot: string | number;
  item_name_snapshot: string;
  notes: string | null;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: string | number;
  method: "cash";
  cash_tendered: string | number | null;
  change_due: string | number | null;
  paid_at: string;
  recorded_by: string;
};
