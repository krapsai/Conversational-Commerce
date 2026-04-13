const DEFAULT_USD_TO_VND_RATE = 26_700;

function getUsdToVndRate() {
  const parsed = Number(
    process.env.NEXT_PUBLIC_USD_TO_VND_RATE ?? DEFAULT_USD_TO_VND_RATE
  );
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_USD_TO_VND_RATE;
}

export function normalizeDisplayPrice(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }

  if (value < 1000) {
    return Math.round(value * getUsdToVndRate());
  }

  return Math.round(value);
}
