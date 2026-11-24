import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  ScatterChart,
  Bar,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Customized,
} from 'recharts';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatFeatureValue,
  formatNumber,
} from '../utils/formatters';

function BoxplotOverlay({ xAxisMap, yAxisMap, boxStats }) {
  if (!xAxisMap || !yAxisMap || !boxStats) return null;
  const xAxis = Object.values(xAxisMap)[0];
  const yAxis = Object.values(yAxisMap)[0];
  if (!xAxis?.scale || !yAxis?.scale) return null;

  const xScale = xAxis.scale;
  const centerY = typeof yAxis.scale === 'function' ? yAxis.scale(1) : yAxis.y + yAxis.height / 2;
  const boxHeight = 52;

  const xWhiskerLow = xScale(boxStats.whiskerLow);
  const xQ1 = xScale(boxStats.q1);
  const xMedian = xScale(boxStats.median);
  const xMean = xScale(boxStats.mean);
  const xQ3 = xScale(boxStats.q3);
  const xWhiskerHigh = xScale(boxStats.whiskerHigh);

  return (
    <g>
      {/* Whisker horizontal lines */}
      <line
        x1={xWhiskerLow}
        y1={centerY}
        x2={xQ1}
        y2={centerY}
        stroke="#1e3a8a"
        strokeWidth={2}
      />
      <line
        x1={xQ3}
        y1={centerY}
        x2={xWhiskerHigh}
        y2={centerY}
        stroke="#1e3a8a"
        strokeWidth={2}
      />
      {/* Whisker end caps */}
      <line
        x1={xWhiskerLow}
        y1={centerY - 14}
        x2={xWhiskerLow}
        y2={centerY + 14}
        stroke="#1e3a8a"
        strokeWidth={2}
      />
      <line
        x1={xWhiskerHigh}
        y1={centerY - 14}
        x2={xWhiskerHigh}
        y2={centerY + 14}
        stroke="#1e3a8a"
        strokeWidth={2}
      />
      {/* IQR Box */}
      <rect
        x={xQ1}
        y={centerY - boxHeight / 2}
        width={Math.max(2, xQ3 - xQ1)}
        height={boxHeight}
        fill="#dbeafe"
        stroke="#1d4ed8"
        strokeWidth={2}
        rx={3}
      />
      {/* Median Line */}
      <line
        x1={xMedian}
        y1={centerY - boxHeight / 2}
        x2={xMedian}
        y2={centerY + boxHeight / 2}
        stroke="#0f766e"
        strokeWidth={3}
      />
      {/* Mean Diamond */}
      <polygon
        points={`${xMean},${centerY - 7} ${xMean + 6},${centerY} ${xMean},${centerY + 7} ${xMean - 6},${centerY}`}
        fill="#b91c1c"
        stroke="#ffffff"
        strokeWidth={1}
      />
    </g>
  );
}

