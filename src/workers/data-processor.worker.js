/* eslint-disable no-restricted-globals */
// ========================================
// Web Worker: 数据处理（解密 + 排序）
// ========================================

// 字符映射表（解码用）
const CHAR_MAP_DECODE = {
  'Q': 'A',
  'W': 'B',
  'E': 'C',
  'R': 'D',
  'T': 'E',
  'Y': 'F',
  'U': 'G',
  'I': 'H',
  'O': 'I',
  'P': 'J',
  'A': 'K',
  'S': 'L',
  'D': 'M',
  'F': 'N',
  'G': 'O',
  'H': 'P',
  'J': 'Q',
  'K': 'R',
  'L': 'S',
  'Z': 'T',
  'X': 'U',
  'C': 'V',
  'V': 'W',
  'B': 'X',
  'N': 'Y',
  'M': 'Z',
  'q': 'a',
  'w': 'b',
  'e': 'c',
  'r': 'd',
  't': 'e',
  'y': 'f',
  'u': 'g',
  'i': 'h',
  'o': 'i',
  'p': 'j',
  'a': 'k',
  's': 'l',
  'd': 'm',
  'f': 'n',
  'g': 'o',
  'h': 'p',
  'j': 'q',
  'k': 'r',
  'l': 's',
  'z': 't',
  'x': 'u',
  'c': 'v',
  'v': 'w',
  'b': 'x',
  'n': 'y',
  'm': 'z',
  '5': '0',
  '6': '1',
  '7': '2',
  '8': '3',
  '9': '4',
  '0': '5',
  '1': '6',
  '2': '7',
  '3': '8',
  '4': '9',
  '-': '+',
  '_': '/',
  '.': '=',
}

const VERSION_PREFIX = 'v1.'

/**
 * 解码数据
 */
function decodeData(encoded) {
  if (!encoded.startsWith(VERSION_PREFIX)) {
    throw new Error('Invalid data format')
  }
  const reversed = encoded.slice(VERSION_PREFIX.length).split('').reverse().join('')
  const base64 = reversed.split('').map(c => CHAR_MAP_DECODE[c] || c).join('')
  return decodeURIComponent(escape(atob(base64)))
}

/**
 * 排序函数集合
 */
const sortFunctions = {
  // 按日期排序
  sortByDate: (wallpapers, order = 'desc') => {
    return [...wallpapers].sort((a, b) => {
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return order === 'desc' ? dateB - dateA : dateA - dateB
    })
  },

  // 按热度排序
  sortByPopularity: (wallpapers, popularityMap) => {
    const map = new Map(popularityMap)
    return [...wallpapers].sort((a, b) => {
      const scoreA = map.get(a.filename)?.score || 0
      const scoreB = map.get(b.filename)?.score || 0
      if (scoreB === scoreA) {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      return scoreB - scoreA
    })
  },

  // 按下载量排序
  sortByDownloads: (wallpapers, popularityMap) => {
    const map = new Map(popularityMap)
    return [...wallpapers].sort((a, b) => {
      const countA = map.get(a.filename)?.downloads || 0
      const countB = map.get(b.filename)?.downloads || 0
      if (countB === countA) {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      return countB - countA
    })
  },

  // 按浏览量排序
  sortByViews: (wallpapers, popularityMap) => {
    const map = new Map(popularityMap)
    return [...wallpapers].sort((a, b) => {
      const countA = map.get(a.filename)?.views || 0
      const countB = map.get(b.filename)?.views || 0
      if (countB === countA) {
        return new Date(b.createdAt) - new Date(a.createdAt)
      }
      return countB - countA
    })
  },

  // 按大小排序
  sortBySize: (wallpapers, order = 'desc') => {
    return [...wallpapers].sort((a, b) => {
      return order === 'desc' ? b.size - a.size : a.size - b.size
    })
  },

  // 按文件名排序
  sortByName: (wallpapers, order = 'asc') => {
    return [...wallpapers].sort((a, b) => {
      return order === 'asc'
        ? a.filename.localeCompare(b.filename)
        : b.filename.localeCompare(a.filename)
    })
  },
}

/**
 * 筛选 + 排序批量处理
 */
function processFilterAndSort(data) {
  const { wallpapers, filters, sortMethod, popularityMap } = data
  let result = [...wallpapers]

  // 应用搜索过滤
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase()
    result = result.filter(w =>
      w.filename.toLowerCase().includes(query)
      || w.category?.toLowerCase().includes(query)
      || w.subcategory?.toLowerCase().includes(query)
      || (w.tags && w.tags.some(tag => tag.toLowerCase().includes(query))),
    )
  }

  // 应用格式过滤
  if (filters.formatFilter && filters.formatFilter !== 'all') {
    result = result.filter(w =>
      w.format.toLowerCase() === filters.formatFilter.toLowerCase(),
    )
  }

  // 应用一级分类过滤
  if (filters.categoryFilter && filters.categoryFilter !== 'all') {
    result = result.filter(w => w.category === filters.categoryFilter)
  }

  // 应用二级分类过滤
  if (filters.subcategoryFilter && filters.subcategoryFilter !== 'all') {
    result = result.filter(w => w.subcategory === filters.subcategoryFilter)
  }

  // 应用排序
  switch (sortMethod) {
    case 'newest':
      result = sortFunctions.sortByDate(result, 'desc')
      break
    case 'oldest':
      result = sortFunctions.sortByDate(result, 'asc')
      break
    case 'popular':
    case 'weekly-hot':
    case 'monthly-hot':
      result = sortFunctions.sortByPopularity(result, popularityMap)
      break
    case 'downloads':
      result = sortFunctions.sortByDownloads(result, popularityMap)
      break
    case 'views':
      result = sortFunctions.sortByViews(result, popularityMap)
      break
    case 'largest':
      result = sortFunctions.sortBySize(result, 'desc')
      break
    case 'smallest':
      result = sortFunctions.sortBySize(result, 'asc')
      break
    case 'name-asc':
      result = sortFunctions.sortByName(result, 'asc')
      break
    case 'name-desc':
      result = sortFunctions.sortByName(result, 'desc')
      break
  }

  return result
}

/**
 * 处理消息
 */
self.onmessage = function (e) {
  const { type, id, data } = e.data

  try {
    let result

    switch (type) {
      case 'decode': {
        // 解码数据
        result = decodeData(data.encoded)
        break
      }
      case 'decodeAndParse': {
        // 解码并解析 JSON
        const decoded = decodeData(data.encoded)
        result = JSON.parse(decoded)
        break
      }
      case 'sort': {
        // 排序数据
        const { method, wallpapers, options } = data
        const sortFn = sortFunctions[method]
        if (!sortFn) {
          throw new Error(`Unknown sort method: ${method}`)
        }
        result = sortFn(wallpapers, options)
        break
      }
      case 'filterAndSort': {
        // 筛选 + 排序（批量处理）
        result = processFilterAndSort(data)
        break
      }
      default:
        throw new Error(`Unknown message type: ${type}`)
    }

    // 返回成功结果
    self.postMessage({ id, success: true, result })
  }
  catch (error) {
    // 返回错误
    self.postMessage({ id, success: false, error: error.message })
  }
}
