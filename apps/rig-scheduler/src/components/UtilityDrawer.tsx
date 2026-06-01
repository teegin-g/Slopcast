import type { RefObject } from 'react';

interface UtilityDrawerProps {
  jsonDraft: string;
  jsonError: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSyncFromState: () => void;
  onApplyJsonDraft: () => void;
  onDownloadJson: () => void;
  onUploadFile: (file: File) => void;
  onDraftChange: (value: string) => void;
}

export const UtilityDrawer = ({
  jsonDraft,
  jsonError,
  fileInputRef,
  onClose,
  onSyncFromState,
  onApplyJsonDraft,
  onDownloadJson,
  onUploadFile,
  onDraftChange,
}: UtilityDrawerProps) => (
  <div className="utility-overlay" role="none" onClick={onClose}>
    <div
      role="dialog"
      aria-label="Utilities"
      className="utility-drawer"
      data-testid="utility-drawer"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <div className="drawer-header">
        <div>
          <span className="pill-label">Utilities</span>
          <h3>JSON import / export</h3>
        </div>
        <button type="button" className="toolbar-button secondary" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="drawer-button-row">
        <button type="button" className="toolbar-button secondary" onClick={onSyncFromState}>
          Sync from state
        </button>
        <button type="button" aria-label="Load JSON draft" className="toolbar-button" onClick={onApplyJsonDraft}>
          Load JSON
        </button>
        <button type="button" className="toolbar-button secondary" onClick={onDownloadJson}>
          Download JSON
        </button>
        <button type="button" className="toolbar-button secondary" onClick={() => fileInputRef.current?.click()}>
          Upload file
        </button>
        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="application/json"
          aria-label="Upload JSON file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUploadFile(file);
          }}
        />
      </div>

      {jsonError ? <p className="drawer-error">{jsonError}</p> : null}

      <textarea
        data-testid="json-draft"
        aria-label="JSON draft"
        className="drawer-textarea"
        value={jsonDraft}
        onChange={(event) => onDraftChange(event.target.value)}
        spellCheck={false}
      />
    </div>
  </div>
);
