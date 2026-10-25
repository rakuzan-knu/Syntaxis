import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'chore', 'docs', 'style', 'test', 'perf', 'ci', 'revert'],
    ],
    'scope-enum': [
      1,
      'always',
      ['web', 'design', 'seo', 'i18n', 'content', 'infra', 'deps', 'security'],
    ],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 200],
    'subject-case': [0],
  },
};

export default config;
