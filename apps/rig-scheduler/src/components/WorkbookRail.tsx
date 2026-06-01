import { WORKBOOK_SECTIONS, type WorkbookSection } from '../shared';

interface WorkbookRailProps {
  activeSection: WorkbookSection;
  setActiveSection: (section: WorkbookSection) => void;
  remainingInventory: number;
  years: number;
  overrideRowCount: number;
}

export const WorkbookRail = ({
  activeSection,
  setActiveSection,
  remainingInventory,
  years,
  overrideRowCount,
}: WorkbookRailProps) => (
  <aside className="workbook-rail">
    <div className="rail-card">
      <span className="pill-label">Workbook</span>
      <div className="section-tab-list">
        {WORKBOOK_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            data-testid={`section-tab-${section.id}`}
            className={activeSection === section.id ? 'section-tab active' : 'section-tab'}
            onClick={() => setActiveSection(section.id)}
          >
            <strong>{section.label}</strong>
            <span>{section.subtitle}</span>
          </button>
        ))}
      </div>
    </div>

    <div className="rail-card">
      <span className="pill-label">At a glance</span>
      <div className="rail-metric-list">
        <div>
          <span>Remaining wells</span>
          <strong>{remainingInventory}</strong>
        </div>
        <div>
          <span>Rig years</span>
          <strong>{years}</strong>
        </div>
        <div>
          <span>Override rows</span>
          <strong>{overrideRowCount}</strong>
        </div>
      </div>
    </div>
  </aside>
);
