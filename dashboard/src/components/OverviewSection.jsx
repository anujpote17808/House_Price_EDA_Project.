import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  LineChart,
  ScatterChart,
  Bar,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import KpiCards from './KpiCards';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '../utils/formatters';

export default function OverviewSection({ data, onNavigate }) {
  const top10Nb = data.neighborhoods.slice(0, 10);
  const histData = data.distributions.salePriceHistogram;
  const spStats = data.descriptiveStats.SalePrice;

  // Compact subset for overview scatter split by normal vs unusual
  const normalPts = data.scatterData.filter((d) => d.category !== 'unusual_low_price');
  const unusualPts = data.scatterData.filter((d) => d.category === 'unusual_low_price');

  const meanBin = histData.find(
    (b) => spStats.mean >= b.binStart && spStats.mean <= b.binEnd
  );
  const medianBin = histData.find(
    (b) => spStats.median >= b.binStart && spStats.median <= b.binEnd
  );

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Executive Overview</h2>
          <p className="section-subtitle">
            Summary of the Ames Housing Dataset exploratory analysis — key metrics and the 4-panel EDA summary.
          </p>
        </div>
      </div>

      <KpiCards kpis={data.kpis} metadata={data.metadata} />

      <div className="grid-2">
        {/* Panel 1: YearBuilt vs Avg SalePrice */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Average Sale Price by Year Built</h3>
              <p className="card-subtitle">Historical construction trend ({data.metadata.yearBuiltRange[0]}–{data.metadata.yearBuiltRange[1]})</p>
            </div>
            <button type="button" className="btn-tab" onClick={() => onNavigate('neighborhood')}>
              View Full Trend
            </button>
          </div>
          <div className="chart-wrap short">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.yearBuiltTrend.byDecade} margin={{ top: 8, right: 16, left: 6, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="decade" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis tickFormatter={formatCurrencyCompact} tick={{ fontSize: 11, fill: '#475569' }} width={58} />
                <Tooltip
                  formatter={(v, name) => [formatCurrency(v), name]}
                  contentStyle={{ borderColor: '#cbd5e1', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="avgPrice"
                  name="Average Price"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#1d4ed8' }}
                />
                <Line
                  type="monotone"
                  dataKey="medianPrice"
                  name="Median Price"
                  stroke="#0f766e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#0f766e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 2: Top 10 Neighborhoods */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Top 10 Neighborhoods by Average Price</h3>
              <p className="card-subtitle">Highest-priced residential areas in Ames</p>
            </div>
            <button type="button" className="btn-tab" onClick={() => onNavigate('neighborhood')}>
              All 25 Areas
            </button>
          </div>
          <div className="chart-wrap short">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top10Nb}
                layout="vertical"
                margin={{ top: 4, right: 18, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tickFormatter={formatCurrencyCompact} tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis type="category" dataKey="code" tick={{ fontSize: 11, fill: '#334155' }} width={64} />
                <Tooltip
                  formatter={(v) => [formatCurrency(v), 'Average Price']}
                  labelFormatter={(label) => {
                    const nb = top10Nb.find((n) => n.code === label);
                    return nb ? `${nb.name} (${nb.code}) — ${nb.count} houses` : label;
                  }}
                  contentStyle={{ borderColor: '#cbd5e1', fontSize: 12 }}
                />
                <Bar dataKey="avgPrice" fill="#2563eb" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 3: SalePrice Histogram with Mean & Median */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">SalePrice Distribution (Histogram &amp; KDE)</h3>
              <p className="card-subtitle">Right-skewed distribution (Skewness = {spStats.skewness})</p>
            </div>
            <button type="button" className="btn-tab" onClick={() => onNavigate('distribution')}>
              Inspect Distribution
            </button>
          </div>
          <div className="chart-wrap short">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={histData} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="shortLabel" tick={{ fontSize: 10, fill: '#475569' }} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} width={40} />
                <Tooltip
                  formatter={(v, name) => [name === 'KDE Curve' ? Number(v).toFixed(1) : formatNumber(v), name]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.label || ''}
                  contentStyle={{ borderColor: '#cbd5e1', fontSize: 12 }}
                />
                <Bar dataKey="count" name="House Count" fill="#93c5fd" stroke="#3b82f6" />
                <Line type="monotone" dataKey="kde" name="KDE Curve" stroke="#1e3a8a" strokeWidth={2} dot={false} />
                {medianBin && (
                  <ReferenceLine x={medianBin.shortLabel} stroke="#0f766e" strokeDasharray="4 4" strokeWidth={2} />
                )}
                {meanBin && (
                  <ReferenceLine x={meanBin.shortLabel} stroke="#b91c1c" strokeDasharray="4 4" strokeWidth={2} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend-bar">
            <span className="legend-item">
              <span className="legend-swatch" style={{ backgroundColor: '#0f766e' }} />
              Median: {formatCurrency(spStats.median)}
            </span>
            <span className="legend-item">
              <span className="legend-swatch" style={{ backgroundColor: '#b91c1c' }} />
              Mean: {formatCurrency(spStats.mean)}
            </span>
          </div>
        </div>

        {/* Panel 4: GrLivArea vs SalePrice Scatter */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Living Area (GrLivArea) vs SalePrice</h3>
              <p className="card-subtitle">Strong linear relationship (r = {data.outliers.corrWithUnusual2}) with 2 unusual low-price sales</p>
            </div>
            <button type="button" className="btn-tab" onClick={() => onNavigate('outliers')}>
              Inspect Outliers
            </button>
          </div>
          <div className="chart-wrap short">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 16, left: 6, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="grLivArea"
                  name="Living Area"
                  unit=" sq ft"
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <YAxis
                  type="number"
                  dataKey="salePrice"
                  name="Sale Price"
                  tickFormatter={formatCurrencyCompact}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  width={56}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-title">House #{d.id} ({d.neighborhood})</div>
                        <div className="tooltip-row"><span>SalePrice:</span><strong>{formatCurrency(d.salePrice)}</strong></div>
                        <div className="tooltip-row"><span>GrLivArea:</span><strong>{formatNumber(d.grLivArea)} sq ft</strong></div>
                        <div className="tooltip-row"><span>OverallQual:</span><strong>{d.overallQual} / 10</strong></div>
                      </div>
                    );
                  }}
                />
                <Scatter name="Standard Sales" data={normalPts} fill="#3b82f6" fillOpacity={0.55} />
                <Scatter name="Unusual Large/Low-Price" data={unusualPts} fill="#dc2626">
                  {unusualPts.map((entry) => (
                    <Cell key={entry.id} fill="#dc2626" />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend-bar">
            <span className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#3b82f6' }} />
              Standard Houses (1,458)
            </span>
            <span className="legend-item">
              <span className="legend-dot" style={{ backgroundColor: '#dc2626' }} />
              Large Area &gt; 4,000 sq ft, Low Price (2)
            </span>
          </div>
        </div>
      </div>

      <div className="note-box">
        <strong>Project Scope Note:</strong> This dashboard presents the verified outputs of an Exploratory Data Analysis (EDA) workflow on the Ames Housing Dataset (<code>train.csv</code>). All values are computed directly from the dataset using Python (Pandas, NumPy, SciPy). No machine learning or house price prediction models are used.
      </div>
    </>
  );
}
