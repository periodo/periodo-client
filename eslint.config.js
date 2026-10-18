"use strict";

const js = require('@eslint/js')
    , globals = require('globals')
    , stylistic = require('@stylistic/eslint-plugin')

module.exports = [
  {
    ignores: [
      'dist/',
      'periodo-client.js',
      'modules/periodo-date-parser/parser.js',
    ],
  },

  js.configs.recommended,

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      'curly': [ 'error', 'multi-line' ],
      'no-unused-vars': [ 'error', { caughtErrors: 'none' }],
      'preserve-caught-error': 'off',
      'no-use-before-define': [ 'error', 'nofunc' ],
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': [ 'error', { allowNamedFunctions: true }],
      'prefer-const': 'error',
      'prefer-spread': 'error',
      'prefer-object-spread': 'error',

      '@stylistic/array-bracket-newline': [ 'error', 'consistent' ],
      '@stylistic/array-bracket-spacing': [ 'error', 'always', {
        objectsInArrays: false,
        arraysInArrays: false,
      }],
      '@stylistic/comma-dangle': [ 'error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
      }],
      '@stylistic/comma-style': [ 'error', 'last', {
        exceptions: { VariableDeclaration: true },
      }],
      '@stylistic/indent': [ 'error', 2, {
        SwitchCase: 0,
        MemberExpression: 'off',
        ignoreComments: true,
        ignoredNodes: [ 'VariableDeclaration' ],
      }],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/object-curly-newline': [ 'error', {
        ObjectExpression: {
          multiline: true,
          minProperties: 3,
          consistent: true,
        },
      }],
      '@stylistic/object-curly-spacing': [ 'error', 'always', {
        objectsInObjects: false,
        arraysInObjects: false,
      }],
      '@stylistic/object-property-newline': 'error',
    },
  },

  // Fixture data with braces on their own lines, which the old core
  // indent rule accepted but @stylistic/indent does not
  {
    files: [ 'modules/periodo-app/src/main/example-data.js' ],
    rules: {
      '@stylistic/indent': 'off',
    },
  },

  // Older module with its own, looser style
  {
    files: [ 'modules/periodo-date-parser/**/*.js' ],
    languageOptions: {
      ecmaVersion: 2017,
    },
    rules: {
      'prefer-arrow-callback': 'error',
      'prefer-object-spread': 'off',
      '@stylistic/array-bracket-newline': 'off',
      '@stylistic/array-bracket-spacing': 'off',
      '@stylistic/comma-dangle': 'off',
      '@stylistic/comma-style': 'off',
      '@stylistic/indent': 'off',
      '@stylistic/no-trailing-spaces': 'off',
      '@stylistic/object-curly-newline': 'off',
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/object-property-newline': 'off',
    },
  },
]
