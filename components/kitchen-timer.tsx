"use client";

import { useEffect, useState } from "react";
import { elapsedMs, formatElapsed, isOverdue } from "@/lib/business/overdue";
import { cn } from "@/lib/utils";

export function KitchenTimer({
  startedAt,
  estimatedMinutes,
}: {
  startedAt: string | null;
  estimatedMinutes: number;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!startedAt) {
    return <p className="text-sm text-muted-foreground">Timer starts when prep begins</p>;
  }

  const overdue = isOverdue({
    preparationStartedAt: startedAt,
    estimatedMinutes,
    now,
  });

  return (
    <p className={cn("text-2xl font-semibold tabular-nums", overdue && "text-rose-700")}>
      {formatElapsed(elapsedMs(startedAt, now))}
      <span className="ml-2 text-sm font-medium">
        {overdue ? `Overdue (est. ${estimatedMinutes} min)` : `Est. ${estimatedMinutes} min`}
      </span>
    </p>
  );
}
