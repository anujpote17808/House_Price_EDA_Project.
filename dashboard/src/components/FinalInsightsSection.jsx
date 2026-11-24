import React from 'react';
import { formatCurrency, formatNumber } from '../utils/formatters';

const EDA_CHECKLIST = [
  { step: 'Step 1', name: 'Setup & First Look', status: 'Verified', detail: 'Loaded train.csv (1,460 rows × 81 columns), audited dtypes and missing counts.' },
  { step: 'Step 2', name: 'Variable Classification', status: 'Verified', detail: 'Classified continuous, discrete, nominal, and ordinal features (noting OverallQual).' },
  { step: 'Step 3', name: 'Descriptive Statistics', status: 'Verified', detail: 'Calculated mean, median, mode, std, variance, range, IQR, skewness, kurtosis.' },
  { step: 'Step 4', name: 'Univariate Distributions', status: 'Verified', detail: 'Analyzed SalePrice histogram/KDE, boxplot, log transform, OverallQual & HouseStyle.' },
  { step: 'Step 5', name: 'Correlation & Covariance', status: 'Verified', detail: 'Ranked Pearson & Spearman correlations, compared covariance vs correlation.' },
  { step: 'Step 6', name: 'Scatter Plots', status: 'Verified', detail: 'Visualized GrLivArea, TotalBsmtSF, GarageArea vs SalePrice and flagged anomalies.' },
  { step: 'Step 7', name: 'Correlation Heatmap', status: 'Verified', detail: 'Built 11×11 masked correlation heatmap for SalePrice and Top 10 numerical drivers.' },
  { step: 'Step 8', name: 'Outlier Detection', status: 'Verified', detail: 'Compared 1.5×IQR and |z| > 3 rules across 5 key features and documented overlap.' },
  { step: 'Step 9', name: 'Data Quality Checks', status: 'Verified', detail: 'Verified 0 duplicates, separated structural NA from genuine NA, checked spellings.' },
  { step: 'Step 10', name: 'EDA Summary & Storytelling', status: 'Verified', detail: 'Synthesized 4-panel overview and verified findings against all 6 guiding questions.' },
];

