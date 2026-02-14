export interface LocalAccount {
  id: string;
  displayName: string;
  email: string;
  createdAt: string;
  lastActiveAt: string;
}

const STORAGE_KEY = 'slopcast-account';

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `acct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildDefaultAccount(): LocalAccount {
  const now = new Date().toISOString();
  return {
    id: makeId(),
    displayName: 'Field Operator',
    email: 'operator@slopcast.local',
    createdAt: now,
    lastActiveAt: now,
  };
}

function isValidAccount(value: unknown): value is LocalAccount {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.displayName === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.lastActiveAt === 'string'
  );
}

function writeAccount(account: LocalAccount): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  } catch {
    // Ignore storage failures (private mode / blocked storage).
  }
}

export function getAccount(): LocalAccount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidAccount(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function initializeAccountIfMissing(): LocalAccount {
  const existing = getAccount();
  if (existing) return existing;
  const created = buildDefaultAccount();
  writeAccount(created);
  return created;
}

export function updateLastActive(): LocalAccount {
  const base = initializeAccountIfMissing();
  const updated: LocalAccount = {
    ...base,
    lastActiveAt: new Date().toISOString(),
  };
  writeAccount(updated);
  return updated;
}
