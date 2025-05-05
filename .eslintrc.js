module.exports = {
    root: true,
    env: {
      node: true,
      browser: true,
      es2021: true
    },
    extends: [
      'plugin:vue/vue3-recommended',
      'eslint:recommended'
    ],
    parserOptions: {
      parser: '@babel/eslint-parser',
      requireConfigFile: false,
      ecmaVersion: 2021,
      sourceType: 'module'
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-case-declarations': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'vue/no-parsing-error': ['error', {
        'x-invalid-end-tag': false
      }],
      'vue/valid-template-root': 'off',
      'vue/no-v-model-argument': 'off',
      'vue/no-mutating-props': 'off',
      'vue/no-v-for-template-key': 'off',
      'vue/no-unused-vars': 'off',
      'vue/no-type-assertions': 'off',
      'vue/no-non-null-assertion': 'off',
      'vue/no-template-type-annotations': 'off',
      'vue/no-ts-type-assertions': 'off',
      'vue/multi-word-component-names': 'off'
    }
  }