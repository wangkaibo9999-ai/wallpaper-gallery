<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  current: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  pageSize: {
    type: Number,
    default: 30,
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 30, 50],
  },
})

const emit = defineEmits(['change', 'sizeChange'])

// 每页条数下拉框是否展开
const sizeDropdownOpen = ref(false)

// 总页数
const totalPages = computed(() => Math.ceil(props.total / props.pageSize))

// 是否显示分页（只有一页且总数不多时可以隐藏）
const showPagination = computed(() => props.total > 0)

// 生成页码列表
const pageList = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = props.current

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push({ type: 'page', value: i })
    }
  }
  else {
    pages.push({ type: 'page', value: 1 })

    if (current <= 4) {
      for (let i = 2; i <= 5; i++) {
        pages.push({ type: 'page', value: i })
      }
      pages.push({ type: 'ellipsis', value: 'end' })
      pages.push({ type: 'page', value: total })
    }
    else if (current >= total - 3) {
      pages.push({ type: 'ellipsis', value: 'start' })
      for (let i = total - 4; i <= total; i++) {
        pages.push({ type: 'page', value: i })
      }
    }
    else {
      pages.push({ type: 'ellipsis', value: 'start' })
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push({ type: 'page', value: i })
      }
      pages.push({ type: 'ellipsis', value: 'end' })
      pages.push({ type: 'page', value: total })
    }
  }

  return pages
})

// 移动端简化页码列表
const mobilePageList = computed(() => {
  const total = totalPages.value
  const current = props.current

  if (total <= 3) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages = new Set()
  pages.add(1)
  pages.add(total)
  pages.add(current)
  if (current > 1)
    pages.add(current - 1)
  if (current < total)
    pages.add(current + 1)

  return Array.from(pages).sort((a, b) => a - b)
})

// 跳转到指定页
function goToPage(page) {
  if (page < 1 || page > totalPages.value || page === props.current)
    return
  emit('change', page)
}

// 上一页
function prevPage() {
  if (props.current > 1) {
    goToPage(props.current - 1)
  }
}

// 下一页
function nextPage() {
  if (props.current < totalPages.value) {
    goToPage(props.current + 1)
  }
}

// 快速跳转（点击省略号）
function quickJump(direction) {
  const jump = direction === 'start' ? -5 : 5
  const target = Math.max(1, Math.min(totalPages.value, props.current + jump))
  goToPage(target)
}

// 切换每页条数
function changePageSize(size) {
  sizeDropdownOpen.value = false
  if (size !== props.pageSize) {
    emit('sizeChange', size)
  }
}

// 关闭下拉框
function closeSizeDropdown() {
  sizeDropdownOpen.value = false
}
</script>

<template>
  <div v-if="showPagination" class="pagination" @mouseleave="closeSizeDropdown">
    <!-- 总条数 -->
    <div class="pagination-total">
      共 <span class="total-count">{{ total }}</span> 条
    </div>

    <!-- 每页条数选择器 -->
    <div class="pagination-sizes">
      <div
        class="size-selector"
        :class="{ active: sizeDropdownOpen }"
        @click="sizeDropdownOpen = !sizeDropdownOpen"
      >
        <span>{{ pageSize }} 条/页</span>
        <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6" />
        </svg>

        <!-- 下拉选项 -->
        <Transition name="dropdown">
          <div v-if="sizeDropdownOpen" class="size-dropdown">
            <div
              v-for="size in pageSizes"
              :key="size"
              class="size-option"
              :class="{ selected: size === pageSize }"
              @click.stop="changePageSize(size)"
            >
              {{ size }} 条/页
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- PC端分页控件 -->
    <div class="pagination-controls desktop-only">
      <!-- 上一页 -->
      <button
        class="page-btn prev-btn"
        :disabled="current <= 1"
        title="上一页"
        @click="prevPage"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <!-- 页码按钮 -->
      <template v-for="item in pageList" :key="item.type + item.value">
        <button
          v-if="item.type === 'page'"
          class="page-btn"
          :class="{ active: item.value === current }"
          @click="goToPage(item.value)"
        >
          {{ item.value }}
        </button>
        <button
          v-else
          class="page-btn ellipsis"
          :title="item.value === 'start' ? '向前5页' : '向后5页'"
          @click="quickJump(item.value)"
        >
          <span class="dots">•••</span>
          <svg class="jump-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="item.value === 'start'" d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
            <path v-else d="M13 7l5 5-5 5M6 7l5 5-5 5" />
          </svg>
        </button>
      </template>

      <!-- 下一页 -->
      <button
        class="page-btn next-btn"
        :disabled="current >= totalPages"
        title="下一页"
        @click="nextPage"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>

    <!-- 移动端分页 -->
    <div class="pagination-controls mobile-only">
      <!-- 上一页 -->
      <button
        class="page-btn prev-btn"
        :disabled="current <= 1"
        @click="prevPage"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <!-- 简化页码 -->
      <div class="mobile-pages">
        <template v-for="(page, index) in mobilePageList" :key="page">
          <span
            v-if="index > 0 && page - mobilePageList[index - 1] > 1"
            class="mobile-ellipsis"
          >•••</span>
          <button
            class="page-btn"
            :class="{ active: page === current }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </template>
      </div>

      <!-- 下一页 -->
      <button
        class="page-btn next-btn"
        :disabled="current >= totalPages"
        @click="nextPage"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: $spacing-lg;
  padding: $spacing-xl 0;
  margin-top: $spacing-lg;
}

