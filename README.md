# House Price EDA Dashboard — Ames Housing Dataset

An academic, interactive **Exploratory Data Analysis (EDA)** web dashboard built for the mid-semester examination project **"Analysis of House Prices – Exploratory Data Analysis of the Ames Housing Dataset"**.

> **Scope:** Strictly Exploratory Data Analysis (no machine learning or price prediction models). Every statistic, chart, correlation, and outlier count is computed directly from the original Ames Housing Dataset (`data/train.csv`).

## Repository Structure

```text
House_Price_EDA_Project/
├── data/
│   ├── train.csv                       # Original Ames Housing Dataset (1,460 rows × 81 columns)
│   └── data_description.txt            # Feature dictionary
├── docs/
│   └── EDA_Project_Exploratory_Analysis_of_House_Prices.pdf
├── House_Price_EDA_Project.ipynb       # Original Python EDA Jupyter Notebook
├── scripts/
│   └── generate_eda_data.py            # Reproducible Python preprocessing script (Pandas/NumPy/SciPy)
├── dashboard/                          # React + Vite + Recharts EDA Dashboard
│   ├── src/
│   │   ├── data/edaData.json           # Pre-aggregated verified EDA results
│   │   ├── components/                 # Modular dashboard sections
│   │   ├── utils/formatters.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── vercel.json
└── vercel.json                         # Vercel root deployment configuration
```

## Key Verified Findings (1,460 Houses × 81 Columns)

- **SalePrice Distribution:** Mean = **$180,921.20**, Median = **$163,000**, Mode = **$140,000**, Skewness = **1.8829** (right-skewed). Log transform reduces skewness to **0.1213**.
- **Top Correlated Features:** `OverallQual` (`r = 0.7910`), `GrLivArea` (`r = 0.7086`), `GarageCars` (`r = 0.6404`), `GarageArea` (`r = 0.6234`), `TotalBsmtSF` (`r = 0.6136`).
- **Neighborhood Disparity:** Average prices span **3.4×** across 25 neighborhoods — from `NoRidge` (**$335,295**) down to `MeadowV` (**$98,576**).
- **Missing Values:** **7,829** missing cells across 19 columns, of which **7,561 (96.6%)** are structural NAs meaning *feature absent* (e.g., `PoolQC`, `Alley`, `Fence`, `FireplaceQu`, `Garage*`, `Bsmt*`), and only **268 (3.4%)** are genuine missing values (`LotFrontage`, `MasVnrArea`, `Electrical`). **0 duplicate rows**.
- **Outliers (IQR vs Z-Score):** `SalePrice` has **61** IQR outliers vs **22** Z-score outliers (22 overlap); `GrLivArea` has **31** IQR vs **16** Z-score (16 overlap). Removing the 2 unusual large-area low-price partial sales (#1299 and #524) increases the `GrLivArea`–`SalePrice` correlation from **0.7086** to **0.7350**.

## Running Locally

### 1. Regenerate Verified EDA Data (Optional)
```bash
python3 scripts/generate_eda_data.py
```

### 2. Run the React Dashboard
```bash
cd dashboard
npm install
npm run dev
```

### 3. Build for Production
```bash
cd dashboard
npm run build
```

## Deployment (Vercel)

This project is pre-configured for frontend-only static deployment on Vercel (all Python preprocessing is pre-computed into `dashboard/src/data/edaData.json`, so no runtime Python backend is required):

- Root `vercel.json` builds `dashboard/` and outputs `dashboard/dist`.
- You can also set the Vercel Root Directory to `dashboard` directly (supported by `dashboard/vercel.json`).
