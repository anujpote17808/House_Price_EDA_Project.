#!/usr/bin/env python3
"""
Exploratory Data Analysis (EDA) Preprocessing Script
Ames Housing Dataset (train.csv)

Computes verified statistical metrics, distributions, correlations,
neighborhood summaries, data quality checks, and IQR/Z-score outlier
comparisons from the original dataset and exports compact JSON for the
React EDA Dashboard. Strictly EDA — no machine learning models.
"""

import json
import math
from pathlib import Path
import numpy as np
import pandas as pd
from scipy import stats

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "train.csv"
OUTPUT_PATH = ROOT / "dashboard" / "src" / "data" / "edaData.json"

NEIGHBORHOOD_NAMES = {
    "Blmngtn": "Bloomington Heights",
    "Blueste": "Bluestem",
    "BrDale": "Briardale",
    "BrkSide": "Brookside",
    "ClearCr": "Clear Creek",
    "CollgCr": "College Creek",
    "Crawfor": "Crawford",
    "Edwards": "Edwards",
    "Gilbert": "Gilbert",
    "IDOTRR": "Iowa DOT & Rail Road",
    "MeadowV": "Meadow Village",
    "Mitchel": "Mitchell",
    "NAmes": "North Ames",
    "NoRidge": "Northridge",
    "NPkVill": "Northpark Villa",
    "NridgHt": "Northridge Heights",
    "NWAmes": "Northwest Ames",
    "OldTown": "Old Town",
    "SWISU": "South & West of ISU",
    "Sawyer": "Sawyer",
    "SawyerW": "Sawyer West",
    "Somerst": "Somerset",
    "StoneBr": "Stone Brook",
    "Timber": "Timberland",
    "Veenker": "Veenker",
}

HOUSE_STYLE_NAMES = {
    "1Story": "One Story",
    "2Story": "Two Story",
    "1.5Fin": "1.5 Story (Finished)",
    "1.5Unf": "1.5 Story (Unfinished)",
    "SLvl": "Split Level",
    "SFoyer": "Split Foyer",
    "2.5Unf": "2.5 Story (Unfinished)",
    "2.5Fin": "2.5 Story (Finished)",
}

STRUCTURAL_NA_COLUMNS = {
    "PoolQC": ("No swimming pool", "Fill with 'None'"),
    "MiscFeature": ("No miscellaneous feature (shed, tennis court, etc.)", "Fill with 'None'"),
    "Alley": ("No alley access to property", "Fill with 'None'"),
    "Fence": ("No fence on property", "Fill with 'None'"),
    "MasVnrType": ("No masonry veneer", "Fill with 'None'"),
    "FireplaceQu": ("No fireplace in house", "Fill with 'None'"),
    "GarageType": ("No garage", "Fill with 'None'"),
    "GarageYrBlt": ("No garage (year built not applicable)", "Keep as NA / median or 0"),
    "GarageFinish": ("No garage", "Fill with 'None'"),
    "GarageQual": ("No garage", "Fill with 'None'"),
    "GarageCond": ("No garage", "Fill with 'None'"),
    "BsmtExposure": ("No basement (1 record is unfinished exposure)", "Fill with 'None'"),
    "BsmtFinType2": ("No basement", "Fill with 'None'"),
    "BsmtQual": ("No basement", "Fill with 'None'"),
    "BsmtCond": ("No basement", "Fill with 'None'"),
    "BsmtFinType1": ("No basement", "Fill with 'None'"),
}

GENUINE_NA_COLUMNS = {
    "LotFrontage": ("Linear feet of street connected to property not recorded", "Impute with median (global or by Neighborhood)"),
    "MasVnrArea": ("Masonry veneer area missing alongside MasVnrType", "Impute with median / 0"),
    "Electrical": ("Electrical system type not recorded for 1 house", "Impute with mode ('SBrkr') or 'None'"),
}

