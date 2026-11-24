import React from 'react';
import { Menu } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

export default function Header({ metadata, onOpenMenu }) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="header-title">House Price EDA Dashboard</h1>
          <div className="header-meta">
            <span>Ames Housing Dataset</span>
            <span className="header-dot">•</span>
            <span>Exploratory Data Analysis</span>
            <span className="header-dot">•</span>
            <span>
              {formatNumber(metadata.totalHouses)} records × {metadata.totalColumns} columns
            </span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <span className="eda-tag">EDA Only (Non-ML)</span>
        <span className="status-badge">
          <span className="status-dot" />
          Dataset Loaded &amp; Verified
        </span>
      </div>
    </header>
  );
}
