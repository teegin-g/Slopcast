export type IdFactory = () => string | number;

const defaultIdFactory: IdFactory = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now();
};

export const createLocalId = (prefix: string, idFactory: IdFactory = defaultIdFactory): string =>
  `${prefix}-${idFactory()}`;