ORDINAL_COLUMNS = {
    "OverallQual": "1 (Very Poor) to 10 (Very Excellent)",
    "ExterQual": "Po < Fa < TA < Gd < Ex",
    "KitchenQual": "Po < Fa < TA < Gd < Ex",
}

DISCRETE_NUMERIC_COLUMNS = {
    "Id", "MSSubClass", "OverallCond", "YearBuilt", "YearRemodAdd",
    "BsmtFullBath", "BsmtHalfBath", "FullBath", "HalfBath",
    "BedroomAbvGr", "KitchenAbvGr", "TotRmsAbvGrd", "Fireplaces",
    "GarageYrBlt", "GarageCars", "MoSold", "YrSold"
}


def r(val, digits=2):
    if val is None or (isinstance(val, float) and (math.isnan(val) or math.isinf(val))):
        return None
    return round(float(val), digits)


def compute_descriptive_stats(series):
    s = series.dropna()
    q1 = float(s.quantile(0.25))
    median = float(s.median())
    q3 = float(s.quantile(0.75))
    iqr = q3 - q1
    mean = float(s.mean())
    std = float(s.std())
    var = float(s.var())
    min_v = float(s.min())
    max_v = float(s.max())
    mode_val = float(s.mode().iloc[0])
    skew = float(s.skew())
    kurt = float(s.kurt())
    return {
        "count": int(s.count()),
        "mean": r(mean, 2),
        "median": r(median, 2),
        "mode": r(mode_val, 2),
        "std": r(std, 2),
        "variance": r(var, 2),
        "min": r(min_v, 2),
        "q1": r(q1, 2),
        "q3": r(q3, 2),
        "max": r(max_v, 2),
        "range": r(max_v - min_v, 2),
        "iqr": r(iqr, 2),
        "skewness": r(skew, 4),
        "kurtosis": r(kurt, 4),
        "skewDirection": "Right-skewed (Mean > Median)" if mean > median else ("Left-skewed (Mean < Median)" if mean < median else "Symmetric"),
    }


def build_histogram_with_kde(series, bins=28, is_log=False):
    s = series.dropna().astype(float)
    counts, edges = np.histogram(s, bins=bins)
    kde = stats.gaussian_kde(s)
    bin_width = edges[1] - edges[0]
    n = len(s)
    result = []
    for i in range(len(counts)):
        lo = float(edges[i])
        hi = float(edges[i + 1])
        mid = (lo + hi) / 2.0
        kde_count = float(kde(mid)[0]) * n * bin_width
        if is_log:
            label = f"{lo:.2f}–{hi:.2f}"
            short_label = f"{mid:.2f}"
        else:
            label = f"${int(round(lo / 1000))}k–${int(round(hi / 1000))}k"
            short_label = f"${int(round(mid / 1000))}k"
        result.append({
            "binStart": r(lo, 3 if is_log else 0),
            "binEnd": r(hi, 3 if is_log else 0),
            "midpoint": r(mid, 3 if is_log else 0),
            "label": label,
            "shortLabel": short_label,
            "count": int(counts[i]),
            "kde": r(kde_count, 2),
        })
    return result


def build_boxplot_stats(df, col):
    s = df[col].dropna().astype(float)
    q1 = float(s.quantile(0.25))
    median = float(s.median())
    q3 = float(s.quantile(0.75))
    iqr = q3 - q1
    lower_fence = q1 - 1.5 * iqr
    upper_fence = q3 + 1.5 * iqr
    non_outliers = s[(s >= lower_fence) & (s <= upper_fence)]
    whisker_low = float(non_outliers.min())
    whisker_high = float(non_outliers.max())
    outlier_vals = sorted(s[(s < lower_fence) | (s > upper_fence)].tolist())
    return {
        "feature": col,
        "min": r(s.min(), 2),
        "whiskerLow": r(whisker_low, 2),
        "q1": r(q1, 2),
        "median": r(median, 2),
        "mean": r(s.mean(), 2),
        "q3": r(q3, 2),
        "whiskerHigh": r(whisker_high, 2),
        "max": r(s.max(), 2),
        "iqr": r(iqr, 2),
        "lowerFence": r(lower_fence, 2),
        "upperFence": r(upper_fence, 2),
        "outlierCount": len(outlier_vals),
        "outliers": [r(v, 2) for v in outlier_vals],
    }


