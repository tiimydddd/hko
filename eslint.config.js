import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'app/**/*', 'gradle/**/*', 'node_modules/**/*', 'firestore.test.js']
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ...js.configs.recommended,
  },
  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ['src/**/*.{ts,tsx}']
  })),
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  firebaseRulesPlugin.configs['flat/recommended']
];