export default function FinalInsightsSection({ data }) {
  const sp = data.descriptiveStats.SalePrice;
  const log = data.logTransformStats;
  const topNb = data.neighborhoods[0];
  const lowNb = data.neighborhoods[data.neighborhoods.length - 1];
  const spOut = data.outliers.comparison.find((c) => c.feature === 'SalePrice');
  const grOut = data.outliers.comparison.find((c) => c.feature === 'GrLivArea');
  const qual1 = data.distributions.overallQual.find((q) => q.quality === 1);
  const qual10 = data.distributions.overallQual.find((q) => q.quality === 10);

  const findings = [
    {
      num: 'Finding 01',
      metric: `Skewness: ${log.originalSkewness} → ${log.logSkewness} (log)`,
      title: 'SalePrice Distribution is Strongly Right-Skewed',
      body: `House prices range from ${formatCurrency(sp.min)} to ${formatCurrency(sp.max)} with a mean of ${formatCurrency(sp.mean, 2)} exceeding the median of ${formatCurrency(sp.median)} by ${formatCurrency(sp.mean - sp.median, 0)}. Applying a natural log transform reduces skewness from ${log.originalSkewness} to ${log.logSkewness}, making the distribution nearly symmetric.`,
    },
    {
      num: 'Finding 02',
      metric: 'Pearson r = 0.7910 (Strongest Driver)',
      title: 'Overall Quality Drives Price in a Clear Ordered Progression',
      body: `OverallQual has the highest correlation with SalePrice (r = 0.7910, Spearman ρ = 0.8098). Average prices climb steadily from ${formatCurrency(qual1.avgPrice)} at Quality 1 to ${formatCurrency(qual10.avgPrice)} at Quality 10, with wider price dispersion among top-tier luxury homes (ratings 8–10).`,
    },
    {
      num: 'Finding 03',
      metric: `r = ${data.outliers.corrWithUnusual2} (${data.outliers.corrWithoutUnusual2} excl. 2 anomalies)`,
      title: 'Above-Ground Living Area Shows Strong Positive Linearity',
      body: `GrLivArea is the second-strongest numerical correlate of SalePrice (r = 0.7086). Larger homes generally sell for significantly more, though two very large houses (>4,000 sq ft) sold at unexpectedly low prices noticeably pull down the linear trend.`,
    },
    {
      num: 'Finding 04',
      metric: `${(topNb.avgPrice / lowNb.avgPrice).toFixed(1)}× Price Gap Across 25 Areas`,
      title: 'Location Creates Substantial Neighborhood Price Tiers',
      body: `Neighborhood location strongly separates market segments: ${topNb.name} (${topNb.code}, avg ${formatCurrency(topNb.avgPrice)}), Northridge Heights (${formatCurrency(data.neighborhoods[1].avgPrice)}), and Stone Brook (${formatCurrency(data.neighborhoods[2].avgPrice)}) average over 3× higher than ${lowNb.name} (${lowNb.code}, avg ${formatCurrency(lowNb.avgPrice)}) and IDOTRR (${formatCurrency(data.neighborhoods[data.neighborhoods.length - 2].avgPrice)}).`,
    },
    {
      num: 'Finding 05',
      metric: 'Top 5 Correlated Features > 0.61',
      title: 'Quality, Living Space, Garage, and Basement Dominate Numerical Drivers',
      body: `The top numerical correlates with SalePrice are OverallQual (0.79), GrLivArea (0.71), GarageCars (0.64), GarageArea (0.62), TotalBsmtSF (0.61), and 1stFlrSF (0.61). Several predictors are strongly correlated with one another (e.g., GarageCars & GarageArea at r = 0.88; TotalBsmtSF & 1stFlrSF at r = 0.82), illustrating multicollinearity.`,
    },
    {
      num: 'Finding 06',
      metric: `SalePrice: ${spOut.iqrCount} IQR / ${spOut.zCount} Z-Score`,
      title: 'Outliers Include Both Legitimate Luxury Estates and 2 Unusual Partial Sales',
      body: `The IQR method flags ${spOut.iqrCount} SalePrice outliers and ${grOut.iqrCount} GrLivArea outliers, whereas the Z-score rule (|z| > 3) flags fewer (${spOut.zCount} and ${grOut.zCount}) because right-skew inflates the standard deviation. Houses #1299 (5,642 sq ft, $160k) and #524 (4,676 sq ft, $184.8k) are unusual partial sales, whereas $625k–$755k sales in NoRidge represent valid luxury transactions.`,
    },
    {
      num: 'Finding 07',
      metric: `${data.metadata.structuralMissingPct}% Structural NA (${formatNumber(data.metadata.structuralMissingCells)} / ${formatNumber(data.metadata.totalMissingCells)})`,
      title: 'Most Missing Values Signify Feature Absence, Not Data Loss',
      body: `Of the ${formatNumber(data.metadata.totalMissingCells)} missing cells across 19 columns, ${formatNumber(data.metadata.structuralMissingCells)} (${data.metadata.structuralMissingPct}%) occur in 16 feature-absence columns (PoolQC, MiscFeature, Alley, Fence, FireplaceQu, Garage*, Bsmt*, MasVnrType). Only 3 columns — LotFrontage (259), MasVnrArea (8), and Electrical (1) — contain genuine missing observations. Zero duplicate rows exist.`,
    },
  ];

  return (
    <>
      <div className="section-header">
        <div>
          <h2 className="section-title">Final Insights &amp; EDA Conclusions</h2>
          <p className="section-subtitle">
            Evidence-backed findings verified directly against the Ames Housing Dataset — answering all 6 guiding questions.
          </p>
        </div>
      </div>

      <div className="insights-grid">
        {findings.map((f) => (
          <div key={f.num} className="insight-card">
            <div className="insight-top">
              <span className="insight-num">{f.num}</span>
              <span className="insight-metric mono">{f.metric}</span>
            </div>
            <h3 className="insight-title">{f.title}</h3>
            <p className="insight-body">{f.body}</p>
          </div>
        ))}
      </div>

      {/* EDA Methodology Checklist */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">10-Step Exploratory Data Analysis Workflow Checklist</h3>
            <p className="card-subtitle">Aligned with the mid-semester project syllabus and Python notebook</p>
          </div>
          <span className="badge badge-green">All 10 EDA Steps Completed</span>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Analysis Stage</th>
                <th>Status</th>
                <th>Verified Deliverable</th>
              </tr>
            </thead>
            <tbody>
              {EDA_CHECKLIST.map((item) => (
                <tr key={item.step}>
                  <td className="mono"><strong>{item.step}</strong></td>
                  <td><strong>{item.name}</strong></td>
                  <td><span className="badge badge-green">{item.status}</span></td>
                  <td>{item.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="note-box">
          <strong>Limitations &amp; Scope:</strong> This study is strictly exploratory and observational (1,460 residential sales in Ames, Iowa from 2006–2010). Observed correlations show statistical association rather than causation, and findings are specific to the Ames market period without extrapolating into predictive machine learning models.
        </div>
      </div>
    </>
  );
}
