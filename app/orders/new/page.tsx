import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Category, DiningTable, MenuItem } from "@/lib/types";
import { OrderComposer } from "@/components/order-composer";
import { StaffShell } from "@/components/staff-shell";

export const metadata: Metadata = {
  title: "New order | SNC SmartResto",
};

export default async function NewOrderPage({
  searchParams,
}: PageProps<"/orders/new">) {
  const profile = await requirePermission("orders.manage");
  const params = await searchParams;
  const supabase = await createClient();

  const [categoriesResult, menuResult, tablesResult] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase
      .from("menu_items")
      .select("id, category_id, name, description, price, is_available, estimated_prep_minutes")
      .order("name"),
    supabase
      .from("dining_tables")
      .select("id, table_number, capacity, status")
      .eq("status", "available")
      .order("table_number"),
  ]);

  if (categoriesResult.error) {
    throw new Error(`Unable to load menu categories: ${categoriesResult.error.message}`);
  }
  if (menuResult.error) {
    throw new Error(`Unable to load menu items: ${menuResult.error.message}`);
  }
  if (tablesResult.error) {
    throw new Error(`Unable to load available tables: ${tablesResult.error.message}`);
  }

  const categories = (categoriesResult.data ?? []) as Category[];
  const menuItems = (menuResult.data ?? []) as MenuItem[];
  const tables = ((tablesResult.data ?? []) as DiningTable[]).sort((a, b) =>
    a.table_number.localeCompare(b.table_number, undefined, { numeric: true }),
  );
  const requestedTable = typeof params.table === "string" ? params.table : "";
  const initialTableId = tables.some((table) => table.id === requestedTable)
    ? requestedTable
    : (tables[0]?.id ?? "");

  return (
    <StaffShell profile={profile}>
      <OrderComposer
        categories={categories}
        menuItems={menuItems}
        tables={tables}
        initialTableId={initialTableId}
      />
    </StaffShell>
  );
}
