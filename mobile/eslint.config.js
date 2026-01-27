const tsParser = require('@typescript-eslint/parser');
const boundaries = require('eslint-plugin-boundaries');
const importPlugin = require('eslint-plugin-import');

module.exports = [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      boundaries,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/ignore': ['**/*.d.ts'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**' },
        { type: 'core', pattern: 'src/core/**' },
        { type: 'config', pattern: 'src/config/**' },
        { type: 'shared', pattern: 'src/shared/**' },
        { type: 'assets', pattern: 'src/assets/**' },
        { type: 'feature', pattern: 'src/features/*/**', capture: ['featureName'] },
      ],
    },
    rules: {
      'boundaries/no-unknown': 'error',
      'boundaries/no-unknown-files': 'error',
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: ['feature'],
              disallow: [['feature', { featureName: '!${from.featureName}' }]],
              allow: ['feature', 'shared', 'core', 'app', 'config', 'assets'],
            },
          ],
        },
      ],
    },
  },
];
