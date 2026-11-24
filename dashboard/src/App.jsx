import React, { useEffect, useState } from 'react';
import Sidebar, { NAV_ITEMS } from './components/Sidebar';
import Header from './components/Header';
import OverviewSection from './components/OverviewSection';
import DatasetInfoSection from './components/DatasetInfoSection';
import DataOverviewSection from './components/DataOverviewSection';
import StatisticalAnalysisSection from './components/StatisticalAnalysisSection';
import PriceDistributionSection from './components/PriceDistributionSection';
import CorrelationAnalysisSection from './components/CorrelationAnalysisSection';
import NeighborhoodSection from './components/NeighborhoodSection';
import OutlierDetectionSection from './components/OutlierDetectionSection';
import FinalInsightsSection from './components/FinalInsightsSection';

const VALID_IDS = new Set(NAV_ITEMS.map((item) => item.id));

function getInitialSection() {
  const hash = window.location.hash.replace('#', '');
  return VALID_IDS.has(hash) ? hash : 'overview';
}

export default function App() {
  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [edaData, setEdaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    import('./data/edaData.json')
      .then((mod) => {
        if (!active) return;
        const payload = mod.default || mod;
        if (!payload || !payload.metadata || !payload.kpis) {
          throw new Error('Verified EDA dataset payload is incomplete.');
        }
        setEdaData(payload);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || 'Failed to load verified EDA dataset.');
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (VALID_IDS.has(hash)) {
        setActiveSection(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleSelectSection = (id) => {
    setActiveSection(id);
    if (window.location.hash !== `#${id}`) {
      window.history.replaceState(null, '', `#${id}`);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const renderSection = () => {
    if (!edaData) return null;
    switch (activeSection) {
      case 'overview':
        return <OverviewSection data={edaData} onNavigate={handleSelectSection} />;
      case 'dataset-info':
        return <DatasetInfoSection data={edaData} />;
      case 'data-overview':
        return <DataOverviewSection data={edaData} />;
      case 'statistics':
        return <StatisticalAnalysisSection data={edaData} />;
      case 'distribution':
        return <PriceDistributionSection data={edaData} />;
      case 'correlation':
        return <CorrelationAnalysisSection data={edaData} />;
      case 'neighborhood':
        return <NeighborhoodSection data={edaData} />;
      case 'outliers':
        return <OutlierDetectionSection data={edaData} />;
      case 'insights':
        return <FinalInsightsSection data={edaData} />;
      default:
        return <OverviewSection data={edaData} onNavigate={handleSelectSection} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeSection={activeSection}
        onSelect={handleSelectSection}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="main-area">
        {edaData && (
          <Header
            metadata={edaData.metadata}
            onOpenMenu={() => setMobileMenuOpen(true)}
          />
        )}

        <main className="content-container">
          {loading && (
            <div className="state-container" role="status">
              <div className="spinner" />
              <p>Loading verified Ames Housing EDA dataset...</p>
            </div>
          )}

          {!loading && error && (
            <div className="state-container" role="alert">
              <h2 style={{ color: '#b91c1c' }}>Unable to Load Analysis Data</h2>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && renderSection()}
        </main>
      </div>
    </div>
  );
}