export default function PriceDistributionSection({ data }) {
  const [histMode, setHistMode] = useState('raw');
  const [boxFeature, setBoxFeature] = useState('SalePrice');

  const histData =
    histMode === 'raw'
      ? data.distributions.salePriceHistogram
      : data.distributions.logSalePriceHistogram;

  const spStats = data.descriptiveStats.SalePrice;
  const logStats = data.logTransformStats;
  const box = data.distributions.boxplots[boxFeature];

  const outlierScatter = box.outliers.map((val, idx) => ({
    value: val,
    y: 1,
    rank: idx + 1,
  }));

  const meanVal = histMode === 'raw' ? spStats.mean : logStats.logMean;
  const medianVal = histMode === 'raw' ? spStats.median : logStats.logMedian;
  const meanBin = histData.find((b) => meanVal >= b.binStart && meanVal <= b.binEnd);
  const medianBin = histData.find((b) => medianVal >= b.binStart && medianVal <= b.binEnd);

  const fmtBox = (v) =>
    boxFeature === 'SalePrice' ? formatCurrencyCompact(v) : formatNumber(v, 0);

  // OverallQual chart with stacked base + IQR band
  const qualChartData = data.distributions.overallQual.map((q) => ({
    ...q,
    iqrBase: q.q1,
    iqrHeight: Math.max(0, q.q3 - q.q1),
  }));

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Price Distribution &amp; Structural Profiles</h2>
          <p className="section-subtitle">
            SalePrice histogram with KDE overlay, boxplot quartiles &amp; outliers, OverallQual progression, and HouseStyle distribution.
          </p>
        </div>
      </div>

      {/* 1. SalePrice Histogram + Log Toggle */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              {histMode === 'raw'
                ? '1. SalePrice Distribution — Histogram with KDE Overlay'
                : '1. Log-Transformed SalePrice — ln(SalePrice) Distribution'}
            </h3>
            <p className="card-subtitle">
              {histMode === 'raw'
                ? `Skewness = ${logStats.originalSkewness} (right-skewed), Kurtosis = ${logStats.originalKurtosis}`
                : `Skewness = ${logStats.logSkewness} (near-normal), Kurtosis = ${logStats.logKurtosis}`}
            </p>
          </div>
          <div className="btn-group">
            <button
              type="button"
              className={`btn-tab ${histMode === 'raw' ? 'active' : ''}`}
              onClick={() => setHistMode('raw')}
            >
              Raw SalePrice
            </button>
            <button
              type="button"
              className={`btn-tab ${histMode === 'log' ? 'active' : ''}`}
              onClick={() => setHistMode('log')}
            >
              Log(SalePrice)
            </button>
          </div>
        </div>

        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={histData} margin={{ top: 12, right: 20, left: 4, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 11, fill: '#475569' }}
                interval={2}
                label={{
                  value: histMode === 'raw' ? 'SalePrice (USD)' : 'ln(SalePrice)',
                  position: 'insideBottom',
                  offset: -6,
                  fontSize: 12,
                  fill: '#334155',
                }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#475569' }}
                label={{
                  value: 'House Count',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 12,
                  fill: '#334155',
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const b = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <div className="tooltip-title">Range: {b.label}</div>
                      <div className="tooltip-row"><span>Houses:</span><strong>{b.count}</strong></div>
                      <div className="tooltip-row"><span>KDE Density (scaled):</span><strong>{b.kde}</strong></div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" name="Frequency" fill="#93c5fd" stroke="#2563eb" radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="kde" name="KDE Overlay" stroke="#1e3a8a" strokeWidth={2.2} dot={false} />
              {medianBin && (
                <ReferenceLine
                  x={medianBin.shortLabel}
                  stroke="#0f766e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
              {meanBin && (
                <ReferenceLine
                  x={meanBin.shortLabel}
                  stroke="#b91c1c"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-legend-bar">
          <span className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: '#93c5fd', border: '1px solid #2563eb' }} />
            Histogram Frequency
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: '#1e3a8a' }} />
            Gaussian KDE Curve
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: '#0f766e' }} />
            Median: {histMode === 'raw' ? formatCurrency(spStats.median) : logStats.logMedian}
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: '#b91c1c' }} />
            Mean: {histMode === 'raw' ? formatCurrency(spStats.mean) : logStats.logMean}
          </span>
        </div>
      </div>

      {/* 2. Interactive Boxplot */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">2. {boxFeature} Boxplot &amp; Quartile Spread</h3>
            <p className="card-subtitle">
              Displays minimum whisker, Q1, median, mean, Q3, upper whisker (1.5×IQR fence), and {box.outlierCount} IQR outliers
            </p>
          </div>
          <div className="btn-group">
            {['SalePrice', 'GrLivArea', 'LotArea', 'TotalBsmtSF', 'GarageArea'].map((col) => (
              <button
                key={col}
                type="button"
                className={`btn-tab ${boxFeature === col ? 'active' : ''}`}
                onClick={() => setBoxFeature(col)}
              >
                {col}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: 170 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 18, right: 24, left: 24, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical />
              <XAxis
                type="number"
                dataKey="value"
                domain={[0, Math.ceil(box.max * 1.04)]}
                tickFormatter={fmtBox}
                tick={{ fontSize: 11, fill: '#475569' }}
              />
              <YAxis type="number" dataKey="y" domain={[0, 2]} hide />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const pt = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <div className="tooltip-title">IQR Outlier Point</div>
                      <div className="tooltip-row">
                        <span>{boxFeature}:</span>
                        <strong>{formatFeatureValue(boxFeature, pt.value)}</strong>
                      </div>
                      <div className="tooltip-row">
                        <span>Upper IQR Fence:</span>
                        <strong>{formatFeatureValue(boxFeature, box.upperFence)}</strong>
                      </div>
                    </div>
                  );
                }}
              />
              <Customized component={(props) => <BoxplotOverlay {...props} boxStats={box} />} />
              <Scatter
                name="IQR Outliers"
                data={outlierScatter}
                fill="#dc2626"
                fillOpacity={0.75}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-legend-bar">
          <span className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: '#dbeafe', border: '1px solid #1d4ed8' }} />
            IQR Box (Q1 to Q3)
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: '#0f766e' }} />
            Median Line
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#b91c1c' }} />
            Mean Marker (Diamond)
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#dc2626' }} />
            IQR Outlier Points ({box.outlierCount})
          </span>
        </div>

        <div className="five-num-strip">
          <div className="five-num-item">
            <span>Min / Lower Whisker</span>
            <strong className="mono">{formatFeatureValue(boxFeature, box.whiskerLow)}</strong>
          </div>
          <div className="five-num-item">
            <span>Q1 (25th Percentile)</span>
            <strong className="mono">{formatFeatureValue(boxFeature, box.q1)}</strong>
          </div>
          <div className="five-num-item">
            <span>Median (50th)</span>
            <strong className="mono" style={{ color: '#0f766e' }}>{formatFeatureValue(boxFeature, box.median)}</strong>
          </div>
          <div className="five-num-item">
            <span>Q3 (75th Percentile)</span>
            <strong className="mono">{formatFeatureValue(boxFeature, box.q3)}</strong>
          </div>
          <div className="five-num-item">
            <span>Upper Whisker</span>
            <strong className="mono">{formatFeatureValue(boxFeature, box.whiskerHigh)}</strong>
          </div>
          <div className="five-num-item">
            <span>Maximum Value</span>
            <strong className="mono" style={{ color: '#b91c1c' }}>{formatFeatureValue(boxFeature, box.max)}</strong>
          </div>
        </div>
      </div>

      {/* 3. Overall Quality vs Sale Price + 4. HouseStyle Distribution */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">3. Overall Quality (OverallQual) vs SalePrice</h3>
              <p className="card-subtitle">Average, median, and interquartile spread (Q1–Q3) across ratings 1–10</p>
            </div>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={qualChartData} margin={{ top: 10, right: 16, left: 6, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="quality"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{ value: 'Overall Quality Rating (1 = Very Poor, 10 = Very Excellent)', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#334155' }}
                />
                <YAxis tickFormatter={formatCurrencyCompact} tick={{ fontSize: 11, fill: '#475569' }} width={58} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const q = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-title">OverallQual = {q.quality} ({q.count} houses)</div>
                        <div className="tooltip-row"><span>Average Price:</span><strong>{formatCurrency(q.avgPrice)}</strong></div>
                        <div className="tooltip-row"><span>Median Price:</span><strong>{formatCurrency(q.medianPrice)}</strong></div>
                        <div className="tooltip-row"><span>IQR (Q1–Q3):</span><strong>{formatCurrency(q.q1)} – {formatCurrency(q.q3)}</strong></div>
                        <div className="tooltip-row"><span>Range:</span><strong>{formatCurrency(q.minPrice)} – {formatCurrency(q.maxPrice)}</strong></div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="iqrBase" stackId="iqr" fill="transparent" isAnimationActive={false} />
                <Bar dataKey="iqrHeight" stackId="iqr" name="IQR (Q1–Q3)" fill="#bfdbfe" stroke="#60a5fa" />
                <Line type="monotone" dataKey="avgPrice" name="Average Price" stroke="#1d4ed8" strokeWidth={2.5} dot={{ r: 4, fill: '#1d4ed8' }} />
                <Line type="monotone" dataKey="medianPrice" name="Median Price" stroke="#0f766e" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#0f766e' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend-bar">
            <span className="legend-item"><span className="legend-swatch" style={{ backgroundColor: '#1d4ed8' }} />Average SalePrice</span>
            <span className="legend-item"><span className="legend-swatch" style={{ backgroundColor: '#0f766e' }} />Median SalePrice</span>
            <span className="legend-item"><span className="legend-swatch" style={{ backgroundColor: '#bfdbfe', border: '1px solid #60a5fa' }} />Middle 50% Spread (Q1–Q3)</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">4. HouseStyle Distribution</h3>
              <p className="card-subtitle">Frequency and average SalePrice across all 8 architectural styles</p>
            </div>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.distributions.houseStyle}
                layout="vertical"
                margin={{ top: 8, right: 20, left: 10, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{ value: 'Number of Houses', position: 'insideBottom', offset: -4, fontSize: 11, fill: '#334155' }}
                />
                <YAxis type="category" dataKey="code" tick={{ fontSize: 11.5, fill: '#334155' }} width={64} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const s = payload[0].payload;
                    return (
                      <div className="custom-tooltip">
                        <div className="tooltip-title">{s.name} ({s.code})</div>
                        <div className="tooltip-row"><span>Count:</span><strong>{formatNumber(s.count)} ({s.percentage}%)</strong></div>
                        <div className="tooltip-row"><span>Average Price:</span><strong>{formatCurrency(s.avgPrice)}</strong></div>
                        <div className="tooltip-row"><span>Median Price:</span><strong>{formatCurrency(s.medianPrice)}</strong></div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" name="Houses" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="note-box">
            <strong>Most Common Style:</strong> <code>1Story</code> accounts for <strong>726 houses (49.7%)</strong>, followed by <code>2Story</code> with <strong>445 houses (30.5%)</strong>. Two-story homes command a higher average price (<strong>$210,052</strong>) than one-story homes (<strong>$175,985</strong>).
          </div>
        </div>
      </div>

      {/* Ordinal Quality Summary Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Ordinal Quality Ratings vs SalePrice (ExterQual &amp; KitchenQual)</h3>
            <p className="card-subtitle">Ordered progression from Fair (Fa) to Typical (TA), Good (Gd), and Excellent (Ex)</p>
          </div>
        </div>
        <div className="grid-2">
          {['ExterQual', 'KitchenQual'].map((col) => (
            <div key={col} className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{col} Rating</th>
                    <th className="text-right">Houses</th>
                    <th className="text-right">Average Price</th>
                    <th className="text-right">Median Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.distributions.ordinalQualities[col].map((r) => (
                    <tr key={r.level}>
                      <td className="mono"><strong>{r.level}</strong></td>
                      <td className="text-right tabular">{r.count}</td>
                      <td className="text-right tabular">{formatCurrency(r.avgPrice)}</td>
                      <td className="text-right tabular">{formatCurrency(r.medianPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