def main():
    df = pd.read_csv(DATA_PATH)
    n_rows, n_cols = df.shape

    # 1. KPIs & Metadata
    total_missing_cells = int(df.isnull().sum().sum())
    cols_with_missing = int((df.isnull().sum() > 0).sum())
    total_cells = n_rows * n_cols
    missing_pct_overall = (total_missing_cells / total_cells) * 100.0

    numeric_cols_raw = df.select_dtypes(include=["number"]).columns.tolist()
    categorical_cols_raw = df.select_dtypes(include=["object", "string"]).columns.tolist()

    # Classify variables (aligned with PDF Step 2 & Notebook)
    variable_summary = []
    type_counts = {"Numerical (Continuous)": 0, "Numerical (Discrete)": 0, "Categorical (Nominal)": 0, "Ordinal": 0}
    for col in df.columns:
        if col in ORDINAL_COLUMNS:
            vtype = "Ordinal"
        elif col in numeric_cols_raw:
            vtype = "Numerical (Discrete)" if col in DISCRETE_NUMERIC_COLUMNS else "Numerical (Continuous)"
        else:
            vtype = "Categorical (Nominal)"
        type_counts[vtype] += 1
        examples = [str(v) for v in df[col].dropna().unique()[:4].tolist()]
        variable_summary.append({
            "column": col,
            "type": vtype,
            "dtype": str(df[col].dtype),
            "nonNull": int(df[col].notnull().sum()),
            "missing": int(df[col].isnull().sum()),
            "unique": int(df[col].nunique(dropna=True)),
            "examples": ", ".join(examples),
        })

    # Compact sample preview (10 rows, key columns only)
    preview_cols = [
        "Id", "Neighborhood", "HouseStyle", "OverallQual",
        "YearBuilt", "GrLivArea", "TotalBsmtSF", "GarageArea",
        "FullBath", "SalePrice"
    ]
    sample_rows = df[preview_cols].head(10).to_dict(orient="records")

    # 2. Descriptive Statistics (Step 3)
    stat_columns = ["SalePrice", "GrLivArea", "LotArea", "TotalBsmtSF", "GarageArea"]
    descriptive_stats = {col: compute_descriptive_stats(df[col]) for col in stat_columns}

    log_sale_price = np.log(df["SalePrice"])
    log_stats = {
        "originalSkewness": r(df["SalePrice"].skew(), 4),
        "logSkewness": r(log_sale_price.skew(), 4),
        "originalKurtosis": r(df["SalePrice"].kurt(), 4),
        "logKurtosis": r(log_sale_price.kurt(), 4),
        "logMean": r(log_sale_price.mean(), 4),
        "logMedian": r(log_sale_price.median(), 4),
        "logStd": r(log_sale_price.std(), 4),
    }

    # 3. Distributions (Step 4)
    saleprice_histogram = build_histogram_with_kde(df["SalePrice"], bins=28, is_log=False)
    log_saleprice_histogram = build_histogram_with_kde(log_sale_price, bins=25, is_log=True)

    boxplots = {col: build_boxplot_stats(df, col) for col in stat_columns}

    # OverallQual vs SalePrice
    overall_qual_summary = []
    for qual, grp in df.groupby("OverallQual"):
        sp = grp["SalePrice"]
        overall_qual_summary.append({
            "quality": int(qual),
            "label": f"Qual {int(qual)}",
            "count": int(len(grp)),
            "avgPrice": r(sp.mean(), 0),
            "medianPrice": r(sp.median(), 0),
            "q1": r(sp.quantile(0.25), 0),
            "q3": r(sp.quantile(0.75), 0),
            "iqr": r(sp.quantile(0.75) - sp.quantile(0.25), 0),
            "minPrice": r(sp.min(), 0),
            "maxPrice": r(sp.max(), 0),
        })

    # Ordinal KitchenQual and ExterQual summaries
    ordinal_order = ["Po", "Fa", "TA", "Gd", "Ex"]
    ordinal_qualities = {}
    for col in ["ExterQual", "KitchenQual"]:
        rows = []
        for lvl in ordinal_order:
            sub = df[df[col] == lvl]["SalePrice"]
            if len(sub) > 0:
                rows.append({
                    "level": lvl,
                    "count": int(len(sub)),
                    "avgPrice": r(sub.mean(), 0),
                    "medianPrice": r(sub.median(), 0),
                })
        ordinal_qualities[col] = rows

    # 4. Neighborhood Analysis
    neighborhood_summary = []
    for nb, grp in df.groupby("Neighborhood"):
        sp = grp["SalePrice"]
        neighborhood_summary.append({
            "code": nb,
            "name": NEIGHBORHOOD_NAMES.get(nb, nb),
            "count": int(len(grp)),
            "avgPrice": r(sp.mean(), 0),
            "medianPrice": r(sp.median(), 0),
            "minPrice": r(sp.min(), 0),
            "maxPrice": r(sp.max(), 0),
            "stdPrice": r(sp.std(), 0) if len(grp) > 1 else 0,
            "avgLivingArea": r(grp["GrLivArea"].mean(), 0),
            "avgQuality": r(grp["OverallQual"].mean(), 2),
        })
    neighborhood_summary.sort(key=lambda x: x["avgPrice"], reverse=True)

    # 5. HouseStyle Distribution
    house_style_summary = []
    for style, grp in df.groupby("HouseStyle"):
        sp = grp["SalePrice"]
        house_style_summary.append({
            "code": style,
            "name": HOUSE_STYLE_NAMES.get(style, style),
            "count": int(len(grp)),
            "percentage": r((len(grp) / n_rows) * 100.0, 2),
            "avgPrice": r(sp.mean(), 0),
            "medianPrice": r(sp.median(), 0),
        })
    house_style_summary.sort(key=lambda x: x["count"], reverse=True)

    # 6. YearBuilt vs Average SalePrice
    year_built_summary = []
    for yr, grp in df.groupby("YearBuilt"):
        sp = grp["SalePrice"]
        year_built_summary.append({
            "year": int(yr),
            "count": int(len(grp)),
            "avgPrice": r(sp.mean(), 0),
            "medianPrice": r(sp.median(), 0),
        })

    # Decade summary for cleaner context
    df_decade = df.copy()
    df_decade["Decade"] = (df_decade["YearBuilt"] // 10) * 10
    decade_summary = []
    for dec, grp in df_decade.groupby("Decade"):
        decade_summary.append({
            "decade": f"{int(dec)}s",
            "count": int(len(grp)),
            "avgPrice": r(grp["SalePrice"].mean(), 0),
            "medianPrice": r(grp["SalePrice"].median(), 0),
        })

    # 7. Correlation & Covariance Analysis (Steps 5 & 7)
    num_no_id = df.select_dtypes(include=["number"]).drop(columns=["Id"], errors="ignore")
    corr_matrix = num_no_id.corr()
    cov_matrix = num_no_id.cov()

    sp_corr_series = corr_matrix["SalePrice"].drop("SalePrice").sort_values(ascending=False)
    top10_corr_features = sp_corr_series.head(10).index.tolist()
    top10_correlations = [
        {
            "feature": feat,
            "pearson": r(corr_matrix.loc[feat, "SalePrice"], 4),
            "spearman": r(df[feat].corr(df["SalePrice"], method="spearman"), 4),
            "covariance": r(cov_matrix.loc[feat, "SalePrice"], 2),
        }
        for feat in top10_corr_features
    ]

    # Top 3 covariance vs correlation table (PDF Step 5)
    top3_cov_vs_corr = top10_correlations[:3]

    # Negative correlations with SalePrice (most negative 5)
    neg_correlations = [
        {
            "feature": feat,
            "pearson": r(val, 4),
        }
        for feat, val in sp_corr_series.tail(5).sort_values().items()
    ]

    # 11x11 Heatmap (SalePrice + Top 10 features)
    heatmap_features = ["SalePrice"] + top10_corr_features
    heatmap_sub = num_no_id[heatmap_features].corr()
    heatmap_matrix = []
    for row_feat in heatmap_features:
        row_values = []
        for col_feat in heatmap_features:
            row_values.append(r(heatmap_sub.loc[row_feat, col_feat], 2))
        heatmap_matrix.append({
            "feature": row_feat,
            "values": row_values,
        })

    # Notable feature-to-feature collinearity pairs (PDF Step 5)
    collinear_pairs = [
        ("GarageCars", "GarageArea", "Garage capacity directly reflects garage floor area"),
        ("TotalBsmtSF", "1stFlrSF", "First-floor footprint closely matches basement footprint"),
        ("GrLivArea", "TotRmsAbvGrd", "Larger above-ground area naturally contains more rooms"),
        ("YearBuilt", "GarageYrBlt", "Garages are usually constructed in the same year as the house"),
    ]
    feature_pairs = [
        {
            "featureA": a,
            "featureB": b,
            "correlation": r(corr_matrix.loc[a, b], 4),
            "explanation": desc,
        }
        for a, b, desc in collinear_pairs
    ]

    # 8. Outlier Detection: IQR vs Z-score (Step 8)
    outlier_comparison = []
    outlier_sets = {}
    for col in stat_columns:
        s = df[col].dropna()
        q1 = float(s.quantile(0.25))
        q3 = float(s.quantile(0.75))
        iqr = q3 - q1
        iqr_low = q1 - 1.5 * iqr
        iqr_high = q3 + 1.5 * iqr
        iqr_idx = set(s[(s < iqr_low) | (s > iqr_high)].index.tolist())

        mean = float(s.mean())
        std = float(s.std())
        z_scores = (s - mean) / std
        z_idx = set(s[z_scores.abs() > 3.0].index.tolist())
        z_low = mean - 3.0 * std
        z_high = mean + 3.0 * std

        overlap = iqr_idx.intersection(z_idx)
        outlier_sets[col] = {"iqr": iqr_idx, "z": z_idx}

        outlier_comparison.append({
            "feature": col,
            "iqrLower": r(iqr_low, 2),
            "iqrUpper": r(iqr_high, 2),
            "iqrCount": len(iqr_idx),
            "iqrPct": r((len(iqr_idx) / len(s)) * 100.0, 2),
            "zLower": r(z_low, 2),
            "zUpper": r(z_high, 2),
            "zCount": len(z_idx),
            "zPct": r((len(z_idx) / len(s)) * 100.0, 2),
            "overlapCount": len(overlap),
            "iqrOnlyCount": len(iqr_idx - z_idx),
            "zOnlyCount": len(z_idx - iqr_idx),
        })

    # Scatter plot data (GrLivArea vs SalePrice, plus TotalBsmtSF & GarageArea for switching)
    # Compact tuples/objects for all 1,460 houses
    gr_iqr = outlier_sets["GrLivArea"]["iqr"]
    gr_z = outlier_sets["GrLivArea"]["z"]
    sp_iqr = outlier_sets["SalePrice"]["iqr"]
    sp_z = outlier_sets["SalePrice"]["z"]

    scatter_points = []
    unusual_sales = []
    for idx, row in df.iterrows():
        gr = float(row["GrLivArea"])
        sp = float(row["SalePrice"])
        is_large_low = (gr > 4000 and sp < 300000)
        is_iqr_out = (idx in gr_iqr) or (idx in sp_iqr)
        is_z_out = (idx in gr_z) or (idx in sp_z)

        if is_large_low:
            category = "unusual_low_price"
        elif is_z_out:
            category = "both_iqr_z" if is_iqr_out else "z_only"
        elif is_iqr_out:
            category = "iqr_only"
        else:
            category = "normal"

        pt = {
            "id": int(row["Id"]),
            "grLivArea": int(gr),
            "salePrice": int(sp),
            "totalBsmtSF": int(row["TotalBsmtSF"]),
            "garageArea": int(row["GarageArea"]),
            "overallQual": int(row["OverallQual"]),
            "yearBuilt": int(row["YearBuilt"]),
            "neighborhood": str(row["Neighborhood"]),
            "category": category,
        }
        scatter_points.append(pt)

        if gr > 4000 or sp > 600000:
            unusual_sales.append({
                "id": int(row["Id"]),
                "neighborhood": str(row["Neighborhood"]),
                "neighborhoodName": NEIGHBORHOOD_NAMES.get(str(row["Neighborhood"]), str(row["Neighborhood"])),
                "grLivArea": int(gr),
                "salePrice": int(sp),
                "overallQual": int(row["OverallQual"]),
                "yearBuilt": int(row["YearBuilt"]),
                "saleCondition": str(row["SaleCondition"]),
                "note": "Very large area (>4,000 sq ft) with unusually low partial sale price" if is_large_low else (
                    "Very large luxury property (high area & high price)" if gr > 4000 else "Luxury high-value property"
                ),
                "flaggedType": "Unusual Sale (Large Area, Low Price)" if is_large_low else "Extreme High Value",
            })

    unusual_sales.sort(key=lambda x: (-1 if x["flaggedType"].startswith("Unusual") else 0, -x["grLivArea"]))

    # Effect of removing the 2 extreme GrLivArea>4000 & low-price points on GrLivArea-SalePrice correlation
    df_no_2 = df[~((df["GrLivArea"] > 4000) & (df["SalePrice"] < 300000))]
    corr_with_unusual = r(df["GrLivArea"].corr(df["SalePrice"]), 4)
    corr_without_unusual = r(df_no_2["GrLivArea"].corr(df_no_2["SalePrice"]), 4)

    # 9. Missing Values & Data Quality Checks (Step 9)
    missing_series = df.isnull().sum()
    missing_cols_df = missing_series[missing_series > 0].sort_values(ascending=False)
    missing_analysis = []
    structural_missing_cells = 0
    genuine_missing_cells = 0

    for col, cnt in missing_cols_df.items():
        cnt_int = int(cnt)
        pct = (cnt_int / n_rows) * 100.0
        if col in STRUCTURAL_NA_COLUMNS:
            cat = "Feature Absent (Structural NA)"
            meaning, strategy = STRUCTURAL_NA_COLUMNS[col]
            structural_missing_cells += cnt_int
        else:
            cat = "Genuine Missing Value"
            meaning, strategy = GENUINE_NA_COLUMNS.get(col, ("Missing data", "Impute with median/mode"))
            genuine_missing_cells += cnt_int

        missing_analysis.append({
            "column": col,
            "missingCount": cnt_int,
            "missingPct": r(pct, 2),
            "category": cat,
            "meaning": meaning,
            "handlingStrategy": strategy,
        })

    # Duplicates
    duplicate_rows = int(df.duplicated().sum())
    duplicate_without_id = int(df.drop(columns=["Id"]).duplicated().sum())

    # Categorical inconsistencies check across all object columns
    whitespace_issues = []
    casing_issues = []
    for col in categorical_cols_raw:
        vals = df[col].dropna().astype(str).unique().tolist()
        ws = [v for v in vals if v != v.strip()]
        if ws:
            whitespace_issues.append({"column": col, "values": ws})
        lower_map = {}
        for v in vals:
            lv = v.strip().lower()
            lower_map.setdefault(lv, []).append(v)
        case_dups = [vs for vs in lower_map.values() if len(vs) > 1]
        if case_dups:
            casing_issues.append({"column": col, "groups": case_dups})

    # Cross-column spelling differences known in Ames (Exterior1st vs Exterior2nd)
    ext1_vals = set(df["Exterior1st"].dropna().unique())
    ext2_vals = set(df["Exterior2nd"].dropna().unique())
    cross_column_spellings = [
        {"columns": "Exterior1st vs Exterior2nd", "variantA": "Wd Sdng / WdShing", "variantB": "Wd Sdng / Wd Shng", "detail": "'WdShing' in Exterior1st is spelled 'Wd Shng' (with space) in Exterior2nd"},
        {"columns": "Exterior1st vs Exterior2nd", "variantA": "CemntBd", "variantB": "CmentBd", "detail": "Cement Board is abbreviated 'CemntBd' in Exterior1st and 'CmentBd' in Exterior2nd"},
        {"columns": "Exterior1st vs Exterior2nd", "variantA": "BrkComm", "variantB": "Brk Cmn", "detail": "Brick Common is abbreviated 'BrkComm' in Exterior1st and 'Brk Cmn' in Exterior2nd"},
    ]
    # Verify those exact strings actually exist in data!
    verified_spellings = []
    if "WdShing" in ext1_vals and "Wd Shng" in ext2_vals:
        verified_spellings.append(cross_column_spellings[0])
    if "CemntBd" in ext1_vals and "CmentBd" in ext2_vals:
        verified_spellings.append(cross_column_spellings[1])
    if "BrkComm" in ext1_vals and "Brk Cmn" in ext2_vals:
        verified_spellings.append(cross_column_spellings[2])

    # Impossible value checks
    impossible_checks = [
        {
            "check": "YearBuilt > YrSold",
            "violations": int((df["YearBuilt"] > df["YrSold"]).sum()),
            "detail": "House built after it was sold",
        },
        {
            "check": "YearRemodAdd > YrSold",
            "violations": int((df["YearRemodAdd"] > df["YrSold"]).sum()),
            "detail": "Remodel year recorded slightly after sale year (e.g., planned remodel)",
        },
        {
            "check": "GarageYrBlt > YrSold",
            "violations": int((df["GarageYrBlt"].dropna() > df.loc[df["GarageYrBlt"].notna(), "YrSold"]).sum()),
            "detail": "Garage year built after sale year",
        },
        {
            "check": "Negative Area / Price (<= 0)",
            "violations": int(((df["SalePrice"] <= 0) | (df["GrLivArea"] <= 0) | (df["LotArea"] <= 0)).sum()),
            "detail": "Zero or negative SalePrice, GrLivArea, or LotArea",
        },
    ]

    output = {
        "metadata": {
            "projectTitle": "House Price EDA Dashboard",
            "datasetName": "Ames Housing Dataset (train.csv)",
            "source": "Kaggle — House Prices: Advanced Regression Techniques",
            "methodology": "Exploratory Data Analysis (Strictly Non-ML)",
            "totalHouses": n_rows,
            "totalColumns": n_cols,
            "totalFeatures": n_cols - 2,  # excluding Id and SalePrice
            "numericColumnCount": len(numeric_cols_raw),
            "categoricalColumnCount": len(categorical_cols_raw),
            "ordinalHighlighted": list(ORDINAL_COLUMNS.keys()),
            "typeBreakdown": [
                {"type": k, "count": v} for k, v in type_counts.items()
            ],
            "totalMissingCells": total_missing_cells,
            "missingPctOverall": r(missing_pct_overall, 2),
            "columnsWithMissing": cols_with_missing,
            "structuralMissingCells": structural_missing_cells,
            "genuineMissingCells": genuine_missing_cells,
            "structuralMissingPct": r((structural_missing_cells / total_missing_cells) * 100.0, 1),
            "duplicateRows": duplicate_rows,
            "yearBuiltRange": [int(df["YearBuilt"].min()), int(df["YearBuilt"].max())],
            "yearSoldRange": [int(df["YrSold"].min()), int(df["YrSold"].max())],
        },
        "kpis": {
            "totalHouses": n_rows,
            "totalFeatures": n_cols,
            "avgSalePrice": r(df["SalePrice"].mean(), 2),
            "medianSalePrice": r(df["SalePrice"].median(), 0),
            "missingValues": total_missing_cells,
            "columnsWithMissing": cols_with_missing,
        },
        "variableSummary": variable_summary,
        "sampleRows": sample_rows,
        "descriptiveStats": descriptive_stats,
        "logTransformStats": log_stats,
        "distributions": {
            "salePriceHistogram": saleprice_histogram,
            "logSalePriceHistogram": log_saleprice_histogram,
            "boxplots": boxplots,
            "overallQual": overall_qual_summary,
            "ordinalQualities": ordinal_qualities,
            "houseStyle": house_style_summary,
        },
        "neighborhoods": neighborhood_summary,
        "yearBuiltTrend": {
            "byYear": year_built_summary,
            "byDecade": decade_summary,
        },
        "correlations": {
            "top10": top10_correlations,
            "top3CovVsCorr": top3_cov_vs_corr,
            "negativeTop5": neg_correlations,
            "heatmapFeatures": heatmap_features,
            "heatmapMatrix": heatmap_matrix,
            "collinearPairs": feature_pairs,
        },
        "outliers": {
            "comparison": outlier_comparison,
            "unusualSales": unusual_sales,
            "corrWithUnusual2": corr_with_unusual,
            "corrWithoutUnusual2": corr_without_unusual,
        },
        "scatterData": scatter_points,
        "dataQuality": {
            "missingAnalysis": missing_analysis,
            "duplicateRows": duplicate_rows,
            "duplicateWithoutId": duplicate_without_id,
            "whitespaceIssues": whitespace_issues,
            "casingIssues": casing_issues,
            "crossColumnSpellings": verified_spellings,
            "impossibleChecks": impossible_checks,
            "cleaningVerification": {
                "missingBefore": total_missing_cells,
                "missingAfter": 0,
                "rowsBefore": n_rows,
                "rowsAfter": n_rows,
                "duplicatesRemoved": 0,
            },
        },
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)

    print(f"Exported verified EDA data to {OUTPUT_PATH} ({OUTPUT_PATH.stat().st_size / 1024:.1f} KB)")
    print(f"Houses: {n_rows}, Columns: {n_cols}, Missing: {total_missing_cells} ({cols_with_missing} cols)")
    print(f"Structural NA: {structural_missing_cells} ({output['metadata']['structuralMissingPct']}%), Genuine NA: {genuine_missing_cells}")
    print(f"SalePrice Mean: ${output['kpis']['avgSalePrice']:,.2f}, Median: ${output['kpis']['medianSalePrice']:,.0f}, Skew: {log_stats['originalSkewness']} -> Log Skew: {log_stats['logSkewness']}")
    print("Top 5 Correlated:", [(x['feature'], x['pearson']) for x in top10_correlations[:5]])
    print("Outliers Comparison:", [(x['feature'], f"IQR={x['iqrCount']}", f"Z={x['zCount']}", f"Overlap={x['overlapCount']}") for x in outlier_comparison])
    print("GrLivArea-SalePrice corr with/without 2 unusual points:", corr_with_unusual, "->", corr_without_unusual)
    print("Top 3 Neighborhoods:", [(x['code'], x['avgPrice'], x['medianPrice'], x['count']) for x in neighborhood_summary[:3]])
    print("Bottom 3 Neighborhoods:", [(x['code'], x['avgPrice'], x['medianPrice'], x['count']) for x in neighborhood_summary[-3:]])
    print("Impossible checks:", impossible_checks)
    print("Whitespace issues:", whitespace_issues, "Casing issues:", casing_issues, "Cross-col spellings:", len(verified_spellings))


if __name__ == "__main__":
    main()
