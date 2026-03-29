// eslint.config.js — TripFrame workspace ESLint 설정 (TASK-086)
// ESLint v9 flat config format

import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

/** @type {import('eslint').Linter.Config[]} */
export default [
  // ─── 공통 무시 패턴 ───────────────────────────────────────────
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/e2e/**',
      '**/*.config.js',
      '**/*.config.ts',
    ],
  },

  // ─── TypeScript 소스 파일 ─────────────────────────────────────
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      // Constitution Article V-1: no `any`
      '@typescript-eslint/no-explicit-any': 'error',

      // Constitution Article V-2: 단일 함수 ≤ 50줄
      'max-lines-per-function': [
        'warn',
        {
          max: 50,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],

      // Constitution Article IV: Redux/moment/axios 사용 금지
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['redux', '@reduxjs/*', 'react-redux'],
              message: 'Redux is forbidden. Use Zustand (Constitution Article IV).',
            },
            {
              group: ['moment', 'moment-timezone'],
              message: 'moment is forbidden. Use date-fns (Constitution Article IV).',
            },
            {
              group: ['axios'],
              message: 'axios is forbidden. Use fetch API.',
            },
            {
              // Constitution Article VIII: 평문 AsyncStorage 직접 사용 금지
              group: ['@react-native-async-storage/async-storage'],
              message:
                'Direct AsyncStorage use is forbidden. Use encryptedStorage wrapper (Constitution Article VIII).',
            },
          ],
        },
      ],

      // 기본 TypeScript 권장 규칙 (오류 방지)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
]
