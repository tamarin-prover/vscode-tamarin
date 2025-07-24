module.exports = {
  root: true, 
  parser: '@typescript-eslint/parser', 
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended', 
    'plugin:@typescript-eslint/recommended', 
  ],
  env: {
    node: true, 
    es2021: true,
  },
  rules: {
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
  },
};