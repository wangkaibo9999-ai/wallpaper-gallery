// ========================================
// 弹窗控制 Composable
// ========================================

import { onMounted, onUnmounted, ref } from 'vue'

export function useModal() {
  const isOpen = ref(false)
  const currentData = ref(null)

  // 打开弹窗
  const open = (data = null) => {
    currentData.value = data
    isOpen.value = true
    // 禁止背景滚动
    document.body.style.overflow = 'hidden'
  }

  // 关闭弹窗
  const close = () => {
    isOpen.value = false
    // 恢复背景滚动
    document.body.style.overflow = ''
  }

  // 切换弹窗
  const toggle = (data = null) => {
    if (isOpen.value) {
      close()
    }
    else {
      open(data)
    }
  }

  // 更新当前数据（用于切换图片）
  const updateData = (data) => {
    currentData.value = data
  }

  // 键盘事件处理
  const handleKeydown = (e) => {
    if (!isOpen.value)
      return

    switch (e.key) {
      case 'Escape':
        close()
        break
    }
  }

  // 监听键盘事件
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
    // 确保恢复滚动
    document.body.style.overflow = ''
  })

  return {
    isOpen,
    currentData,
    open,
    close,
    toggle,
    updateData,
  }
}
