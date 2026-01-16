/**
 * 壁纸 URL 工具函数
 *
 * 用于构建壁纸图片的 CDN URL,支持基于 cdnTag 的精准缓存控制
 */

import { CDN_VERSION } from './constants'

/**
 * 构建壁纸图片的 CDN URL
 *
 * @param {object} wallpaper - 壁纸对象
 * @param {string} wallpaper.cdnTag - 图片专属的 CDN tag (用于缓存优化)
 * @param {string} wallpaper.path - 图片路径
 * @param {string} wallpaper.thumbnailPath - 缩略图路径
 * @param {string} wallpaper.previewPath - 预览图路径
 * @param {string} type - URL 类型: 'original' | 'thumbnail' | 'preview'
 * @returns {string|null} CDN URL,如果不存在则返回 null
 */
export function getWallpaperUrl(wallpaper, type = 'original') {
  if (!wallpaper)
    return null

  // 使用图片专属的 cdnTag,如果没有则使用全局 CDN_VERSION
  const cdnTag = wallpaper.cdnTag || CDN_VERSION

  // 构建 CDN 基础 URL (使用图片专属 tag 实现精准缓存)
  const cdnBase = `https://cdn.jsdelivr.net/gh/IT-NuanxinPro/nuanXinProPic@${cdnTag}`

  switch (type) {
    case 'thumbnail':
      return wallpaper.thumbnailPath ? `${cdnBase}${wallpaper.thumbnailPath}` : null

    case 'preview':
      return wallpaper.previewPath ? `${cdnBase}${wallpaper.previewPath}` : null

    case 'original':
    default:
      return wallpaper.path ? `${cdnBase}${wallpaper.path}` : null
  }
}

/**
 * 批量获取壁纸 URL
 *
 * @param {Array<object>} wallpapers - 壁纸数组
 * @param {string} type - URL 类型
 * @returns {Array<string>} URL 数组
 */
export function getWallpaperUrls(wallpapers, type = 'original') {
  if (!Array.isArray(wallpapers))
    return []
  return wallpapers.map(w => getWallpaperUrl(w, type)).filter(Boolean)
}

/**
 * 预加载壁纸图片
 *
 * @param {object} wallpaper - 壁纸对象
 * @param {string} type - 图片类型
 * @returns {Promise<void>}
 */
export function preloadWallpaper(wallpaper, type = 'thumbnail') {
  return new Promise((resolve, reject) => {
    const url = getWallpaperUrl(wallpaper, type)
    if (!url) {
      reject(new Error('Invalid wallpaper URL'))
      return
    }

    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })
}

/**
 * 批量预加载壁纸图片
 *
 * @param {Array<object>} wallpapers - 壁纸数组
 * @param {string} type - 图片类型
 * @returns {Promise<void>}
 */
export async function preloadWallpapers(wallpapers, type = 'thumbnail') {
  if (!Array.isArray(wallpapers))
    return

  const promises = wallpapers.map(w => preloadWallpaper(w, type).catch(() => {}))
  await Promise.all(promises)
}
