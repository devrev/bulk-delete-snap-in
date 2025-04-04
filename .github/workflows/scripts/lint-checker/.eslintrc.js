module.exports = {
  extends: 'airbnb-typescript/base',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Makes ESLint and Prettier play nicely together
    'plugin:import/recommended',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['prettier', 'unused-imports', 'import', 'simple-import-sort', 'sort-keys-fix'],
  ignorePatterns: ['**/.eslint*.js', 'fixtures/'],
  root: true,
  rules: {
    'import/first': 'error', // Ensures all imports are at the top of the file
    'import/newline-after-import': 'error', // Ensures there’s a newline after the imports
    'import/no-duplicates': 'error', // Merges import statements from the same file
    'import/no-unresolved': 'off', // Handled by dependency-check script, disabling given this expects dependencies to be installed
    'import/order': 'off', // Not compatible with simple-import-sort
    'no-unused-vars': 'off', // Handled by @typescript-eslint/no-unused-vars
    'simple-import-sort/exports': 'error', // Auto-formats exports
    'simple-import-sort/imports': 'error', // Auto-formats imports
    'sort-imports': 'off', // Not compatible with simple-import-sort
    'sort-keys-fix/sort-keys-fix': ['error', 'asc', { natural: true }], // Sorts long object key lists alphabetically
    'unused-imports/no-unused-imports': 'error', // Removes unused imports automatically
    '@typescript-eslint/no-explicit-any': 'warn', // Allows any type with a warning
    'no-hardcoded-endpoint': ['error', ["api.devrev.ai","api.dev.devrev-eng.ai","api.qa.devrev-eng.ai"]], // Disallows string literals matching 'api.devrev.ai*'
  },
  overrides:[{
    "files": ["**/*.test.ts", "**/test_data/**/*.ts"],
    "rules": {
      "no-hardcoded-endpoint": "off",
      'simple-import-sort/imports': 'off', // for test files we would want to load the mocked up modules later so on sorting the mocking mechanism will not work
    }
  }]
};
