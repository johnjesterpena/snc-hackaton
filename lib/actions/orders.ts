"use server";

import { revalidatePath } from "next/cache";
import { requireActionPermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createOrderSchema, replaceOrderSchema, statusSchema } from "@/lib/validations";

function revalidateOps() {
  revalidatePath("/tables");
  revalidatePath("/orders");
  revalidatePath("/kitchen");
  revalidatePath("/checkout");
  revalidatePath("/dashboard");
}

export async function createOrderAction(input: unknown) {
  await requireActionPermission("orders.manage");
  const parsed = createOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid order" };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_dine_in_order", {
    p_table_id: parsed.data.table_id,
    p_items: parsed.data.items,
  });
  if (error) return { error: error.message };
  revalidateOps();
  return { ok: true as const, orderId: data as string };
}

export async function replaceOrderItemsAction(input: unknown) {
  await requireActionPermission("orders.manage");
  const parsed = replaceOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid order" };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("replace_order_items", {
    p_order_id: parsed.data.order_id,
    p_items: parsed.data.items,
  });
  if (error) return { error: error.message };
  revalidateOps();
  return { ok: true as const };
}

export async function transitionOrderAction(input: unknown) {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status" };
  }
  if (parsed.data.to === "cancelled") {
    await requireActionPermission("orders.manage");
  } else {
    await requireActionPermission("kitchen.update");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("transition_order_status", {
    p_order_id: parsed.data.order_id,
    p_to: parsed.data.to,
  });
  if (error) return { error: error.message };
  revalidateOps();
  return { ok: true as const };
}
