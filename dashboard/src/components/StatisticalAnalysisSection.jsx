import React, { useState } from 'react';
import {
  formatCurrency,
  formatFeatureValue,
  formatNumber,
  formatVariance,
} from '../utils/formatters';

const FEATURE_OPTIONS = [
  { key: 'SalePrice', label: 'SalePrice (USD)' },
  { key: 'GrLivArea', label: 'GrLivArea (sq ft)' },
  { key: 'LotArea', label: 'LotArea (sq ft)' },
  { key: 'TotalBsmtSF', label: 'TotalBsmtSF (sq ft)' },
  { key: 'GarageArea', label: 'GarageArea (sq ft)' },
];

export default function StatisticalAnalysisSection({ data }) {
  const [selectedFeature, setSelectedFeature] = useState('SalePrice');
  const s = data.descriptiveStats[selectedFeature];
  const logStats = data.logTransformStats;
  const spStats = data.descriptiveStats.SalePrice;

  const isPrice = selectedFeature === 'SalePrice';
  const fmt = (val, dec = 0) => formatFeatureValue(selectedFeature, val, dec);

  const metricCards = [
    {
      label: 'Mean (Average)',
      value: fmt(s.mean, isPrice ? 2 : 1),
      desc: 'Arithmetic average of all 1,460 observations. Sensitive to extreme high-value houses in the right tail.',
    },
    {
      label: 'Median (50th Percentile)',
      value: fmt(s.median, 0),
      desc: 'Middle value when all houses are sorted. More robust than the mean when data is skewed.',
    },
    {
      label: 'Mode (Most Frequent)',
      value: fmt(s.mode, 0),
      desc: 'Most commonly occurring exact value in the dataset.',
    },
    {
      label: 'Standard Deviation',
      value: fmt(s.std, isPrice ? 2 : 1),
      desc: 'Typical spread of individual values around the mean, expressed in the original units.',
    },
    {
      label: 'Variance',
      value: formatVariance(selectedFeature, s.variance),
      desc: `Average squared deviation from the mean (${isPrice ? 'USD²' : 'sq ft²'}). Square of standard deviation.`,
    },
    {
      label: 'Range (Max − Min)',
      value: fmt(s.range, 0),
      desc: `Full span from minimum (${fmt(s.min, 0)}) to maximum (${fmt(s.max, 0)}).`,
    },
    {
      label: 'Interquartile Range (IQR)',
      value: fmt(s.iqr, 0),
      desc: `Spread of the middle 50% of houses: Q3 (${fmt(s.q3, 0)}) − Q1 (${fmt(s.q1, 0)}).`,
    },
    {
      label: 'Skewness',
      value: s.skewness.toFixed(4),
      desc:
        s.skewness > 1
          ? 'Strongly right-skewed (> 1): a long upper tail of expensive or very large properties pulls the mean above the median.'
          : s.skewness > 0.5
          ? 'Moderately right-skewed: right tail is longer than left tail.'
          : 'Approximately symmetric distribution (near 0).',
    },
    {
      label: 'Excess Kurtosis',
      value: s.kurtosis.toFixed(4),
      desc:
        s.kurtosis > 3
          ? 'Leptokurtic (> 3): sharper peak and heavier tails than a normal distribution, indicating extreme outliers.'
          : 'Moderate tail heaviness compared to a normal distribution (normal = 0 in Pandas excess kurtosis).',
    },
  ];

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Statistical Analysis</h2>
          <p className="section-subtitle">
            Measures of central tendency, dispersion, and distribution shape with clear interpretations.
          </p>
        </div>

        <div className="btn-group" role="tablist" aria-label="Select feature for statistics">
          {FEATURE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className={`btn-tab ${selectedFeature === opt.key ? 'active' : ''}`}
              onClick={() => setSelectedFeature(opt.key)}
            >
              {opt.key}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Descriptive Statistics — {selectedFeature}</h3>
            <p className="card-subtitle">
              Distribution direction: <strong>{s.skewDirection}</strong> (n = {formatNumber(s.count)})
            </p>
          </div>
          <span className="badge badge-blue">
            Min: {fmt(s.min)} · Q1: {fmt(s.q1)} · Q3: {fmt(s.q3)} · Max: {fmt(s.max)}
          </span>
        </div>

        <div className="stats-grid">
          {metricCards.map((m) => (
            <div key={m.label} className="stat-card">
              <div className="stat-card-label">{m.label}</div>
              <div className="stat-card-value mono">{m.value}</div>
              <p className="stat-card-desc">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="note-box">
          <strong>What the Mean–Median Gap Tells Us (SalePrice):</strong> The average SalePrice is{' '}
          <strong>{formatCurrency(spStats.mean, 2)}</strong>, whereas the median SalePrice is{' '}
          <strong>{formatCurrency(spStats.median, 0)}</strong> — a gap of{' '}
          <strong>{formatCurrency(spStats.mean - spStats.median, 2)}</strong>. Because Mean &gt; Median,
          SalePrice is right-skewed: a smaller number of luxury homes (up to {formatCurrency(spStats.max)})
          pull the arithmetic average upward, making the median a more representative summary of a &ldquo;typical&rdquo; Ames home.
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Log Transformation Effect on SalePrice</h3>
              <p className="card-subtitle">Comparing raw SalePrice vs natural log ln(SalePrice) (PDF Step 4)</p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th className="text-right">Raw SalePrice</th>
                  <th className="text-right">Log(SalePrice)</th>
                  <th>Effect</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Skewness</strong></td>
                  <td className="text-right mono">{logStats.originalSkewness}</td>
                  <td className="text-right mono" style={{ color: '#15803d', fontWeight: 700 }}>
                    {logStats.logSkewness}
                  </td>
                  <td>Reduced from strong right-skew to near-symmetric (≈ 0)</td>
                </tr>
                <tr>
                  <td><strong>Excess Kurtosis</strong></td>
                  <td className="text-right mono">{logStats.originalKurtosis}</td>
                  <td className="text-right mono" style={{ color: '#15803d', fontWeight: 700 }}>
                    {logStats.logKurtosis}
                  </td>
                  <td>Heavy upper tail compressed dramatically</td>
                </tr>
                <tr>
                  <td><strong>Mean vs Median</strong></td>
                  <td className="text-right mono">$180.9k vs $163.0k</td>
                  <td className="text-right mono">{logStats.logMean} vs {logStats.logMedian}</td>
                  <td>Mean and median become nearly identical</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Summary Across All 5 Key Numeric Features</h3>
              <p className="card-subtitle">Side-by-side comparison of centre, spread, and skewness</p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="text-right">Mean</th>
                  <th className="text-right">Median</th>
                  <th className="text-right">Std Dev</th>
                  <th className="text-right">IQR</th>
                  <th className="text-right">Skew</th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_OPTIONS.map(({ key }) => {
                  const row = data.descriptiveStats[key];
                  return (
                    <tr key={key}>
                      <td className="mono"><strong>{key}</strong></td>
                      <td className="text-right tabular">
                        {key === 'SalePrice' ? formatCurrency(row.mean, 0) : formatNumber(row.mean, 0)}
                      </td>
                      <td className="text-right tabular">
                        {key === 'SalePrice' ? formatCurrency(row.median, 0) : formatNumber(row.median, 0)}
                      </td>
                      <td className="text-right tabular">
                        {key === 'SalePrice' ? formatCurrency(row.std, 0) : formatNumber(row.std, 0)}
                      </td>
                      <td className="text-right tabular">
                        {key === 'SalePrice' ? formatCurrency(row.iqr, 0) : formatNumber(row.iqr, 0)}
                      </td>
                      <td className="text-right mono">{row.skewness.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
