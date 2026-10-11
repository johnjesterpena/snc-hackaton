"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrderAction } from "@/lib/actions/orders";
import { formatPhp, numericToCentavos, orderTotalCentavos } from "@/lib/business/money";
import type { MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CartLine = {
  menu_item_id: string;
  name: string;
  unitPriceCentavos: number;
  quantity: number;
  notes: string;
  available: boolean;
};

export function OrderComposer({
  tableId,
  tableNumber,
  menuItems,
}: {
  tableId: string;
  tableNumber: string;
  menuItems: MenuItem[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menuItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [menuItems, query]);

  const total = orderTotalCentavos(
    cart.map((line) => ({ unitPriceCentavos: line.unitPriceCentavos, quantity: line.quantity })),
  );

  function addItem(item: MenuItem) {
    if (!item.is_available) return;
    setCart((current) => {
      const existing = current.find((line) => line.menu_item_id === item.id);
      if (existing) {
        return current.map((line) =>
          line.menu_item_id === item.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...current,
        {
          menu_item_id: item.id,
          name: item.name,
          unitPriceCentavos: numericToCentavos(item.price),
          quantity: 1,
          notes: "",
          available: item.is_available,
        },
      ];
    });
  }

  async function submit() {
    setPending(true);
    setError(null);
    const result = await createOrderAction({
      table_id: tableId,
      items: cart.map((line) => ({
        menu_item_id: line.menu_item_id,
        quantity: line.quantity,
        notes: line.notes,
      })),
    });
    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    router.push("/kitchen");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Menu</h2>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search dishes"
          className="h-11"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={!item.is_available}
              onClick={() => addItem(item)}
              className="rounded-xl border border-border bg-card p-4 text-left disabled:opacity-50"
            >
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <p className="mt-2 text-lg font-semibold">{formatPhp(numericToCentavos(item.price))}</p>
              {!item.is_available ? (
                <p className="text-sm text-rose-700">Unavailable</p>
              ) : null}
            </button>
          ))}
        </div>
      </section>
      <aside className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-xl font-semibold">Table {tableNumber}</h2>
        {cart.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Tap a dish to add it to this order.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {cart.map((line) => (
              <li key={line.menu_item_id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{line.name}</p>
                  <p>{formatPhp(line.unitPriceCentavos * line.quantity)}</p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      setCart((current) =>
                        current
                          .map((item) =>
                            item.menu_item_id === line.menu_item_id
                              ? { ...item, quantity: item.quantity - 1 }
                              : item,
                          )
                          .filter((item) => item.quantity > 0),
                      )
                    }
                  >
                    −
                  </Button>
                  <span className="min-w-8 text-center text-lg">{line.quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() =>
                      setCart((current) =>
                        current.map((item) =>
                          item.menu_item_id === line.menu_item_id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item,
                        ),
                      )
                    }
                  >
                    +
                  </Button>
                </div>
                <Textarea
                  className="mt-2"
                  placeholder="Notes (no onions, extra rice…)"
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
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-2xl font-semibold">Total {formatPhp(total)}</p>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        <Button className="mt-4 h-12 w-full" disabled={pending || cart.length === 0} onClick={submit}>
          {pending ? "Sending to kitchen…" : "Send order"}
        </Button>
      </aside>
    </div>
  );
}
