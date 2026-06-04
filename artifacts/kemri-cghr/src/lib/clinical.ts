export function calculateBmi(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  if (heightM <= 0) return null;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function isBmiAbnormal(bmi?: number | null): boolean {
  if (!bmi) return false;
  return bmi < 15 || bmi > 45;
}
