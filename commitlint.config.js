module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'update',
        'improve',
        'refactor',
        'docs',
        'chore',
        'style',
        'test',
        'revert',
        'ci',
        'build',
        'perf',
        'config',
        'init',
        'i18n',
        'data',
        'security',
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 72],
  },
};
