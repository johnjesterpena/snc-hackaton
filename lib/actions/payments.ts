"use server";

import { revalidatePath } from "next/cache";
import { requireActionPermission } from "@/lib/auth";
import { changeCentavos, numericToCentavos, pesosToCentavos } from "@/lib/business/money";
import { createClient } from "@/lib/supabase/server";
import { paymentSchema } from "@/lib/validations";

export async function recordCashPaymentAction(input: unknown) {
  const profile = await requireActionPermission("payments.record");
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid payment" };
  }

  const supabase = await createClient();
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("quantity, unit_price_snapshot")
    .eq("order_id", parsed.data.order_id);
  if (itemsError) return { error: itemsError.message };

  const totalCentavos = (items ?? []).reduce(
    (sum, item) =>
      sum + numericToCentavos(item.unit_price_snapshot) * Number(item.quantity),
    0,
  );
  const totalPesos = (totalCentavos / 100).toFixed(2);

  let tendered: string | null = parsed.data.cash_tendered || null;
  if (tendered) {
    try {
      changeCentavos(pesosToCentavos(tendered), totalCentavos);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid cash amount" };
    }
  }

  const { error } = await supabase.rpc("complete_cash_payment", {
    p_order_id: parsed.data.order_id,
    p_amount: totalPesos,
    p_cash_tendered: tendered,
    p_recorded_by: profile.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/checkout");
  revalidatePath("/tables");
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/kitchen");
  return { ok: true as const };
}