// 总条数
.pagination-total {
  font-size: $font-size-sm;
  color: var(--color-text-muted);

  .total-count {
    color: var(--color-text-primary);
    font-weight: $font-weight-semibold;
  }
}

// 每页条数选择器
.pagination-sizes {
  position: relative;
}

.size-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: 0 $spacing-md;
  height: 38px;
  min-width: 110px;
  font-size: $font-size-sm;
  color: var(--color-text-primary);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  .arrow-icon {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  &:hover {
    border-color: var(--color-accent);
  }

  &.active {
    border-color: var(--color-accent);

    .arrow-icon {
      transform: rotate(180deg);
    }
  }
}

.size-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 6px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 100;
}

.size-option {
  padding: $spacing-sm $spacing-md;
  font-size: $font-size-sm;
  color: var(--color-text-primary);
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-accent);
  }

  &.selected {
    color: var(--color-accent);
    font-weight: $font-weight-medium;
    background: var(--color-accent-light);
  }
}

// 下拉动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// 分页控件
.pagination-controls {
  display: flex;
  align-items: center;
  gap: $spacing-sm;

  &.desktop-only {
    @include mobile-only {
      display: none;
    }
  }

  &.mobile-only {
    display: none;

    @include mobile-only {
      display: flex;
      width: 100%;
      justify-content: center;
      margin-top: $spacing-sm;
    }
  }
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 38px;
  padding: 0 $spacing-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: var(--color-text-primary);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: $radius-md;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover:not(:disabled):not(.active) {
    background: var(--color-bg-hover);
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.active {
    background: var(--color-accent);
    border-color: var(--color-accent);
    color: white;
    font-weight: $font-weight-semibold;
  }

  &.prev-btn,
  &.next-btn {
    padding: 0;
  }

  &.ellipsis {
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    min-width: 32px;

    .dots {
      letter-spacing: 1px;
      font-size: $font-size-sm;
    }

    .jump-icon {
      display: none;
      width: 16px;
      height: 16px;
    }

    &:hover {
      color: var(--color-accent);

      .dots {
        display: none;
      }

      .jump-icon {
        display: block;
      }
    }
  }
}

// 移动端样式
.mobile-pages {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.mobile-ellipsis {
  color: var(--color-text-muted);
  font-size: $font-size-sm;
  padding: 0 4px;
}

// 移动端调整
@include mobile-only {
  .pagination {
    justify-content: center;
    gap: $spacing-md;
  }

  .pagination-total {
    order: 1;
    width: 100%;
    text-align: center;
  }

  .pagination-sizes {
    order: 2;
  }

  .pagination-controls.mobile-only {
    order: 3;
  }

  .page-btn {
    min-width: 40px;
    height: 40px;
  }

  .size-selector {
    height: 40px;
  }
}
</style>
