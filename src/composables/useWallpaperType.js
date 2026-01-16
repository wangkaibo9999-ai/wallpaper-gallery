// ========================================
// 壁纸系列类型管理 Composable (桥接到 Pinia Store)
// ========================================

import { storeToRefs } from 'pinia'
import { useSeriesStore } from '@/stores/series'

/**
 * 壁纸系列类型管理（桥接到 Pinia Store）
 * @deprecated 建议直接使用 useSeriesStore()，此 composable 仅为向后兼容保留
 */
export function useWallpaperType() {
  const seriesStore = useSeriesStore()

  // 使用 storeToRefs 保持响应式
  const {
    currentSeries,
    deviceType,
    availableSeries,
    currentSeriesConfig,
    availableSeriesOptions,
  } = storeToRefs(seriesStore)

  // 暴露 actions
  const { initSeries, initFromRoute, switchSeries, isSeriesAvailable } = seriesStore

  // 兼容旧 API
  const wallpaperType = currentSeries
  const setWallpaperType = switchSeries
  const setCurrentSeries = switchSeries
  const currentDataUrl = currentSeriesConfig

  return {
    // 新 API (推荐)
    currentSeries,
    deviceType,
    availableSeries,
    availableSeriesOptions,
    currentSeriesConfig,
    currentDataUrl,
    setCurrentSeries,
    initFromRoute,
    isSeriesAvailable,
    initSeries,
    switchSeries,

    // 兼容旧 API
    wallpaperType,
    setWallpaperType,
  }
}
