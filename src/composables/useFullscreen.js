// ========================================
// 全屏浏览模式 Composable
// ========================================

import { onMounted, onUnmounted, ref } from 'vue'

const isFullscreen = ref(false)

export function useFullscreen() {
  const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value
    document.body.classList.toggle('fullscreen-mode', isFullscreen.value)
  }

  const exitFullscreen = () => {
    isFullscreen.value = false
    document.body.classList.remove('fullscreen-mode')
  }

  // ESC 键退出全屏
  const handleKeydown = (e) => {
    if (e.key === 'Escape' && isFullscreen.value) {
      exitFullscreen()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    isFullscreen,
    toggleFullscreen,
    exitFullscreen,
  }
}
