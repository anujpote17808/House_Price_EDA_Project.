import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatCurrency, formatCurrencyCompact, formatNumber } from '../utils/formatters';

export default function NeighborhoodSection({ data }) {
  const [nbScope, setNbScope] = useState('all');
  const [nbMetric, setNbMetric] = useState('avgPrice');
  const [trendMode, setTrendMode] = useState('year');
  const [sortCol, setSortCol] = useState('avgPrice');
  const [sortDir, setSortDir] = useState('desc');

  const chartNeighborhoods = useMemo(() => {
    const sorted = [...data.neighborhoods].sort((a, b) => b[nbMetric] - a[nbMetric]);
    return nbScope === 'top10' ? sorted.slice(0, 10) : sorted;
  }, [data.neighborhoods, nbScope, nbMetric]);

  const sortedTable = useMemo(() => {
    return [...data.neighborhoods].sort((a, b) => {
      const av = a[sortCol];
      const bv = b[sortCol];
      if (typeof av === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
  }, [data.neighborhoods, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  const highest = data.neighborhoods[0];
  const lowest = data.neighborhoods[data.neighborhoods.length - 1];
  const ratio = (highest.avgPrice / lowest.avgPrice).toFixed(1);

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Neighborhood &amp; Construction Year Analysis</h2>
          <p className="section-subtitle">
            Geographic price disparities across all 25 Ames neighborhoods and historical pricing trends by YearBuilt.
          </p>
        </div>
      </div>

      {/* Neighborhood Bar Chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              Neighborhood-wise {nbMetric === 'avgPrice' ? 'Average' : 'Median'} Sale Price
              {nbScope === 'top10' ? ' (Top 10)' : ' (All 25 Neighborhoods)'}
            </h3>
            <p className="card-subtitle">
              Highest: {highest.name} ({formatCurrency(highest.avgPrice)}) vs Lowest: {lowest.name} ({formatCurrency(lowest.avgPrice)}) — a {ratio}× price gap
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div className="btn-group">
              <button
                type="button"
                className={`btn-tab ${nbScope === 'all' ? 'active' : ''}`}
                onClick={() => setNbScope('all')}
              >
                All 25
              </button>
              <button
                type="button"
                className={`btn-tab ${nbScope === 'top10' ? 'active' : ''}`}
                onClick={() => setNbScope('top10')}
              >
                Top 10
              </button>
            </div>
            <div className="btn-group">
              <button
                type="button"
                className={`btn-tab ${nbMetric === 'avgPrice' ? 'active' : ''}`}
                onClick={() => setNbMetric('avgPrice')}
              >
                Average
              </button>
              <button
                type="button"
                className={`btn-tab ${nbMetric === 'medianPrice' ? 'active' : ''}`}
                onClick={() => setNbMetric('medianPrice')}
              >
                Median
              </button>
            </div>
          </div>
        </div>

        <div className="chart-wrap tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartNeighborhoods}
              margin={{ top: 10, right: 16, left: 10, bottom: 56 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="code"
                angle={-45}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 11, fill: '#334155' }}
                height={62}
              />
              <YAxis
                tickFormatter={formatCurrencyCompact}
                tick={{ fontSize: 11, fill: '#475569' }}
                width={58}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const nb = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <div className="tooltip-title">{nb.name} ({nb.code})</div>
                      <div className="tooltip-row"><span>Houses Sold:</span><strong>{nb.count}</strong></div>
                      <div className="tooltip-row"><span>Average Price:</span><strong>{formatCurrency(nb.avgPrice)}</strong></div>
                      <div className="tooltip-row"><span>Median Price:</span><strong>{formatCurrency(nb.medianPrice)}</strong></div>
                      <div className="tooltip-row"><span>Avg Living Area:</span><strong>{formatNumber(nb.avgLivingArea)} sq ft</strong></div>
                      <div className="tooltip-row"><span>Avg OverallQual:</span><strong>{nb.avgQuality} / 10</strong></div>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey={nbMetric}
                name={nbMetric === 'avgPrice' ? 'Average SalePrice' : 'Median SalePrice'}
                fill="#1d4ed8"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* YearBuilt vs Average SalePrice Line Chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">YearBuilt vs Average SalePrice — Historical Trend</h3>
            <p className="card-subtitle">
              Newer homes consistently command higher prices, with sharper appreciation in homes built after 1990
            </p>
          </div>
          <div className="btn-group">
            <button
              type="button"
              className={`btn-tab ${trendMode === 'year' ? 'active' : ''}`}
              onClick={() => setTrendMode('year')}
            >
              Year-by-Year ({data.yearBuiltTrend.byYear.length} yrs)
            </button>
            <button
              type="button"
              className={`btn-tab ${trendMode === 'decade' ? 'active' : ''}`}
              onClick={() => setTrendMode('decade')}
            >
              By Decade
            </button>
          </div>
        </div>

        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendMode === 'year' ? data.yearBuiltTrend.byYear : data.yearBuiltTrend.byDecade}
              margin={{ top: 10, right: 20, left: 10, bottom: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey={trendMode === 'year' ? 'year' : 'decade'}
                tick={{ fontSize: 11, fill: '#475569' }}
                interval={trendMode === 'year' ? 9 : 0}
                label={{ value: 'Construction Period', position: 'insideBottom', offset: -6, fontSize: 11.5, fill: '#334155' }}
              />
              <YAxis
                tickFormatter={formatCurrencyCompact}
                tick={{ fontSize: 11, fill: '#475569' }}
                width={58}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <div className="tooltip-title">
                        {trendMode === 'year' ? `Built in ${row.year}` : `Decade: ${row.decade}`} ({row.count} houses)
                      </div>
                      <div className="tooltip-row"><span>Average Price:</span><strong>{formatCurrency(row.avgPrice)}</strong></div>
                      <div className="tooltip-row"><span>Median Price:</span><strong>{formatCurrency(row.medianPrice)}</strong></div>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="avgPrice"
                name="Average SalePrice"
                stroke="#1d4ed8"
                strokeWidth={2}
                dot={trendMode === 'decade' ? { r: 4, fill: '#1d4ed8' } : false}
              />
              <Line
                type="monotone"
                dataKey="medianPrice"
                name="Median SalePrice"
                stroke="#0f766e"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={trendMode === 'decade' ? { r: 3.5, fill: '#0f766e' } : false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-legend-bar">
          <span className="legend-item"><span className="legend-swatch" style={{ backgroundColor: '#1d4ed8' }} />Average SalePrice</span>
          <span className="legend-item"><span className="legend-swatch" style={{ backgroundColor: '#0f766e' }} />Median SalePrice</span>
        </div>
      </div>

      {/* Sortable Neighborhood Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Neighborhood Comparison Table (Click Column Header to Sort)</h3>
            <p className="card-subtitle">Complete breakdown of all 25 Ames residential neighborhoods</p>
          </div>
        </div>
        <div className="table-scroll" style={{ maxHeight: 380, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('code')}>Code</th>
                <th className="sortable" onClick={() => handleSort('name')}>Neighborhood Name</th>
                <th className="text-right sortable" onClick={() => handleSort('count')}>Houses</th>
                <th className="text-right sortable" onClick={() => handleSort('avgPrice')}>Avg Price</th>
                <th className="text-right sortable" onClick={() => handleSort('medianPrice')}>Median Price</th>
                <th className="text-right sortable" onClick={() => handleSort('avgLivingArea')}>Avg GrLivArea</th>
                <th className="text-right sortable" onClick={() => handleSort('avgQuality')}>Avg Quality</th>
              </tr>
            </thead>
            <tbody>
              {sortedTable.map((nb) => (
                <tr key={nb.code}>
                  <td className="mono"><strong>{nb.code}</strong></td>
                  <td>{nb.name}</td>
                  <td className="text-right tabular">{nb.count}</td>
                  <td className="text-right tabular"><strong>{formatCurrency(nb.avgPrice)}</strong></td>
                  <td className="text-right tabular">{formatCurrency(nb.medianPrice)}</td>
                  <td className="text-right tabular">{formatNumber(nb.avgLivingArea)} sq ft</td>
                  <td className="text-right mono">{nb.avgQuality.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
