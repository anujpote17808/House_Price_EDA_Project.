import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatFeatureValue,
  formatNumber,
} from '../utils/formatters';

export default function OutlierDetectionSection({ data }) {
  const { comparison, unusualSales, corrWithUnusual2, corrWithoutUnusual2 } = data.outliers;

  const normalPts = data.scatterData.filter((d) => d.category === 'normal');
  const iqrOnlyPts = data.scatterData.filter((d) => d.category === 'iqr_only');
  const bothPts = data.scatterData.filter((d) => d.category === 'both_iqr_z' || d.category === 'z_only');
  const unusualLowPts = data.scatterData.filter((d) => d.category === 'unusual_low_price');

  const grIqrUpper = comparison.find((c) => c.feature === 'GrLivArea')?.iqrUpper;
  const spIqrUpper = comparison.find((c) => c.feature === 'SalePrice')?.iqrUpper;

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Outlier Detection — IQR vs Z-Score Comparison</h2>
          <p className="section-subtitle">
            Comparing the Interquartile Range (1.5×IQR) and Z-score (|z| &gt; 3) rules across key numerical features.
          </p>
        </div>
      </div>

      {/* Grouped Comparison Bar Chart + Scatter Plot */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Outliers Flagged: IQR Rule vs Z-Score (|z| &gt; 3)</h3>
              <p className="card-subtitle">Every Z-score outlier is also captured within the IQR outlier set (100% overlap)</p>
            </div>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="feature" tick={{ fontSize: 11, fill: '#334155' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{ value: 'Outlier Count', angle: -90, position: 'insideLeft', fontSize: 11.5, fill: '#334155' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-title">{row.feature} Outliers</div>
                        <div className="tooltip-row"><span>IQR Method (1.5×IQR):</span><strong>{row.iqrCount} ({row.iqrPct}%)</strong></div>
                        <div className="tooltip-row"><span>Z-Score Method (|z| &gt; 3):</span><strong>{row.zCount} ({row.zPct}%)</strong></div>
                        <div className="tooltip-row"><span>Overlap (Flagged by Both):</span><strong>{row.overlapCount}</strong></div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="iqrCount" name="IQR Outliers (1.5×IQR)" fill="#2563eb" radius={[3, 3, 0, 0]} />
                <Bar dataKey="zCount" name="Z-Score Outliers (|z| > 3)" fill="#d97706" radius={[3, 3, 0, 0]} />
                <Bar dataKey="overlapCount" name="Overlap (Both)" fill="#0f766e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">GrLivArea vs SalePrice — Flagged Outliers</h3>
              <p className="card-subtitle">
                Dashed lines mark IQR upper fences ({formatNumber(grIqrUpper, 0)} sq ft &amp; {formatCurrency(spIqrUpper, 0)})
              </p>
            </div>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 16, left: 6, bottom: 14 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey="grLivArea"
                  name="GrLivArea"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{ value: 'GrLivArea (sq ft)', position: 'insideBottom', offset: -8, fontSize: 11, fill: '#334155' }}
                />
                <YAxis
                  type="number"
                  dataKey="salePrice"
                  name="SalePrice"
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
                        <div className="tooltip-row"><span>YearBuilt:</span><strong>{d.yearBuilt}</strong></div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine x={grIqrUpper} stroke="#64748b" strokeDasharray="4 4" />
                <ReferenceLine y={spIqrUpper} stroke="#64748b" strokeDasharray="4 4" />
                <Scatter name="Normal" data={normalPts} fill="#93c5fd" fillOpacity={0.5} />
                <Scatter name="IQR Only" data={iqrOnlyPts} fill="#2563eb" fillOpacity={0.8} />
                <Scatter name="IQR + Z-Score" data={bothPts} fill="#d97706" fillOpacity={0.9} />
                <Scatter name="Unusual Large/Low-Price" data={unusualLowPts} fill="#dc2626" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend-bar">
            <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#93c5fd' }} />Normal ({normalPts.length})</span>
            <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#2563eb' }} />IQR Only ({iqrOnlyPts.length})</span>
            <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#d97706' }} />IQR + Z-Score ({bothPts.length})</span>
            <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#dc2626' }} />Large &gt; 4,000 sq ft, Low Price ({unusualLowPts.length})</span>
          </div>
        </div>
      </div>

      {/* Exact Comparison Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">IQR vs Z-Score Thresholds &amp; Overlap Summary</h3>
            <p className="card-subtitle">Computed directly from all 1,460 records in train.csv</p>
          </div>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th className="text-right">IQR Lower Fence</th>
                <th className="text-right">IQR Upper Fence</th>
                <th className="text-right">IQR Outliers</th>
                <th className="text-right">Z-Score Upper (+3σ)</th>
                <th className="text-right">Z-Score Outliers</th>
                <th className="text-right">Overlap</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature}>
                  <td className="mono"><strong>{row.feature}</strong></td>
                  <td className="text-right mono">{formatFeatureValue(row.feature, row.iqrLower)}</td>
                  <td className="text-right mono">{formatFeatureValue(row.feature, row.iqrUpper)}</td>
                  <td className="text-right tabular">
                    <span className="badge badge-blue">{row.iqrCount} ({row.iqrPct}%)</span>
                  </td>
                  <td className="text-right mono">{formatFeatureValue(row.feature, row.zUpper)}</td>
                  <td className="text-right tabular">
                    <span className="badge badge-amber">{row.zCount} ({row.zPct}%)</span>
                  </td>
                  <td className="text-right tabular">
                    <span className="badge badge-teal">{row.overlapCount}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="note-box amber">
          <strong>Why Z-Score Flags Fewer Points Than IQR on Skewed Data (Viva Answer):</strong> On a right-skewed variable like <code>SalePrice</code> (skewness = 1.88) or <code>LotArea</code>, extreme upper-tail values inflate both the <strong>mean</strong> and the <strong>standard deviation (σ)</strong>. Because the Z-score threshold is <code>Mean + 3σ</code>, this inflated spread pushes the cutoff far to the right ($419,249 for SalePrice vs $340,038 for IQR), masking moderate outliers. By contrast, IQR uses quartiles (Q1, Q3), which are resistant to extreme values and therefore detect upper-tail outliers more reliably.
        </div>
      </div>

      {/* Unusual Sales Inspection Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Inspection of Extreme &amp; Unusual House Sales</h3>
            <p className="card-subtitle">
              Properties with GrLivArea &gt; 4,000 sq ft or SalePrice &gt; $600,000 — distinguishing non-typical partial sales from genuine luxury homes
            </p>
          </div>
          <span className="badge badge-red">
            GrLivArea–SalePrice r: {corrWithUnusual2} → {corrWithoutUnusual2} without 2 unusual sales
          </span>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>House ID</th>
                <th>Neighborhood</th>
                <th className="text-right">GrLivArea</th>
                <th className="text-right">SalePrice</th>
                <th className="text-right">OverallQual</th>
                <th>SaleCondition</th>
                <th>Classification</th>
              </tr>
            </thead>
            <tbody>
              {unusualSales.map((u) => (
                <tr key={u.id}>
                  <td className="mono"><strong>#{u.id}</strong></td>
                  <td>{u.neighborhoodName} (<span className="mono">{u.neighborhood}</span>)</td>
                  <td className="text-right mono">{formatNumber(u.grLivArea)} sq ft</td>
                  <td className="text-right mono"><strong>{formatCurrency(u.salePrice)}</strong></td>
                  <td className="text-right tabular">{u.overallQual} / 10</td>
                  <td className="mono">{u.saleCondition}</td>
                  <td>
                    <span className={u.flaggedType.startsWith('Unusual') ? 'badge badge-red' : 'badge badge-slate'}>
                      {u.flaggedType}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="note-box">
          <strong>Analytical Decision (Keep vs Remove):</strong> Houses <strong>#1299</strong> (5,642 sq ft sold for $160,000) and <strong>#524</strong> (4,676 sq ft sold for $184,750) were both <code>Partial</code> sales in Edwards with OverallQual = 10 yet unusually low prices. They distort linear trendlines (removing just these 2 rows increases the GrLivArea–SalePrice correlation from <strong>{corrWithUnusual2}</strong> to <strong>{corrWithoutUnusual2}</strong>). Conversely, the high-priced luxury estates ($625k–$755k in NoRidge) are legitimate market transactions and should be retained to reflect true upper-market variance.
        </div>
      </div>
    </>
  );
}
