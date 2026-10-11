"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Beef,
  Check,
  ChefHat,
  Coffee,
  CupSoda,
  Fish,
  Plus,
  Search,
  Sandwich,
  Soup,
  Utensils,
  X,
} from "lucide-react";
import { createOrderAction } from "@/lib/actions/orders";
import { formatPhp, numericToCentavos, orderTotalCentavos } from "@/lib/business/money";
import type { Category, DiningTable, MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CartLine = {
  menu_item_id: string;
  name: string;
  description: string | null;
  unitPriceCentavos: number;
  quantity: number;
  notes: string;
};

const THUMBNAIL_STYLES = [
  "from-amber-100 to-orange-200 text-orange-900",
  "from-emerald-100 to-lime-200 text-emerald-900",
  "from-rose-100 to-orange-200 text-rose-900",
  "from-sky-100 to-cyan-200 text-sky-900",
  "from-violet-100 to-fuchsia-200 text-violet-900",
  "from-yellow-100 to-amber-200 text-amber-900",
];

function itemIcon(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("coffee") || normalized.includes("latte") || normalized.includes("barako")) {
    return Coffee;
  }
  if (normalized.includes("juice") || normalized.includes("tea") || normalized.includes("drink")) {
    return CupSoda;
  }
  if (normalized.includes("fish") || normalized.includes("bangus")) return Fish;
  if (normalized.includes("beef") || normalized.includes("tapa") || normalized.includes("sisig")) {
    return Beef;
  }
  if (normalized.includes("soup") || normalized.includes("pancit") || normalized.includes("noodle")) {
    return Soup;
  }
  if (normalized.includes("sandwich") || normalized.includes("silog")) return Sandwich;
  if (normalized.includes("chicken") || normalized.includes("meal") || normalized.includes("rice")) {
    return ChefHat;
  }
  return Utensils;
}

