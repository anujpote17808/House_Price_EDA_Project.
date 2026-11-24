import React from 'react';
import { Home, Columns3, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function KpiCards({ kpis, metadata }) {
  const items = [
    {
      label: 'Total Houses Analyzed',
      value: formatNumber(kpis.totalHouses),
      sub: `Sold ${metadata.yearSoldRange[0]}–${metadata.yearSoldRange[1]} in Ames, IA`,
      icon: Home,
    },
    {
      label: 'Total Features',
      value: formatNumber(kpis.totalFeatures),
      sub: `${metadata.numericColumnCount} numeric · ${metadata.categoricalColumnCount} categorical`,
      icon: Columns3,
    },
    {
      label: 'Average Sale Price',
      value: formatCurrency(kpis.avgSalePrice, 0),
      sub: `Exact mean: ${formatCurrency(kpis.avgSalePrice, 2)}`,
      icon: DollarSign,
    },
    {
      label: 'Median Sale Price',
      value: formatCurrency(kpis.medianSalePrice, 0),
      sub: 'Mean > Median (+$17.9k right skew)',
      icon: TrendingUp,
    },
    {
      label: 'Missing Values',
      value: formatNumber(kpis.missingValues),
      sub: `Across ${kpis.columnsWithMissing} columns (${metadata.structuralMissingPct}% absent features)`,
      icon: AlertCircle,
    },
  ];

  return (
    <div className="kpi-grid">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">{item.label}</span>
              <span className="kpi-icon" aria-hidden="true">
                <Icon size={15} />
              </span>
            </div>
            <div className="kpi-value tabular">{item.value}</div>
            <div className="kpi-sub">{item.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
