/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'warn',
      comment: 'Circular dependencies break refactoring and can hide runtime bugs.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'utils-no-components',
      severity: 'warn',
      comment: 'Utils should stay pure and avoid depending on React components.',
      from: { path: '^src/utils/' },
      to: { path: '^src/components/' },
    },
    {
      name: 'services-no-components',
      severity: 'warn',
      comment: 'Services should not import UI components.',
      from: { path: '^src/services/' },
      to: { path: '^src/components/' },
    },
    {
      name: 'utils-no-hooks',
      severity: 'warn',
      comment: 'Utils should not depend on React hooks.',
      from: { path: '^src/utils/' },
      to: { path: '^src/hooks/' },
    },
    {
      name: 'services-no-hooks',
      severity: 'warn',
      comment: 'Services should not depend on React hooks.',
      from: { path: '^src/services/' },
      to: { path: '^src/hooks/' },
    },
    {
      name: 'no-orphan-modules',
      severity: 'warn',
      comment: 'Potentially dead files should be surfaced before they accumulate.',
      from: {
        orphan: true,
        pathNot: ['\\.d\\.ts$', '\\.test\\.', '\\.spec\\.', '\\.stories\\.', 'index\\.tsx?$'],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: {
      path: '(^node_modules|\\.stories\\.|\\.test\\.|\\.spec\\.)',
    },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
