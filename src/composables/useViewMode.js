// ========================================
// 视图模式管理 Composable
// ========================================

import { ref } from 'vue'
import { trackViewModeChange } from '@/utils/analytics'
import { STORAGE_KEYS } from '@/utils/constants'

// 简单的移动端检测（用于初始默认值，包括平板）
function isMobileOrTabletDevice() {
  if (typeof window === 'undefined')
    return false
  return window.innerWidth < 1024 // 手机+平板都算移动端
}

// 获取默认视图模式
function getDefaultViewMode() {
  const stored = localStorage.getItem(STORAGE_KEYS.VIEW_MODE)
  if (stored) {
    // 如果是移动端且存储的是 masonry，则使用 grid（移动端不再支持瀑布流）
    if (isMobileOrTabletDevice() && stored === 'masonry') {
      return 'grid'
    }
    return stored
  }
  // 没有存储值时，默认都使用 grid
  return 'grid'
}

const viewMode = ref(getDefaultViewMode())

export function useViewMode() {
  const setViewMode = (mode) => {
    const oldMode = viewMode.value
    viewMode.value = mode
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode)

    // 追踪视图模式切换事件
    if (oldMode !== mode) {
      trackViewModeChange(mode)
    }
  }

  // 视图模式选项
  const viewModeOptions = [
    { value: 'grid', icon: 'grid', label: '网格' },
    { value: 'list', icon: 'list', label: '列表' },
    { value: 'masonry', icon: 'masonry', label: '瀑布流' },
  ]

  return {
    viewMode,
    setViewMode,
    viewModeOptions,
  }
}
