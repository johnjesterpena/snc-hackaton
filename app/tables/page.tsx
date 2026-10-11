import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { DiningTable } from "@/lib/types";
import { StaffShell } from "@/components/staff-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Tables | SNC SmartResto",
};

export default async function TablesPage() {
  const profile = await requirePermission("tables.manage");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dining_tables")
    .select("id, table_number, capacity, status")
    .order("table_number");

  if (error) {
    throw new Error(`Unable to load dining tables: ${error.message}`);
  }

  const tables = ((data ?? []) as DiningTable[]).sort((a, b) =>
    a.table_number.localeCompare(b.table_number, undefined, { numeric: true }),
  );
  const availableCount = tables.filter((table) => table.status === "available").length;
  const occupiedCount = tables.length - availableCount;

  return (
    <StaffShell profile={profile}>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Front desk</p>
            <h1 className="text-3xl font-semibold tracking-tight">Table board</h1>
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {availableCount} available · {occupiedCount} occupied
          </p>
        </header>

        {tables.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No dining tables found. Add tables to the `dining_tables` table in Supabase.
            </CardContent>
          </Card>
        ) : (
          <section
            aria-label="Dining tables"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {tables.map((table) => {
              const available = table.status === "available";
              return (
                <Card key={table.id}>
                  <CardHeader className="flex-row items-start justify-between">
                    <CardTitle className="text-xl">Table {table.table_number}</CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        available
                          ? "border-emerald-300 bg-emerald-100 text-emerald-950"
                          : "border-amber-300 bg-amber-100 text-amber-950"
                      }
                    >
                      {available ? "Available" : "Occupied"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p>
                      {table.capacity == null
                        ? "Capacity not set"
                        : `Seats up to ${table.capacity}`}
                    </p>
                    {available ? (
                      <Button
                        className="mt-4 w-full"
                        nativeButton={false}
                        render={<Link href={`/orders/new?table=${encodeURIComponent(table.id)}`} />}
                      >
                        Start order
                        <ArrowRight aria-hidden="true" />
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}
      </div>
    </StaffShell>
  );
}
