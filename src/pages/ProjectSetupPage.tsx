import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeProvider';
import { saveProjectDraft } from '../services/wellUniverseService';
import { useWellUniverse, CORE_SET_FIELDS } from '../components/setup/useWellUniverse';
import LaunchpadHero from '../components/setup/LaunchpadHero';
import UniverseSearchBar from '../components/setup/UniverseSearchBar';
import PresetCarousel from '../components/setup/PresetCarousel';
import SearchableSelect from '../components/setup/SearchableSelect';
import FieldSearch from '../components/setup/FieldSearch';
import ActiveFilterBar from '../components/setup/ActiveFilterBar';
import UniverseCountBadge from '../components/setup/UniverseCountBadge';
import { fieldLabel } from '../services/wellUniverseService';
import '../styles/launchpad.css';

const ProjectSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { themeId, theme, themes, setThemeId } = useTheme();
  const isClassic = theme.features.isClassicTheme;
  const u = useWellUniverse();

  const activeFieldNames = new Set(u.filters.map((c) => c.field));

  const enterWorkspace = () => {
    saveProjectDraft(u.buildDraft());
    navigate('/slopcast');
  };

  return (
    <div className="lp-root min-h-screen relative overflow-x-hidden theme-transition">
      {!isClassic && (
        <>
          <div className="sc-pageAmbient" />
          <div className="sc-pageAmbientOrbLeft" />
          <div className="sc-pageAmbientOrbRight" />
        </>
      )}

      <header className={`lp-header ${isClassic ? 'lp-header--classic' : ''}`}>
        <div className="lp-header__brand">
          <div className={`lp-header__logo ${isClassic ? 'lp-header__logo--classic' : ''}`}>
            <span>SC</span>
          </div>
          <div>
            <h1 className="lp-header__title">Project Setup</h1>
            <p className="lp-header__sub">Shape your well universe</p>
          </div>
        </div>

        <div className="lp-header__right">
          <button type="button" className="lp-header__skip" onClick={() => navigate('/slopcast')}>
            Skip to workspace
          </button>
          <div className={`lp-themeswitch ${isClassic ? 'lp-themeswitch--classic' : ''}`}>
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                className={`lp-themeswitch__btn ${themeId === t.id ? 'lp-themeswitch__btn--on' : ''}`}
                title={t.label}
                aria-label={`Theme: ${t.label}`}
              >
                <span>{t.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="lp-main">
        <LaunchpadHero>
          <h2 className="lp-hero__headline">
            Start from the wells that matter, not the whole continent.
          </h2>
          <p className="lp-hero__lede">
            Describe a target in plain language or build it by hand. Slopcast resolves it against 4.6M wells and hands the
            workspace a focused set.
          </p>
          <UniverseSearchBar
            query={u.query}
            onQueryChange={u.setQuery}
            onSubmit={u.runInterpret}
            interpreting={u.interpreting}
            result={u.interpretResult}
          />
        </LaunchpadHero>

        <PresetCarousel
          presets={u.presets}
          loading={u.presetsLoading}
          requireBasin={u.presetsRequireBasin}
          basin={u.basin}
          onApply={u.applyPreset}
        />

        <section className="lp-studio">
          <div className="lp-studio__head">
            <h2 className="lp-studio__title">Filter studio</h2>
            <p className="lp-studio__hint">Set the basin, then refine by location, operator, or any well attribute.</p>
          </div>

          <div className="lp-studio__core">
            <div className="lp-field lp-field--basin">
              <span className="lp-field__label">Basin</span>
              <SearchableSelect
                label="Basin"
                options={u.basinOptions}
                selected={u.basin ? [u.basin] : []}
                onChange={(vals) => u.setBasin(vals[0] ?? null)}
                multiple={false}
                loading={u.coreOptionsLoading.basin}
                placeholder="All basins"
              />
            </div>
            {CORE_SET_FIELDS.map((field) => (
              <SearchableSelect
                key={field}
                label={fieldLabel(field)}
                options={u.coreOptions[field] ?? []}
                selected={u.coreValuesFor(field)}
                onChange={(vals) => u.setCoreFilter(field, vals)}
                loading={u.coreOptionsLoading[field]}
              />
            ))}
          </div>

          <div className="lp-studio__divider" />

          <FieldSearch
            fields={u.granularFields}
            basin={u.basin}
            filters={u.filters}
            activeFieldNames={activeFieldNames}
            onApply={u.addClause}
          />

          <ActiveFilterBar
            basin={u.basin}
            filters={u.filters}
            onRemoveClause={u.removeClause}
            onClearBasin={() => u.setBasin(null)}
            onClearAll={u.clearAll}
          />
        </section>

        <div className="lp-footer-spacer" />
      </main>

      <footer className="lp-footer">
        <UniverseCountBadge count={u.count} loading={u.countLoading} />
        <div className="lp-footer__actions">
          <button type="button" className="lp-btn lp-btn--ghost lp-footer__reset" onClick={u.clearAll}>
            Reset filters
          </button>
          <button type="button" className="lp-next" onClick={enterWorkspace}>
            <span>Enter workspace</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ProjectSetupPage;
