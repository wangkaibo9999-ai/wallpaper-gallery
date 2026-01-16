// ========================================
// 全局搜索状态 Composable (桥接到 Pinia Store)
// ========================================

import { storeToRefs } from 'pinia'
import { useFilterStore } from '@/stores/filter'
import { useWallpaperStore } from '@/stores/wallpaper'

/**
 * 全局搜索状态（桥接到 Pinia Store）
 * @deprecated 建议直接使用 useFilterStore() 和 useWallpaperStore()
 */
export function useSearch() {
  const filterStore = useFilterStore()
  const wallpaperStore = useWallpaperStore()

  // 搜索关键词从 filterStore 获取
  const { searchQuery } = storeToRefs(filterStore)

  // 壁纸数据从 wallpaperStore 获取
  const { wallpapers } = storeToRefs(wallpaperStore)

  // 兼容旧 API：setWallpapers（现在不需要手动设置）
  const setWallpapers = (_data) => {
    // 不再需要手动设置，数据由 Store 管理
    console.warn('setWallpapers is deprecated, data is now managed by WallpaperStore')
  }

  // 清除搜索
  const clearSearch = () => {
    searchQuery.value = ''
  }

  return {
    searchQuery,
    wallpapers,
    setWallpapers,
    clearSearch,
  }
}
