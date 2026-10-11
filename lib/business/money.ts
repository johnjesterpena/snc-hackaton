/** Integer centavos helpers. Never use floating-point for money. */

export function pesosToCentavos(pesos: string | number): number {
  const asString =
    typeof pesos === "number" ? pesos.toFixed(2) : pesos.trim().replace(/,/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(asString)) {
    throw new Error("Invalid peso amount");
  }
  const negative = asString.startsWith("-");
  const [whole, frac = ""] = asString.replace("-", "").split(".");
  const centavos = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  return negative ? -centavos : centavos;
}

export function centavosToPesosNumber(centavos: number): number {
  if (!Number.isInteger(centavos)) {
    throw new Error("Centavos must be an integer");
  }
  return centavos / 100;
}

export function formatPhp(centavos: number): string {
  const pesos = centavosToPesosNumber(centavos);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(pesos);
}

export function lineTotalCentavos(unitPriceCentavos: number, quantity: number): number {
  if (!Number.isInteger(unitPriceCentavos) || unitPriceCentavos < 0) {
    throw new Error("Invalid unit price");
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive integer");
  }
  return unitPriceCentavos * quantity;
}

export function orderTotalCentavos(
  items: Array<{ unitPriceCentavos: number; quantity: number }>,
): number {
  return items.reduce(
    (sum, item) => sum + lineTotalCentavos(item.unitPriceCentavos, item.quantity),
    0,
  );
}

export function changeCentavos(tenderedCentavos: number, totalCentavos: number): number {
  if (!Number.isInteger(tenderedCentavos) || tenderedCentavos < 0) {
    throw new Error("Invalid tendered amount");
  }
  if (tenderedCentavos < totalCentavos) {
    throw new Error("Cash tendered is less than the total");
  }
  return tenderedCentavos - totalCentavos;
}

export function numericToCentavos(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    throw new Error("Missing monetary value");
  }
  return pesosToCentavos(typeof value === "number" ? value.toFixed(2) : value);
}
