import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const legacyTypesFile = join(root, 'src', 'types.ts');

if (existsSync(legacyTypesFile)) {
  console.error('src/types.ts is retired. Add domain types under src/types/* and export them from src/types/index.ts.');
  process.exit(1);
}

console.log('Type boundaries OK: src/types/index.ts is the public type barrel.');
