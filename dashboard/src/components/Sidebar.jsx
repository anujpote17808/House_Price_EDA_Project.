import React from 'react';
import {
  LayoutDashboard,
  Database,
  Table2,
  Calculator,
  BarChart3,
  GitBranch,
  MapPin,
  AlertTriangle,
  Lightbulb,
  Home,
} from 'lucide-react';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'dataset-info', label: 'Dataset Information', icon: Database },
  { id: 'data-overview', label: 'Data Overview', icon: Table2 },
  { id: 'statistics', label: 'Statistical Analysis', icon: Calculator },
  { id: 'distribution', label: 'Price Distribution', icon: BarChart3 },
  { id: 'correlation', label: 'Correlation Analysis', icon: GitBranch },
  { id: 'neighborhood', label: 'Neighborhood Analysis', icon: MapPin },
  { id: 'outliers', label: 'Outlier Detection', icon: AlertTriangle },
  { id: 'insights', label: 'Final Insights', icon: Lightbulb },
];

export default function Sidebar({ activeSection, onSelect, mobileOpen, onClose }) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} aria-label="Dashboard navigation">
        <div className="sidebar-brand">
          <div className="brand-icon" aria-hidden="true">
            <Home size={18} />
          </div>
          <div>
            <div className="brand-title">House Price Analytics</div>
            <div className="brand-subtitle">Ames Housing EDA</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">Analysis Sections</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <strong>Mid-Semester EDA Project</strong>
          <span>Ames Housing Dataset (train.csv)</span>
          <br />
          <span>Strictly Exploratory Analysis</span>
        </div>
      </aside>
    </>
  );
}
