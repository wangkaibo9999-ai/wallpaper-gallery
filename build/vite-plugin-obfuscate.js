/**
 * Vite 选择性混淆插件
 * 只对指定文件进行 JavaScript 混淆
 */
import JavaScriptObfuscator from 'javascript-obfuscator'

/**
 * @param {object} options - 插件配置
 * @param {string[]} options.include - 要混淆的文件路径模式
 * @param {object} options.obfuscatorOptions - javascript-obfuscator 配置
 */
export function obfuscatePlugin(options = {}) {
  const { include = [], obfuscatorOptions = {} } = options

  // 默认混淆配置
  const defaultOptions = {
    compact: true,
    // 字符串加密
    stringArray: true,
    stringArrayThreshold: 0.8,
    stringArrayEncoding: ['base64'],
    stringArrayRotate: true,
    stringArrayShuffle: true,
    // 标识符混淆
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,
    // 轻量配置（避免性能问题）
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    selfDefending: false,
  }

  return {
    name: 'vite-plugin-selective-obfuscate',
    apply: 'build',
    enforce: 'post',

    transform(code, id) {
      // 只处理匹配的文件
      const shouldObfuscate = include.some(pattern => id.includes(pattern))
      if (!shouldObfuscate)
        return null

      // 合并配置
      const finalOptions = { ...defaultOptions, ...obfuscatorOptions }

      // 混淆代码
      const result = JavaScriptObfuscator.obfuscate(code, finalOptions)

      return {
        code: result.getObfuscatedCode(),
        map: null,
      }
    },
  }
}

export default obfuscatePlugin
