import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'dist-ssr', 'coverage', '.eslintcache', 'public']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strict,
      reactHooks.configs.flat['recommended-latest'],
    ],
    plugins: {
      'react-refresh': reactRefresh,
      boundaries,
    },
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.app.json' },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app/**/*' },
        { type: 'pages', pattern: 'src/pages/*', capture: ['slice'] },
        { type: 'widgets', pattern: 'src/widgets/*', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*', capture: ['slice'] },
        { type: 'entities', pattern: 'src/entities/*', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared/**/*' },
      ],
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: [
                { to: { element: { type: 'app' } } },
                { to: { element: { type: 'pages' } } },
                { to: { element: { type: 'widgets' } } },
                { to: { element: { type: 'features' } } },
                { to: { element: { type: 'entities' } } },
                { to: { element: { type: 'shared' } } },
              ],
            },
            {
              from: { element: { type: 'pages' } },
              allow: [
                { to: { element: { type: 'widgets' } } },
                { to: { element: { type: 'features' } } },
                { to: { element: { type: 'entities' } } },
                { to: { element: { type: 'shared' } } },
                { to: { element: { type: 'pages', captured: { slice: '{{from.slice}}' } } } },
              ],
            },
            {
              from: { element: { type: 'widgets' } },
              allow: [
                { to: { element: { type: 'features' } } },
                { to: { element: { type: 'entities' } } },
                { to: { element: { type: 'shared' } } },
                { to: { element: { type: 'widgets', captured: { slice: '{{from.slice}}' } } } },
              ],
            },
            {
              from: { element: { type: 'features' } },
              allow: [
                { to: { element: { type: 'entities' } } },
                { to: { element: { type: 'shared' } } },
                { to: { element: { type: 'features', captured: { slice: '{{from.slice}}' } } } },
              ],
            },
            {
              from: { element: { type: 'entities' } },
              allow: [
                { to: { element: { type: 'shared' } } },
                { to: { element: { type: 'entities', captured: { slice: '{{from.slice}}' } } } },
              ],
            },
            {
              from: { element: { type: 'shared' } },
              allow: [{ to: { element: { type: 'shared' } } }],
            },
          ],
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^@/(pages|widgets|features|entities)/[^/]+/.+',
              message: 'Import slices through their public index.ts.',
            },
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['vite.config.ts', 'eslint.config.ts', 'scripts/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
]);
