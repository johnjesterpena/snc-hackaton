import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const menuItemSchema = z.object({
  id: z.string().uuid().optional(),
  category_id: z.string().uuid("Select a category"),
  name: z.string().min(2, "Name is required").max(80),
  description: z.string().max(240).optional().or(z.literal("")),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price"),
  is_available: z.boolean(),
  estimated_prep_minutes: z.coerce.number().int().positive().optional().or(z.literal("")),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(40),
});

export const orderLineSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.coerce.number().int().positive(),
  notes: z.string().max(160).optional().or(z.literal("")),
});

export const createOrderSchema = z.object({
  table_id: z.string().uuid(),
  items: z.array(orderLineSchema).min(1, "Add at least one item"),
});

export const replaceOrderSchema = z.object({
  order_id: z.string().uuid(),
  items: z.array(orderLineSchema).min(1),
});

export const statusSchema = z.object({
  order_id: z.string().uuid(),
  to: z.enum(["preparing", "ready", "served", "cancelled"]),
});

export const paymentSchema = z.object({
  order_id: z.string().uuid(),
  cash_tendered: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter cash received")
    .optional()
    .or(z.literal("")),
});
