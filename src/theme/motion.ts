export const SPRING = {
  snappy: { type: 'spring' as const, stiffness: 400, damping: 25 },
  entrance: { type: 'spring' as const, stiffness: 300, damping: 28, mass: 0.8 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 25 },
  value: { type: 'spring' as const, stiffness: 80, damping: 20, mass: 0.8 },
};
