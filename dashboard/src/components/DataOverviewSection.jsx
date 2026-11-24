import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function DataOverviewSection({ data }) {
  const { missingAnalysis, duplicateRows, crossColumnSpellings, impossibleChecks, cleaningVerification } =
    data.dataQuality;

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Data Overview &amp; Quality Audit</h2>
          <p className="section-subtitle">
            Sample records, missing value patterns (structural vs genuine), duplicates, and consistency checks.
          </p>
        </div>
      </div>

      {/* Data Quality Summary Strip */}
      <div className="grid-4">
        <div className="kpi-card">
          <div className="kpi-label">Total Missing Cells</div>
          <div className="kpi-value tabular">{formatNumber(data.metadata.totalMissingCells)}</div>
          <div className="kpi-sub">{data.metadata.missingPctOverall}% of all 118,260 cells</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Structural NA (Absent Feature)</div>
          <div className="kpi-value tabular" style={{ color: '#0f766e' }}>
            {formatNumber(data.metadata.structuralMissingCells)}
          </div>
          <div className="kpi-sub">{data.metadata.structuralMissingPct}% of missing values (16 cols)</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Genuine Missing Values</div>
          <div className="kpi-value tabular" style={{ color: '#b45309' }}>
            {formatNumber(data.metadata.genuineMissingCells)}
          </div>
          <div className="kpi-sub">3 cols: LotFrontage, MasVnrArea, Electrical</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Duplicate Records</div>
          <div className="kpi-value tabular" style={{ color: '#15803d' }}>
            {duplicateRows}
          </div>
          <div className="kpi-sub">Verified with and without Id column</div>
        </div>
      </div>

      {/* Missing Values Bar Chart */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Missing Values Analysis (All 19 Columns with Missing Data)</h3>
            <p className="card-subtitle">
              Percentage of rows containing NA — color-coded by whether NA means &ldquo;feature absent&rdquo; or genuinely missing
            </p>
          </div>
        </div>

        <div className="chart-wrap tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={missingAnalysis}
              layout="vertical"
              margin={{ top: 4, right: 32, left: 16, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: '#475569' }}
              />
              <YAxis
                type="category"
                dataKey="column"
                tick={{ fontSize: 11.5, fill: '#334155' }}
                width={106}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload;
                  return (
                    <div className="custom-tooltip">
                      <div className="tooltip-title">{row.column}</div>
                      <div className="tooltip-row"><span>Missing Count:</span><strong>{formatNumber(row.missingCount)} / 1,460</strong></div>
                      <div className="tooltip-row"><span>Percentage:</span><strong>{row.missingPct}%</strong></div>
                      <div className="tooltip-row"><span>Classification:</span><strong>{row.category}</strong></div>
                      <div className="tooltip-row"><span>Meaning:</span><strong>{row.meaning}</strong></div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="missingPct" name="Missing %" radius={[0, 3, 3, 0]}>
                {missingAnalysis.map((entry) => (
                  <Cell
                    key={entry.column}
                    fill={entry.category.startsWith('Feature Absent') ? '#2563eb' : '#d97706'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-legend-bar">
          <span className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: '#2563eb' }} />
            Feature Absent / Structural NA (16 columns — 96.6% of NAs)
          </span>
          <span className="legend-item">
            <span className="legend-swatch" style={{ backgroundColor: '#d97706' }} />
            Genuine Missing Data (3 columns — 3.4% of NAs)
          </span>
        </div>

        <div className="note-box teal">
          <strong>Key Interpretation (Do Not Blindly Drop Missing Columns):</strong> In the Ames Housing Dataset, <code>NA</code> in columns such as <code>PoolQC</code> (99.5%), <code>MiscFeature</code> (96.3%), <code>Alley</code> (93.8%), <code>Fence</code> (80.8%), <code>FireplaceQu</code> (47.3%), and all <code>Garage*</code> / <code>Bsmt*</code> fields means the house <strong>does not have that feature</strong> — not that the data was lost. Replacing these with <code>&quot;None&quot;</code> preserves all 1,460 observations, while genuine missing values like <code>LotFrontage</code> (259 rows) are imputed with median values, reducing missing cells from <strong>{formatNumber(cleaningVerification.missingBefore)}</strong> to <strong>{cleaningVerification.missingAfter}</strong>.
        </div>
      </div>

      {/* Missing Values Reference Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Missing Values Handling Strategy</h3>
            <p className="card-subtitle">Column-by-column audit matching the Python EDA notebook cleaning pipeline</p>
          </div>
        </div>
        <div className="table-scroll" style={{ maxHeight: 340, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Column</th>
                <th className="text-right">Missing Count</th>
                <th className="text-right">Missing %</th>
                <th>Category</th>
                <th>Domain Meaning</th>
                <th>Notebook Handling</th>
              </tr>
            </thead>
            <tbody>
              {missingAnalysis.map((m) => (
                <tr key={m.column}>
                  <td className="mono"><strong>{m.column}</strong></td>
                  <td className="text-right tabular">{formatNumber(m.missingCount)}</td>
                  <td className="text-right tabular">{m.missingPct}%</td>
                  <td>
                    <span className={m.category.startsWith('Feature Absent') ? 'badge badge-blue' : 'badge badge-amber'}>
                      {m.category.startsWith('Feature Absent') ? 'Feature Absent' : 'Genuine Missing'}
                    </span>
                  </td>
                  <td>{m.meaning}</td>
                  <td>{m.handlingStrategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Quality Checks: Consistency & Impossible Values */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Categorical Consistency Checks</h3>
              <p className="card-subtitle">Audit of all 43 categorical columns for casing, whitespace, and cross-column spellings</p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Check Type</th>
                  <th>Result</th>
                  <th>Observation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Exact Duplicate Rows</strong></td>
                  <td><span className="badge badge-green">0 found</span></td>
                  <td>All 1,460 records are unique even when excluding <code>Id</code>.</td>
                </tr>
                <tr>
                  <td><strong>Leading/Trailing Spaces</strong></td>
                  <td><span className="badge badge-green">0 found</span></td>
                  <td>No category labels contain leading or trailing whitespace.</td>
                </tr>
                <tr>
                  <td><strong>Case Inconsistencies</strong></td>
                  <td><span className="badge badge-green">0 found</span></td>
                  <td>No mixed-case duplicates (e.g., &ldquo;Gd&rdquo; vs &ldquo;gd&rdquo;) within any column.</td>
                </tr>
                <tr>
                  <td><strong>Cross-Column Spellings</strong></td>
                  <td><span className="badge badge-amber">{crossColumnSpellings.length} pairs</span></td>
                  <td>
                    <code>Exterior1st</code> vs <code>Exterior2nd</code> abbreviate 3 materials differently:
                    {' '}<code>WdShing</code>/<code>Wd Shng</code>, <code>CemntBd</code>/<code>CmentBd</code>, <code>BrkComm</code>/<code>Brk Cmn</code>.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Logical &amp; Impossible Value Checks</h3>
              <p className="card-subtitle">Verifying chronological and physical validity of measurements</p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rule Checked</th>
                  <th className="text-right">Violations</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {impossibleChecks.map((chk) => (
                  <tr key={chk.check}>
                    <td className="mono"><strong>{chk.check}</strong></td>
                    <td className="text-right">
                      <span className={chk.violations === 0 ? 'badge badge-green' : 'badge badge-amber'}>
                        {chk.violations}
                      </span>
                    </td>
                    <td>{chk.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Compact Sample Records Preview */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Dataset Preview (First 10 Records — Key Features)</h3>
            <p className="card-subtitle">Compact snapshot of representative columns without exposing the entire raw CSV</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Neighborhood</th>
                <th>HouseStyle</th>
                <th className="text-right">OverallQual</th>
                <th className="text-right">YearBuilt</th>
                <th className="text-right">GrLivArea</th>
                <th className="text-right">TotalBsmtSF</th>
                <th className="text-right">GarageArea</th>
                <th className="text-right">FullBath</th>
                <th className="text-right">SalePrice</th>
              </tr>
            </thead>
            <tbody>
              {data.sampleRows.map((row) => (
                <tr key={row.Id}>
                  <td className="mono">{row.Id}</td>
                  <td className="mono">{row.Neighborhood}</td>
                  <td>{row.HouseStyle}</td>
                  <td className="text-right tabular">{row.OverallQual}</td>
                  <td className="text-right tabular">{row.YearBuilt}</td>
                  <td className="text-right tabular">{formatNumber(row.GrLivArea)}</td>
                  <td className="text-right tabular">{formatNumber(row.TotalBsmtSF)}</td>
                  <td className="text-right tabular">{formatNumber(row.GarageArea)}</td>
                  <td className="text-right tabular">{row.FullBath}</td>
                  <td className="text-right tabular"><strong>{formatCurrency(row.SalePrice)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
