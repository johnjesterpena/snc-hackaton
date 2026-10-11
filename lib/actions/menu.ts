"use server";

import { revalidatePath } from "next/cache";
import { requireActionPermission } from "@/lib/auth";
import { pesosToCentavos } from "@/lib/business/money";
import { createClient } from "@/lib/supabase/server";
import { categorySchema, menuItemSchema } from "@/lib/validations";

export async function upsertMenuItem(formData: FormData) {
  await requireActionPermission("menu.manage");
  const parsed = menuItemSchema.safeParse({
    id: formData.get("id") || undefined,
    category_id: formData.get("category_id"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    is_available: formData.get("is_available") === "on",
    estimated_prep_minutes: formData.get("estimated_prep_minutes") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid menu item" };
  }

  pesosToCentavos(parsed.data.price);
  const supabase = await createClient();
  const payload = {
    category_id: parsed.data.category_id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price: parsed.data.price,
    is_available: parsed.data.is_available,
    estimated_prep_minutes:
      parsed.data.estimated_prep_minutes === "" || parsed.data.estimated_prep_minutes == null
        ? null
        : Number(parsed.data.estimated_prep_minutes),
  };

  const query = parsed.data.id
    ? supabase.from("menu_items").update(payload).eq("id", parsed.data.id)
    : supabase.from("menu_items").insert(payload);

  const { error } = await query;
  if (error) return { error: error.message };
  revalidatePath("/menu");
  return { ok: true as const };
}

export async function setMenuAvailability(id: string, isAvailable: boolean) {
  await requireActionPermission("menu.manage");
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/menu");
  return { ok: true as const };
}

export async function createCategory(formData: FormData) {
  await requireActionPermission("menu.manage");
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid category" };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({ name: parsed.data.name });
  if (error) return { error: error.message };
  revalidatePath("/menu");
  return { ok: true as const };
}
