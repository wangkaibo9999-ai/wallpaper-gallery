/**
 * 真机模式状态管理（简化版）
 * 只用一个布尔值 + 动画锁，避免复杂的状态机
 */
import { ref } from 'vue'

export function useDeviceMode() {
  const isDeviceMode = ref(false)
  const isAnimating = ref(false)

  /**
   * 进入真机模式
   * @returns {boolean} 是否成功触发
   */
  function enter() {
    if (isAnimating.value || isDeviceMode.value)
      return false
    isAnimating.value = true
    isDeviceMode.value = true
    return true
  }

  /**
   * 退出真机模式
   * @returns {boolean} 是否成功触发
   */
  function exit() {
    if (isAnimating.value || !isDeviceMode.value)
      return false
    isAnimating.value = true
    isDeviceMode.value = false
    return true
  }

  /**
   * 动画完成回调
   */
  function onAnimationEnd() {
    isAnimating.value = false
  }

  /**
   * 切换模式
   */
  function toggle() {
    if (isDeviceMode.value) {
      return exit()
    }
    return enter()
  }

  /**
   * 强制重置（用于组件卸载或异常恢复）
   */
  function reset() {
    isDeviceMode.value = false
    isAnimating.value = false
  }

  return {
    isDeviceMode,
    isAnimating,
    enter,
    exit,
    toggle,
    onAnimationEnd,
    reset,
  }
}
