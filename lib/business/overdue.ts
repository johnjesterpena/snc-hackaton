export const DEFAULT_ESTIMATED_PREP_MINUTES = 15;

export function estimatedPrepMinutes(
  itemEstimates: Array<number | null | undefined>,
): number {
  const values = itemEstimates.filter(
    (value): value is number => typeof value === "number" && value > 0,
  );
  if (values.length === 0) return DEFAULT_ESTIMATED_PREP_MINUTES;
  return Math.max(...values);
}

export function elapsedMs(startedAt: string | Date | null, now: Date = new Date()): number {
  if (!startedAt) return 0;
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
  return Math.max(0, now.getTime() - start.getTime());
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function isOverdue(params: {
  preparationStartedAt: string | Date | null;
  estimatedMinutes: number;
  now?: Date;
}): boolean {
  if (!params.preparationStartedAt) return false;
  const limitMs = params.estimatedMinutes * 60 * 1000;
  return elapsedMs(params.preparationStartedAt, params.now ?? new Date()) > limitMs;
}

export function prepDurationMs(
  startedAt: string | Date | null,
  readyAt: string | Date | null,
): number | null {
  if (!startedAt || !readyAt) return null;
  return elapsedMs(startedAt, typeof readyAt === "string" ? new Date(readyAt) : readyAt);
}
