import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  /** Preferred width in px; clamped to viewport. Defaults to the anchor width. */
  width?: number;
  align?: 'start' | 'end';
  children: React.ReactNode;
}

interface Coords {
  top: number;
  left: number;
  width: number;
  placement: 'bottom' | 'top';
}

const GAP = 8;
const MARGIN = 12;

/**
 * Lightweight popover that renders into a body-level portal with
 * `position: fixed`, escaping any `overflow:hidden/auto` ancestor (per the
 * dropdown-clipping rule). Closes on outside-click, Escape, scroll, and resize.
 */
const Popover: React.FC<PopoverProps> = ({ anchorRef, open, onClose, width, align = 'start', children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<Coords | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const compute = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const desiredWidth = Math.min(width ?? rect.width, vw - MARGIN * 2);
      const panelHeight = panelRef.current?.offsetHeight ?? 280;

      const spaceBelow = vh - rect.bottom;
      const placement: Coords['placement'] = spaceBelow < panelHeight + GAP && rect.top > spaceBelow ? 'top' : 'bottom';

      let left = align === 'end' ? rect.right - desiredWidth : rect.left;
      left = Math.max(MARGIN, Math.min(left, vw - desiredWidth - MARGIN));
      const top = placement === 'bottom' ? rect.bottom + GAP : Math.max(MARGIN, rect.top - GAP - panelHeight);

      setCoords({ top, left, width: desiredWidth, placement });
    };
    compute();
    // Recompute after the panel measures its real height.
    const raf = requestAnimationFrame(compute);
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', compute);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', compute);
    };
  }, [open, anchorRef, width, align, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      className="lp-popover fixed z-[var(--z-dropdown)] rounded-inner border border-theme-border bg-theme-surface1 shadow-card"
      style={{
        top: coords?.top ?? -9999,
        left: coords?.left ?? -9999,
        width: coords?.width ?? width ?? 280,
        visibility: coords ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

export default Popover;
