export function formatCurrency(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrencyCompact(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

export function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatFeatureValue(feature, value, decimals = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (feature === 'SalePrice') return formatCurrency(value, decimals);
  return `${formatNumber(value, decimals)} sq ft`;
}

export function formatVariance(feature, value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return formatNumber(value, 1);
}

export function getHeatmapColor(val) {
  // Diverging blue (-1) -> white (0) -> warm red (+1) similar to Seaborn coolwarm
  const clamped = Math.max(-1, Math.min(1, val));
  if (clamped >= 0) {
    // white (255,255,255) -> deep blue (29, 78, 216) for clean academic blue palette
    // or classic coolwarm: positive = blue (#1d4ed8), negative = warm rust (#b91c1c)
    const t = clamped;
    const r = Math.round(248 - t * (248 - 29));
    const g = Math.round(250 - t * (250 - 78));
    const b = Math.round(252 - t * (252 - 216));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = Math.abs(clamped);
    const r = Math.round(248 - t * (248 - 185));
    const g = Math.round(250 - t * (250 - 28));
    const b = Math.round(252 - t * (252 - 28));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export function getHeatmapTextColor(val) {
  return Math.abs(val) >= 0.55 ? '#ffffff' : '#0f172a';
}
