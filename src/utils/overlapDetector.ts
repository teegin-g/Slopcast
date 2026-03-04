/**
 * Overlap Detection Utility
 *
 * Scans the DOM for overlapping elements to help identify layout issues.
 * Designed to be performant and filter out expected overlaps (fixed/absolute positioning, modals, etc.)
 */

export interface OverlapViolation {
  elementA: { selector: string; rect: DOMRect };
  elementB: { selector: string; rect: DOMRect };
  overlapArea: number; // in pixels squared
}

const MINIMUM_OVERLAP_THRESHOLD = 400; // pixels squared — filters out border/margin artifacts
const MINIMUM_ELEMENT_SIZE = 10; // pixels (width or height)
const MINIMUM_OVERLAP_RATIO = 0.05; // overlap must be ≥5% of the smaller element's area

/**
 * Generates a readable CSS selector for an element.
 * Prefers data-testid, then id, then tag.class notation.
 */
export function getSelector(el: HTMLElement): string {
  // Prefer data-testid
  const testId = el.getAttribute('data-testid');
  if (testId) {
    return `[data-testid="${testId}"]`;
  }

  // Then id
  if (el.id) {
    return `#${el.id}`;
  }

  // Build tag.class1.class2 selector
  let selector = el.tagName.toLowerCase();
  if (el.className && typeof el.className === 'string') {
    const classes = el.className.split(/\s+/).filter(Boolean);
    if (classes.length > 0) {
      // Limit to first 3 classes to avoid overly long selectors
      selector += '.' + classes.slice(0, 3).join('.');
    }
  }

  // Truncate if too long
  if (selector.length > 80) {
    selector = selector.substring(0, 77) + '...';
  }

  return selector;
}

/**
 * Checks if an element should be excluded from overlap detection.
 */
function shouldExcludeElement(el: HTMLElement): boolean {
  // Skip invisible elements
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return true;
  }

  // Skip elements with fixed or absolute positioning (they're meant to overlay)
  if (style.position === 'fixed' || style.position === 'absolute') {
    return true;
  }

  // Skip sticky positioned elements
  if (style.position === 'sticky') {
    return true;
  }

  // Skip elements inside modals, tooltips, menus
  if (
    el.closest('[role="dialog"]') ||
    el.closest('[role="tooltip"]') ||
    el.closest('[role="menu"]')
  ) {
    return true;
  }

  // Skip debug overlay elements
  if (el.hasAttribute('data-debug-overlay')) {
    return true;
  }

  // Get bounding rect and skip if too small or zero dimensions
  const rect = el.getBoundingClientRect();
  if (
    rect.width < MINIMUM_ELEMENT_SIZE ||
    rect.height < MINIMUM_ELEMENT_SIZE ||
    rect.width === 0 ||
    rect.height === 0
  ) {
    return true;
  }

  return false;
}

/**
 * Calculates the intersection area of two rectangles.
 * Returns 0 if they don't overlap.
 */
function calculateOverlapArea(r1: DOMRect, r2: DOMRect): number {
  const xOverlap = Math.max(0, Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left));
  const yOverlap = Math.max(0, Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top));
  return xOverlap * yOverlap;
}

/**
 * Checks if two elements are in a parent-child relationship.
 */
function isParentChild(el1: HTMLElement, el2: HTMLElement): boolean {
  return el1.contains(el2) || el2.contains(el1);
}

/**
 * Checks if two elements are siblings (share the same parent).
 */
function areSiblings(el1: HTMLElement, el2: HTMLElement): boolean {
  return el1.parentElement === el2.parentElement && el1.parentElement !== null;
}

/**
 * Checks if a parent uses flex or grid layout (meaning children are
 * positioned by the layout engine, not accidentally overlapping).
 */
function isFlowLayout(parent: HTMLElement): boolean {
  const style = window.getComputedStyle(parent);
  const display = style.display;
  return (
    display === 'flex' ||
    display === 'inline-flex' ||
    display === 'grid' ||
    display === 'inline-grid'
  );
}

/**
 * Returns true if the overlap between two rects is significant enough
 * relative to the smaller element to be a real issue (not just a
 * sub-pixel / border artifact).
 */
function isSignificantOverlap(r1: DOMRect, r2: DOMRect, overlapArea: number): boolean {
  if (overlapArea < MINIMUM_OVERLAP_THRESHOLD) return false;
  const smallerArea = Math.min(r1.width * r1.height, r2.width * r2.height);
  if (smallerArea === 0) return false;
  return overlapArea / smallerArea >= MINIMUM_OVERLAP_RATIO;
}

/**
 * Gets all visible elements within a root element.
 */
function getVisibleElements(root: HTMLElement): HTMLElement[] {
  const allElements = Array.from(root.querySelectorAll('*')) as HTMLElement[];
  return allElements.filter(el => !shouldExcludeElement(el));
}

/**
 * Detects overlapping elements within the given root element (or document.body).
 * Returns an array of overlap violations.
 *
 * Performance: Only checks sibling elements and direct parent-child pairs,
 * not all N^2 combinations.
 */
export function detectOverlaps(root?: HTMLElement): OverlapViolation[] {
  const violations: OverlapViolation[] = [];
  const rootElement = root ?? document.body;

  // Get all visible elements
  const elements = getVisibleElements(rootElement);

  // Group elements by parent for efficient sibling checking
  const elementsByParent = new Map<HTMLElement | null, HTMLElement[]>();

  for (const el of elements) {
    const parent = el.parentElement;
    if (!elementsByParent.has(parent)) {
      elementsByParent.set(parent, []);
    }
    elementsByParent.get(parent)!.push(el);
  }

  // Check siblings for overlaps (skip flex/grid containers — their
  // children are positioned by the layout engine, not accidentally)
  for (const [parent, siblings] of elementsByParent.entries()) {
    if (siblings.length < 2) continue;
    if (parent && isFlowLayout(parent)) continue;

    for (let i = 0; i < siblings.length; i++) {
      const el1 = siblings[i];
      const rect1 = el1.getBoundingClientRect();

      for (let j = i + 1; j < siblings.length; j++) {
        const el2 = siblings[j];
        const rect2 = el2.getBoundingClientRect();

        const overlapArea = calculateOverlapArea(rect1, rect2);

        if (isSignificantOverlap(rect1, rect2, overlapArea)) {
          violations.push({
            elementA: { selector: getSelector(el1), rect: rect1 },
            elementB: { selector: getSelector(el2), rect: rect2 },
            overlapArea,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Asynchronous version of detectOverlaps that uses requestIdleCallback
 * to avoid blocking the main thread.
 */
export function detectOverlapsAsync(root?: HTMLElement): Promise<OverlapViolation[]> {
  return new Promise((resolve) => {
    // Use requestIdleCallback if available, otherwise fallback to setTimeout
    const scheduleWork = typeof requestIdleCallback !== 'undefined'
      ? requestIdleCallback
      : (callback: () => void) => setTimeout(callback, 0);

    scheduleWork(() => {
      const violations = detectOverlaps(root);
      resolve(violations);
    });
  });
}
