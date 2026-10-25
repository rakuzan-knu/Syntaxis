import { HERO_PATH, ROOT } from './fileSystem';

export interface ShellContext {
  modified: boolean;
  errors: number;
  warnings: number;
}

export type ShellResult = { clear: true } | { clear: false; output: string[] };

const HELP = [
  'Available commands:',
  '  ls            list project files',
  '  git status    show changed files',
  '  pnpm lint     run ESLint',
  '  pnpm test     run unit tests',
  '  pnpm build    production build',
  '  clear         clear the terminal',
];

export function runCommand(input: string, context: ShellContext): ShellResult {
  const command = input.trim().replace(/\s+/g, ' ');
  switch (command) {
    case '':
      return { clear: false, output: [] };
    case 'clear':
    case 'cls':
      return { clear: true };
    case 'help':
      return { clear: false, output: HELP };
    case 'ls':
      return {
        clear: false,
        output: [
          ROOT.children
            .map((node) => (node.kind === 'folder' ? `${node.name}/` : node.name))
            .join('  '),
        ],
      };
    case 'git status':
      return {
        clear: false,
        output: context.modified
          ? ['On branch main', 'Changes not staged for commit:', `        modified:   ${HERO_PATH}`]
          : ['On branch main', 'nothing to commit, working tree clean'],
      };
    case 'pnpm lint':
    case 'npm run lint':
      return {
        clear: false,
        output:
          context.errors + context.warnings === 0
            ? ['> eslint .', '', '✔ No problems found']
            : [
                '> eslint .',
                '',
                `✖ ${context.errors + context.warnings} problems (${context.errors} errors, ${context.warnings} warnings)`,
              ],
      };
    case 'pnpm test':
    case 'npm test':
      return {
        clear: false,
        output: [
          '> vitest run',
          '',
          ' ✓ src/widgets/hero/Hero.test.tsx (4 tests) 38ms',
          '',
          ' Test Files  1 passed (1)',
          '      Tests  4 passed (4)',
        ],
      };
    case 'pnpm build':
    case 'npm run build':
      return {
        clear: false,
        output:
          context.errors > 0
            ? [
                '> tsc -b && vite build',
                '',
                `✖ Build failed: ${context.errors} lint error(s) in ${HERO_PATH}`,
              ]
            : [
                '> tsc -b && vite build',
                'vite v8.3.5 building for production...',
                '✓ 41 modules transformed.',
                'dist/index.html            0.62 kB',
                'dist/assets/index.js      61.40 kB │ gzip: 19.87 kB',
                '✓ built in 812ms',
              ],
      };
    default:
      return {
        clear: false,
        output: [
          `${command.split(' ')[0]}: command not found. Type "help" for the list of commands.`,
        ],
      };
  }
}
