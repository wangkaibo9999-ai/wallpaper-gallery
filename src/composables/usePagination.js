// ========================================
// 传统分页 Composable
// ========================================

import { computed, ref, watch } from 'vue'

export function usePagination(items, initialPageSize = 30) {
  const currentPage = ref(1)
  const pageSize = ref(initialPageSize)
  const isPaused = ref(false) // 暂停分页切换（动画期间使用）

  // 总页数
  const totalPages = computed(() => Math.ceil(items.value.length / pageSize.value))

  // 当前页显示的项目
  const displayedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return items.value.slice(start, end)
  })

  // 是否有上一页
  const hasPrev = computed(() => currentPage.value > 1)

  // 是否有下一页
  const hasNext = computed(() => currentPage.value < totalPages.value)

  // 跳转到指定页
  const goToPage = (page) => {
    if (isPaused.value)
      return

    const targetPage = Math.max(1, Math.min(totalPages.value, page))
    if (targetPage !== currentPage.value) {
      currentPage.value = targetPage
    }
  }

  // 上一页
  const prevPage = () => {
    if (hasPrev.value && !isPaused.value) {
      currentPage.value--
    }
  }

  // 下一页
  const nextPage = () => {
    if (hasNext.value && !isPaused.value) {
      currentPage.value++
    }
  }

  // 设置每页条数
  const setPageSize = (size) => {
    if (size !== pageSize.value && size > 0) {
      // 计算当前第一条数据的索引
      const firstItemIndex = (currentPage.value - 1) * pageSize.value
      // 更新 pageSize
      pageSize.value = size
      // 计算新的页码，尽量保持当前位置
      const newPage = Math.floor(firstItemIndex / size) + 1
      currentPage.value = Math.max(1, Math.min(newPage, totalPages.value))
    }
  }

  // 重置到第一页（当筛选条件变化时）
  const resetPagination = () => {
    currentPage.value = 1
  }

  // 暂停分页切换
  const pausePagination = () => {
    isPaused.value = true
  }

  // 恢复分页切换
  const resumePagination = () => {
    isPaused.value = false
  }

  // 监听 items 变化，重置到第一页
  watch(() => items.value.length, (newLen, oldLen) => {
    // 只有当数据真正变化时才重置（避免初始化时重复触发）
    if (oldLen !== undefined && newLen !== oldLen) {
      resetPagination()
    }
  })

  // 当总页数变化时，确保当前页不超出范围
  watch(totalPages, (newTotal) => {
    if (currentPage.value > newTotal && newTotal > 0) {
      currentPage.value = newTotal
    }
  })

  return {
    currentPage,
    totalPages,
    pageSize,
    displayedItems,
    hasPrev,
    hasNext,
    goToPage,
    prevPage,
    nextPage,
    setPageSize,
    resetPagination,
    pausePagination,
    resumePagination,
  }
}
