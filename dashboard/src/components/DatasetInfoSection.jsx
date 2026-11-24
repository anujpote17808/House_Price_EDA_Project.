import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const GUIDING_QUESTIONS = [
  'How is SalePrice distributed? Is it skewed, and does a log transform normalize it?',
  'Which numerical features correlate most strongly with SalePrice?',
  'Does overall material and finish quality (OverallQual) raise SalePrice in a clear, ordered way?',
  'Do some neighborhoods consistently command higher prices than others?',
  'Are there outliers in SalePrice or GrLivArea, and are they data errors or real unusual sales?',
  'Which columns have missing values, and which of those represent "feature absent" rather than unknown data?',
];

export default function DatasetInfoSection({ data }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const filteredVars = useMemo(() => {
    return data.variableSummary.filter((v) => {
      const matchesType = typeFilter === 'All' || v.type === typeFilter;
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        v.column.toLowerCase().includes(q) ||
        v.examples.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [data.variableSummary, search, typeFilter]);

  const getTypeBadgeClass = (type) => {
    if (type === 'Ordinal') return 'badge badge-amber';
    if (type === 'Numerical (Continuous)') return 'badge badge-blue';
    if (type === 'Numerical (Discrete)') return 'badge badge-teal';
    return 'badge badge-slate';
  };

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Dataset Information &amp; Variable Classification</h2>
          <p className="section-subtitle">
            Source specification, guiding research questions, and classification of all 81 Ames Housing columns.
          </p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Dataset Profile</h3>
              <p className="card-subtitle">Core attributes of the Ames Housing Dataset</p>
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <tbody>
                <tr>
                  <td><strong>Dataset File</strong></td>
                  <td className="mono">data/train.csv</td>
                </tr>
                <tr>
                  <td><strong>Source</strong></td>
                  <td>{data.metadata.source}</td>
                </tr>
                <tr>
                  <td><strong>Dimensions</strong></td>
                  <td className="mono">{data.metadata.totalHouses} rows × {data.metadata.totalColumns} columns</td>
                </tr>
                <tr>
                  <td><strong>Target Variable</strong></td>
                  <td className="mono">SalePrice (USD, continuous)</td>
                </tr>
                <tr>
                  <td><strong>Construction Years</strong></td>
                  <td className="mono">{data.metadata.yearBuiltRange[0]} – {data.metadata.yearBuiltRange[1]}</td>
                </tr>
                <tr>
                  <td><strong>Sale Years Covered</strong></td>
                  <td className="mono">{data.metadata.yearSoldRange[0]} – {data.metadata.yearSoldRange[1]}</td>
                </tr>
                <tr>
                  <td><strong>Tools Used</strong></td>
                  <td>Python (Pandas, NumPy, SciPy), Jupyter Notebook, React + Recharts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Variable Type Distribution</h3>
              <p className="card-subtitle">Breakdown of all 81 columns into analytical variable types</p>
            </div>
          </div>
          <div className="chart-wrap short">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.metadata.typeBreakdown}
                layout="vertical"
                margin={{ top: 6, right: 24, left: 10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis type="category" dataKey="type" tick={{ fontSize: 11.5, fill: '#334155' }} width={148} />
                <Tooltip contentStyle={{ borderColor: '#cbd5e1', fontSize: 12 }} />
                <Bar dataKey="count" name="Columns" fill="#1d4ed8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="note-box amber">
            <strong>Important Viva Note on Ordinal Variables:</strong> <code>OverallQual</code> is stored as an integer (1 to 10) in pandas, but conceptually it is an <strong>ordinal</strong> variable representing ordered material and finish quality. Similarly, <code>ExterQual</code> and <code>KitchenQual</code> follow the ordered scale <code>Po &lt; Fa &lt; TA &lt; Gd &lt; Ex</code>.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Problem Statement &amp; Guiding EDA Questions</h3>
            <p className="card-subtitle">Questions defined prior to analysis (from Project Specification)</p>
          </div>
        </div>
        <ul className="question-list">
          {GUIDING_QUESTIONS.map((q, idx) => (
            <li key={q} className="question-item">
              <span className="question-num">{idx + 1}</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Complete Variable Reference ({filteredVars.length} of 81 columns)</h3>
            <p className="card-subtitle">Search or filter columns by variable classification</p>
          </div>
        </div>

        <div className="filter-bar">
          <input
            type="text"
            className="search-input"
            placeholder="Search column name or sample values..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search variables"
          />
          <select
            className="select-input"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by variable type"
          >
            <option value="All">All Types (81)</option>
            <option value="Numerical (Continuous)">Numerical (Continuous)</option>
            <option value="Numerical (Discrete)">Numerical (Discrete)</option>
            <option value="Categorical (Nominal)">Categorical (Nominal)</option>
            <option value="Ordinal">Ordinal</option>
          </select>
        </div>

        <div className="table-scroll" style={{ maxHeight: 420, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Analytical Type</th>
                <th>Pandas Dtype</th>
                <th className="text-right">Non-Null</th>
                <th className="text-right">Missing</th>
                <th className="text-right">Unique</th>
                <th>Example Values</th>
              </tr>
            </thead>
            <tbody>
              {filteredVars.map((v) => (
                <tr key={v.column}>
                  <td className="mono"><strong>{v.column}</strong></td>
                  <td><span className={getTypeBadgeClass(v.type)}>{v.type}</span></td>
                  <td className="mono">{v.dtype}</td>
                  <td className="text-right tabular">{v.nonNull}</td>
                  <td className="text-right tabular">
                    {v.missing > 0 ? <strong style={{ color: '#b45309' }}>{v.missing}</strong> : '0'}
                  </td>
                  <td className="text-right tabular">{v.unique}</td>
                  <td style={{ color: '#475569' }}>{v.examples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
