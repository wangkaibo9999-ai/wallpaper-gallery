import antfu from '@antfu/eslint-config'

export default antfu({
  // 启用 Vue 支持
  vue: true,

  // 启用格式化器（替代 Prettier）
  formatters: true,

  // 代码风格配置
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },

  // 忽略文件
  ignores: [
    'dist',
    'node_modules',
    'public',
    'tests',
    'docs',
    '*.md',
    '.claude/**',
    '.spec-workflow/**',
    '.github/**',
    '.husky/**',
    'auto-imports.d.ts',
    'components.d.ts',
  ],
  rules: {
    'no-console': 'off',
    'no-debugger': 'off',
    'jsdoc/require-returns-description': 'off',
  },
})
