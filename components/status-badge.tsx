import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type OrderStatus } from "@/lib/business/status";
import { cn } from "@/lib/utils";

const TONE: Record<OrderStatus, string> = {
  open: "bg-amber-100 text-amber-950 border-amber-300",
  preparing: "bg-orange-100 text-orange-950 border-orange-300",
  ready: "bg-emerald-100 text-emerald-950 border-emerald-300",
  served: "bg-sky-100 text-sky-950 border-sky-300",
  completed: "bg-stone-200 text-stone-800 border-stone-300",
  cancelled: "bg-rose-100 text-rose-950 border-rose-300",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", TONE[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
