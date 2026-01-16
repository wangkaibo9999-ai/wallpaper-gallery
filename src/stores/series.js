// ========================================
// 系列管理 Store
// ========================================

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { detectDevice } from '@/composables/useDevice'
import { DEFAULT_SERIES, DEVICE_SERIES, SERIES_CONFIG, STORAGE_KEYS } from '@/utils/constants'

export const useSeriesStore = defineStore('series', () => {
  // ========================================
  // State
  // ========================================
  const currentSeries = ref(null)

  // ========================================
  // Getters
  // ========================================

  // 当前设备类型（mobile / tablet / desktop）
  const deviceType = computed(() => detectDevice())

  // 当前设备可用的系列列表
  const availableSeries = computed(() => {
    return DEVICE_SERIES[deviceType.value] || DEVICE_SERIES.desktop
  })

  // 当前系列配置
  const currentSeriesConfig = computed(() => {
    return currentSeries.value ? SERIES_CONFIG[currentSeries.value] : null
  })

  // 可用系列选项（用于导航）
  const availableSeriesOptions = computed(() => {
    return availableSeries.value.map(seriesId => SERIES_CONFIG[seriesId])
  })

  // ========================================
  // Actions
  // ========================================

  /**
   * 初始化系列（从 localStorage 或设备类型推断）
   */
  function initSeries() {
    // 1. 尝试从 localStorage 恢复
    const savedSeries = localStorage.getItem(STORAGE_KEYS.CURRENT_SERIES)
    if (savedSeries && availableSeries.value.includes(savedSeries)) {
      currentSeries.value = savedSeries
      return savedSeries
    }

    // 2. 使用设备默认系列
    const device = deviceType.value
    const defaultSeries = DEFAULT_SERIES[device] || 'desktop'
    currentSeries.value = defaultSeries
    return defaultSeries
  }

  /**
   * 从路由初始化系列
   * @param {string} seriesId - 路由中的系列ID
   */
  function initFromRoute(seriesId) {
    if (seriesId && availableSeries.value.includes(seriesId)) {
      currentSeries.value = seriesId
      // 保存到 localStorage
      localStorage.setItem(STORAGE_KEYS.CURRENT_SERIES, seriesId)
    }
  }

  /**
   * 切换系列
   * @param {string} seriesId - 目标系列ID
   */
  function switchSeries(seriesId) {
    if (!availableSeries.value.includes(seriesId)) {
      console.warn(`Series ${seriesId} is not available for current device`)
      return false
    }

    currentSeries.value = seriesId
    localStorage.setItem(STORAGE_KEYS.CURRENT_SERIES, seriesId)
    return true
  }

  /**
   * 检查系列是否对当前设备可用
   * @param {string} seriesId - 系列ID
   */
  function isSeriesAvailable(seriesId) {
    return availableSeries.value.includes(seriesId)
  }

  return {
    // State
    currentSeries,
    // Getters
    deviceType,
    availableSeries,
    currentSeriesConfig,
    availableSeriesOptions,
    // Actions
    initSeries,
    initFromRoute,
    switchSeries,
    isSeriesAvailable,
  }
})