export function OrderComposer({
  categories,
  menuItems,
  tables,
  initialTableId,
}: {
  categories: Category[];
  menuItems: MenuItem[];
  tables: DiningTable[];
  initialTableId: string;
}) {
  const [selectedTableId, setSelectedTableId] = useState(initialTableId);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category_id === selectedCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        (item.description ?? "").toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [menuItems, query, selectedCategory]);

  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const total = orderTotalCentavos(
    cart.map((line) => ({
      unitPriceCentavos: line.unitPriceCentavos,
      quantity: line.quantity,
    })),
  );
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  function addItem(item: MenuItem) {
    if (!item.is_available) return;
    setCart((current) => {
      const existing = current.find((line) => line.menu_item_id === item.id);
      if (existing) {
        return current.map((line) =>
          line.menu_item_id === item.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...current,
        {
          menu_item_id: item.id,
          name: item.name,
          description: item.description,
          unitPriceCentavos: numericToCentavos(item.price),
          quantity: 1,
          notes: "",
        },
      ];
    });
  }

  function changeQuantity(menuItemId: string, amount: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.menu_item_id === menuItemId
            ? { ...line, quantity: line.quantity + amount }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  async function submitOrder() {
    if (!selectedTable) {
      setError("Choose an available table before sending this order.");
      return;
    }

    setPending(true);
    setError(null);
    const result = await createOrderAction({
      table_id: selectedTable.id,
      items: cart.map((line) => ({
        menu_item_id: line.menu_item_id,
        quantity: line.quantity,
        notes: line.notes,
      })),
    });

    if ("error" in result) {
      setError(
        typeof result.error === "string" ? result.error : "Unable to create the order.",
      );
      setPending(false);
      return;
    }

    setCompletedOrderId(result.orderId);
    setCart([]);
    setPending(false);
  }

  if (completedOrderId) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-10">
        <section className="w-full rounded-3xl border border-emerald-200 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
            <Check aria-hidden="true" className="size-7" />
          </div>
          <p className="text-sm font-medium text-emerald-800">Order sent to kitchen</p>
          <h1 className="mt-2 text-2xl font-semibold">Table {selectedTable?.table_number}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Order reference{" "}
            <span className="font-mono text-foreground">{completedOrderId.slice(0, 8)}</span>
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button nativeButton={false} render={<Link href="/tables" />}>
              Back to tables
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCompletedOrderId(null);
                setSelectedTableId("");
              }}
            >
              Start another order
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-muted/40">
      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Back to tables"
              nativeButton={false}
              render={<Link href="/tables" />}
            >
              <ArrowLeft aria-hidden="true" />
            </Button>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                SNC 2018 Cafe &amp; Resto
              </p>
              <h1 className="text-lg font-semibold leading-tight">New order</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="order-table" className="text-sm text-muted-foreground">
              Table
            </label>
            <select
              id="order-table"
              value={selectedTableId}
              onChange={(event) => setSelectedTableId(event.target.value)}
              className="h-10 min-w-32 rounded-lg border border-input bg-background px-3 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              disabled={tables.length === 0}
            >
              {tables.length === 0 ? <option value="">No available tables</option> : null}
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  Table {table.table_number}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-muted-foreground">Choose items for this table</p>
                <h2 className="text-2xl font-semibold tracking-tight">Menu</h2>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  aria-label="Search menu"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search menu…"
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                aria-pressed={selectedCategory === "all"}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                All items
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  aria-pressed={selectedCategory === category.id}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
                No menu items match this selection.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filteredItems.map((item, index) => {
                  const Icon = itemIcon(item.name);
                  const selected = cart.some((line) => line.menu_item_id === item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!item.is_available}
                      onClick={() => addItem(item)}
                      className="group relative overflow-hidden rounded-xl border border-border bg-background p-2 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div
                        className={`flex aspect-[1.55] items-center justify-center rounded-lg bg-gradient-to-br ${
                          THUMBNAIL_STYLES[index % THUMBNAIL_STYLES.length]
                        }`}
                      >
                        <Icon aria-hidden="true" className="size-12 stroke-[1.4] opacity-80" />
                      </div>
                      <div className="px-1 pb-1 pt-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 font-semibold">{item.name}</h3>
                          {selected ? (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                              <Check aria-hidden="true" className="size-3" />
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-2 min-h-8 text-xs text-muted-foreground">
                          {item.description || "Prepared fresh when ordered."}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-semibold text-primary">
                            {formatPhp(numericToCentavos(item.price))}
                          </span>
                          {item.is_available ? (
                            <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                              <Plus aria-hidden="true" className="size-4" />
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-destructive">Unavailable</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:sticky xl:top-4">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Current order
                </p>
                <h2 className="text-lg font-semibold">
                  {selectedTable ? `Table ${selectedTable.table_number}` : "Select a table"}
                </h2>
              </div>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Utensils aria-hidden="true" className="size-5" />
                </div>
                <p className="mt-3 font-medium">Your order is empty</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select a menu item to add it here.
                </p>
              </div>
            ) : (
              <ul className="max-h-[45vh] space-y-3 overflow-y-auto p-4">
                {cart.map((line) => {
                  const Icon = itemIcon(line.name);
                  return (
                    <li key={line.menu_item_id} className="rounded-xl border border-border p-3">
                      <div className="flex gap-3">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                          <Icon aria-hidden="true" className="size-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-1 font-medium">{line.name}</p>
                            <button
                              type="button"
                              aria-label={`Remove ${line.name}`}
                              onClick={() => setCart((current) => current.filter((item) => item.menu_item_id !== line.menu_item_id))}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X aria-hidden="true" className="size-4" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-sm font-semibold text-primary">
                            {formatPhp(line.unitPriceCentavos * line.quantity)}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label={`Decrease ${line.name} quantity`}
                              onClick={() => changeQuantity(line.menu_item_id, -1)}
                            >
                              −
                            </Button>
                            <span className="min-w-5 text-center text-sm font-medium">
                              {line.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label={`Increase ${line.name} quantity`}
                              onClick={() => changeQuantity(line.menu_item_id, 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                          Add kitchen note
                        </summary>
                        <Textarea
                          className="mt-2 min-h-16 text-sm"
                          aria-label={`Kitchen note for ${line.name}`}
                          placeholder="E.g. no onions, less sugar"
                          value={line.notes}
                          onChange={(event) =>
                            setCart((current) =>
                              current.map((item) =>
                                item.menu_item_id === line.menu_item_id
                                  ? { ...item, notes: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        />
                      </details>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="space-y-3 border-t border-border bg-muted/30 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPhp(total)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPhp(total)}</span>
              </div>
              {error ? (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <Button
                type="button"
                className="h-11 w-full"
                disabled={pending || cart.length === 0 || !selectedTable}
                onClick={submitOrder}
              >
                {pending ? "Sending order…" : "Send order to kitchen"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Final prices are verified when the order is submitted.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
