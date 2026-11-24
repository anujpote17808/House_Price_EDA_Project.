import React, { useState } from 'react';
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
  Cell,
} from 'recharts';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  getHeatmapColor,
  getHeatmapTextColor,
} from '../utils/formatters';

const SCATTER_AXES = [
  { key: 'grLivArea', label: 'GrLivArea (Above-Ground Living Area, sq ft)' },
  { key: 'totalBsmtSF', label: 'TotalBsmtSF (Total Basement Area, sq ft)' },
  { key: 'garageArea', label: 'GarageArea (Garage Floor Area, sq ft)' },
];

export default function CorrelationAnalysisSection({ data }) {
  const [maskUpper, setMaskUpper] = useState(true);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [scatterX, setScatterX] = useState('grLivArea');
  const [colorBy, setColorBy] = useState('outlier');

  const { top10, top3CovVsCorr, heatmapFeatures, heatmapMatrix, collinearPairs } = data.correlations;

  // Split scatter data for clear legend & styling
  const normalPts = data.scatterData.filter((d) => d.category !== 'unusual_low_price');
  const unusualPts = data.scatterData.filter((d) => d.category === 'unusual_low_price');

  const qualLow = data.scatterData.filter((d) => d.overallQual <= 4);
  const qualMid = data.scatterData.filter((d) => d.overallQual >= 5 && d.overallQual <= 7);
  const qualHigh = data.scatterData.filter((d) => d.overallQual >= 8);

  const activeAxisLabel = SCATTER_AXES.find((a) => a.key === scatterX)?.label || scatterX;

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Correlation, Covariance &amp; Bivariate Relationships</h2>
          <p className="section-subtitle">
            Linear associations with SalePrice, 11×11 correlation heatmap, scatter plots, and multicollinearity checks.
          </p>
        </div>
      </div>

      {/* Top 10 Correlated Features + Scatter Plot */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Top 10 Features Correlated with SalePrice</h3>
              <p className="card-subtitle">Pearson correlation coefficient (r) sorted descending</p>
            </div>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={top10}
                layout="vertical"
                margin={{ top: 6, right: 24, left: 10, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 1]}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{ value: 'Pearson Correlation (r)', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#334155' }}
                />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 11.5, fill: '#334155' }} width={96} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-title">{row.feature} vs SalePrice</div>
                        <div className="tooltip-row"><span>Pearson r:</span><strong>{row.pearson.toFixed(4)}</strong></div>
                        <div className="tooltip-row"><span>Spearman ρ:</span><strong>{row.spearman.toFixed(4)}</strong></div>
                        <div className="tooltip-row"><span>Covariance:</span><strong>{formatNumber(row.covariance, 0)}</strong></div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="pearson" name="Pearson r" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GrLivArea vs SalePrice Scatter */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Scatter Plot: {scatterX === 'grLivArea' ? 'GrLivArea' : scatterX === 'totalBsmtSF' ? 'TotalBsmtSF' : 'GarageArea'} vs SalePrice</h3>
              <p className="card-subtitle">All 1,460 houses — hover any point to inspect property details</p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <select
                className="select-input"
                value={scatterX}
                onChange={(e) => setScatterX(e.target.value)}
                aria-label="Select X-axis feature"
              >
                <option value="grLivArea">X: GrLivArea</option>
                <option value="totalBsmtSF">X: TotalBsmtSF</option>
                <option value="garageArea">X: GarageArea</option>
              </select>
              <div className="btn-group">
                <button
                  type="button"
                  className={`btn-tab ${colorBy === 'outlier' ? 'active' : ''}`}
                  onClick={() => setColorBy('outlier')}
                >
                  Unusual Sales
                </button>
                <button
                  type="button"
                  className={`btn-tab ${colorBy === 'quality' ? 'active' : ''}`}
                  onClick={() => setColorBy('quality')}
                >
                  By Quality
                </button>
              </div>
            </div>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 16, left: 6, bottom: 14 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  dataKey={scatterX}
                  name={scatterX}
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{ value: activeAxisLabel, position: 'insideBottom', offset: -8, fontSize: 11, fill: '#334155' }}
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
                        <div className="tooltip-row"><span>TotalBsmtSF:</span><strong>{formatNumber(d.totalBsmtSF)} sq ft</strong></div>
                        <div className="tooltip-row"><span>GarageArea:</span><strong>{formatNumber(d.garageArea)} sq ft</strong></div>
                        <div className="tooltip-row"><span>OverallQual:</span><strong>{d.overallQual} / 10</strong></div>
                      </div>
                    );
                  }}
                />
                {colorBy === 'outlier' ? (
                  <>
                    <Scatter name="Standard Sales" data={normalPts} fill="#3b82f6" fillOpacity={0.5} />
                    <Scatter name="Unusual Large/Low-Price" data={unusualPts} fill="#dc2626">
                      {unusualPts.map((pt) => (
                        <Cell key={pt.id} fill="#dc2626" />
                      ))}
                    </Scatter>
                  </>
                ) : (
                  <>
                    <Scatter name="Low Quality (1–4)" data={qualLow} fill="#94a3b8" fillOpacity={0.65} />
                    <Scatter name="Mid Quality (5–7)" data={qualMid} fill="#3b82f6" fillOpacity={0.55} />
                    <Scatter name="High Quality (8–10)" data={qualHigh} fill="#1e3a8a" fillOpacity={0.75} />
                  </>
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend-bar">
            {colorBy === 'outlier' ? (
              <>
                <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#3b82f6' }} />Standard Sales (1,458)</span>
                <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#dc2626' }} />GrLivArea &gt; 4,000 &amp; Low Price (2 unusual sales)</span>
              </>
            ) : (
              <>
                <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#94a3b8' }} />OverallQual 1–4</span>
                <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#3b82f6' }} />OverallQual 5–7</span>
                <span className="legend-item"><span className="legend-dot" style={{ backgroundColor: '#1e3a8a' }} />OverallQual 8–10</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 11x11 Correlation Heatmap */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Correlation Heatmap — SalePrice &amp; Top 10 Features</h3>
            <p className="card-subtitle">
              Pairwise Pearson correlation matrix (hover any cell to inspect exact relationship)
            </p>
          </div>
          <div className="btn-group">
            <button
              type="button"
              className={`btn-tab ${maskUpper ? 'active' : ''}`}
              onClick={() => setMaskUpper(true)}
            >
              Lower Triangle (Masked)
            </button>
            <button
              type="button"
              className={`btn-tab ${!maskUpper ? 'active' : ''}`}
              onClick={() => setMaskUpper(false)}
            >
              Full Matrix
            </button>
          </div>
        </div>

        <div className="heatmap-wrap">
          <table className="heatmap-table" aria-label="Correlation matrix heatmap">
            <thead>
              <tr>
                <th className="row-label">Feature</th>
                {heatmapFeatures.map((feat) => (
                  <th key={feat}>{feat}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapMatrix.map((row, rIdx) => (
                <tr key={row.feature}>
                  <th className="row-label mono">{row.feature}</th>
                  {row.values.map((val, cIdx) => {
                    const isMasked = maskUpper && cIdx > rIdx;
                    if (isMasked) {
                      return <td key={cIdx} className="heatmap-cell masked">—</td>;
                    }
                    return (
                      <td
                        key={cIdx}
                        className="heatmap-cell mono"
                        style={{
                          backgroundColor: getHeatmapColor(val),
                          color: getHeatmapTextColor(val),
                        }}
                        onMouseEnter={() =>
                          setHoveredCell({
                            a: row.feature,
                            b: heatmapFeatures[cIdx],
                            value: val,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="heatmap-hover-bar">
          {hoveredCell ? (
            <span>
              <strong>{hoveredCell.a}</strong> vs <strong>{hoveredCell.b}</strong>: Pearson{' '}
              <strong className="mono">r = {hoveredCell.value.toFixed(2)}</strong>
            </span>
          ) : (
            <span>Hover over any cell in the heatmap to inspect the pairwise correlation between two features.</span>
          )}
        </div>
      </div>

      {/* Covariance vs Correlation & Multicollinearity */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Covariance vs Correlation (Top 3 Features)</h3>
              <p className="card-subtitle">Why correlation is easier to interpret than covariance (PDF Step 5)</p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="text-right">Covariance with SalePrice</th>
                  <th className="text-right">Pearson r</th>
                  <th className="text-right">Spearman ρ</th>
                </tr>
              </thead>
              <tbody>
                {top3CovVsCorr.map((item) => (
                  <tr key={item.feature}>
                    <td className="mono"><strong>{item.feature}</strong></td>
                    <td className="text-right mono">{formatNumber(item.covariance, 2)}</td>
                    <td className="text-right mono"><strong>{item.pearson.toFixed(4)}</strong></td>
                    <td className="text-right mono">{item.spearman.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="note-box">
            <strong>Why Correlation Beats Covariance for Comparison:</strong> Notice that <code>GrLivArea</code> has a much larger raw covariance (29.58M) than <code>OverallQual</code> (86.9k) only because square footage has a larger numerical scale than a 1–10 rating. Correlation standardizes both to a unit-free <code>[-1, +1]</code> scale, revealing that <code>OverallQual</code> (r = 0.79) is actually more strongly correlated with price than <code>GrLivArea</code> (r = 0.71).
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Correlated Feature Pairs (Multicollinearity)</h3>
              <p className="card-subtitle">Correlation does not imply causation — pairs measuring overlapping traits</p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature Pair</th>
                  <th className="text-right">Pearson r</th>
                  <th>Why It Matters</th>
                </tr>
              </thead>
              <tbody>
                {collinearPairs.map((pair) => (
                  <tr key={`${pair.featureA}-${pair.featureB}`}>
                    <td className="mono">
                      <strong>{pair.featureA}</strong> &amp; <strong>{pair.featureB}</strong>
                    </td>
                    <td className="text-right mono">
                      <span className="badge badge-blue">{pair.correlation.toFixed(2)}</span>
                    </td>
                    <td>{pair.explanation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
