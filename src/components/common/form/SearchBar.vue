<script setup>
import { gsap } from 'gsap'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { trackSearch } from '@/utils/analytics'
import { highlightText } from '@/utils/format'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '搜索壁纸...',
  },
  wallpapers: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'search'])

const searchBarRef = ref(null)
const inputRef = ref(null)
const iconRef = ref(null)
const clearBtnRef = ref(null)
const suggestionsRef = ref(null)
const isFocused = ref(false)
const localValue = ref(props.modelValue)
const selectedIndex = ref(-1)
const showSuggestions = ref(false)

// 建议面板位置
const suggestionsPosition = ref({ top: 0, left: 0, width: 0 })

// 更新建议面板位置
function updateSuggestionsPosition() {
  if (searchBarRef.value) {
    const rect = searchBarRef.value.getBoundingClientRect()
    suggestionsPosition.value = {
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    }
  }
}

// 搜索建议列表
const suggestions = computed(() => {
  if (!localValue.value || !props.wallpapers.length) {
    return []
  }
  const query = localValue.value.toLowerCase()
  return props.wallpapers
    .filter(w => w.filename.toLowerCase().includes(query))
    .slice(0, 6)
    .map(w => w.filename)
})

// 是否显示建议面板
const shouldShowSuggestions = computed(() => {
  return showSuggestions.value && isFocused.value && suggestions.value.length > 0
})

watch(() => props.modelValue, (val) => {
  localValue.value = val
})

// 输入变化时显示建议
watch(localValue, () => {
  showSuggestions.value = true
  selectedIndex.value = -1
})

onMounted(() => {
  // 入场动画
  if (searchBarRef.value) {
    gsap.fromTo(
      searchBarRef.value,
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' },
    )
  }
})

function handleInput(e) {
  localValue.value = e.target.value
  // 输入时只更新本地值，不触发搜索
  // 搜索只在回车确认或选择建议时触发
}

// 确认搜索
function confirmSearch() {
  emit('update:modelValue', localValue.value)
  emit('search', localValue.value)

  // 追踪搜索事件（搜索结果数量在父组件计算，这里先记录搜索行为）
  if (localValue.value) {
    trackSearch(localValue.value, suggestions.value.length)
  }

  showSuggestions.value = false
  selectedIndex.value = -1
}

// 键盘导航
function handleKeydown(e) {
  switch (e.key) {
    case 'ArrowDown':
      if (shouldShowSuggestions.value) {
        e.preventDefault()
        selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1)
      }
      break
    case 'ArrowUp':
      if (shouldShowSuggestions.value) {
        e.preventDefault()
        selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      }
      break
    case 'Enter':
      e.preventDefault()
      if (selectedIndex.value >= 0 && shouldShowSuggestions.value) {
        // 选中了建议项
        selectSuggestion(suggestions.value[selectedIndex.value])
      }
      else {
        // 直接确认搜索
        confirmSearch()
      }
      break
    case 'Escape':
      showSuggestions.value = false
      selectedIndex.value = -1
      break
  }
}

// 选择建议
function selectSuggestion(filename) {
  localValue.value = filename
  emit('update:modelValue', filename)
  emit('search', filename)
  showSuggestions.value = false
  selectedIndex.value = -1
  inputRef.value?.focus()
}

// 获取高亮后的建议文本
function getHighlightedText(text) {
  return highlightText(text, localValue.value)
}

// 点击外部关闭建议
function handleClickOutside(e) {
  if (searchBarRef.value && !searchBarRef.value.contains(e.target)) {
    showSuggestions.value = false
    selectedIndex.value = -1
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function clearInput() {
  // 清除按钮旋转动画
  if (clearBtnRef.value) {
    gsap.to(clearBtnRef.value, {
      rotation: 90,
      scale: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        localValue.value = ''
        emit('update:modelValue', '')
        inputRef.value?.focus()
        gsap.set(clearBtnRef.value, { rotation: 0, scale: 1 })
      },
    })
  }
  else {
    localValue.value = ''
    emit('update:modelValue', '')
    inputRef.value?.focus()
  }
}

function handleFocus() {
  isFocused.value = true
  // 更新建议面板位置
  updateSuggestionsPosition()
  // 图标动画
  if (iconRef.value) {
    gsap.to(iconRef.value, {
      scale: 1.2,
      rotation: 15,
      duration: 0.4,
      ease: 'elastic.out(1, 0.5)',
    })
  }
  // 搜索框扩展动画
  if (searchBarRef.value) {
    gsap.to(searchBarRef.value, {
      scale: 1.02,
      duration: 0.3,
      ease: 'power2.out',
    })
  }
}

function handleBlur() {
  isFocused.value = false
  // 图标复位
  if (iconRef.value) {
    gsap.to(iconRef.value, {
      scale: 1,
      rotation: 0,
      duration: 0.3,
      ease: 'power2.out',
    })
  }
  // 搜索框复位
  if (searchBarRef.value) {
    gsap.to(searchBarRef.value, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    })
  }
}

// 清除按钮出现动画
watch(localValue, (newVal, oldVal) => {
  if (newVal && !oldVal && clearBtnRef.value) {
    gsap.fromTo(
      clearBtnRef.value,
      { scale: 0, rotation: -90 },
      { scale: 1, rotation: 0, duration: 0.4, ease: 'back.out(2)' },
    )
  }
})
</script>

<template>
  <div
    ref="searchBarRef"
    class="search-bar"
    :class="{ 'is-focused': isFocused, 'has-value': localValue }"
  >
    <!-- 背景发光层 -->
    <div class="search-bar__glow" />

    <!-- 渐变边框 -->
    <div class="search-bar__border" />

    <!-- 内容容器 -->
    <div class="search-bar__content">
      <!-- 搜索图标 -->
      <div ref="iconRef" class="search-bar__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      <!-- 输入框 -->
      <input
        ref="inputRef"
        type="text"
        class="search-bar__input"
        :placeholder="placeholder"
        :value="localValue"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
      >

      <!-- 清除按钮 -->
      <button
        v-if="localValue"
        ref="clearBtnRef"
        class="search-bar__clear"
        type="button"
        aria-label="清除搜索"
        @click="clearInput"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      <!-- 快捷键提示 -->
      <div v-if="!localValue && !isFocused" class="search-bar__shortcut">
        <kbd>/</kbd>
      </div>
    </div>

    <!-- 搜索建议下拉 - 使用 Teleport 避免层级问题 -->
    <Teleport to="body">
      <Transition name="suggestions">
        <div
          v-if="shouldShowSuggestions"
          ref="suggestionsRef"
          class="search-bar__suggestions"
          :style="{
            position: 'fixed',
            top: `${suggestionsPosition.top}px`,
            left: `${suggestionsPosition.left}px`,
            width: `${suggestionsPosition.width}px`,
          }"
        >
          <div
            v-for="(item, idx) in suggestions"
            :key="idx"
            class="suggestion-item"
            :class="{ 'is-selected': idx === selectedIndex }"
            @mousedown.prevent="selectSuggestion(item)"
            @mouseenter="selectedIndex = idx"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span class="suggestion-text">
              <template v-for="(part, partIdx) in getHighlightedText(item)" :key="partIdx">
                <span v-if="part.highlight" class="highlight">{{ part.text }}</span>
                <span v-else>{{ part.text }}</span>
              </template>
            </span>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.search-bar {
  --search-height: 48px;
  --search-radius: 24px;
  --glow-color: var(--color-accent);
  --border-width: 2px;

  position: relative;
  width: 100%;
  max-width: 420px;
  height: var(--search-height);

  // 背景发光效果
  &__glow {
    position: absolute;
    inset: -4px;
    border-radius: calc(var(--search-radius) + 4px);
    background: radial-gradient(ellipse at center, var(--glow-color) 0%, transparent 70%);
    opacity: 0;
    filter: blur(12px);
    transition: opacity 0.4s ease;
    pointer-events: none;
    z-index: 0;
  }

  // 渐变边框
  &__border {
    position: absolute;
    inset: 0;
    border-radius: var(--search-radius);
    padding: var(--border-width);
    background: linear-gradient(135deg, var(--color-border) 0%, var(--color-border) 100%);
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    transition: background 0.4s ease;
    pointer-events: none;
    z-index: 1;
  }

  // 内容容器
  &__content {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 $spacing-md;
    background: var(--color-bg-secondary);
    border-radius: var(--search-radius);
    z-index: 2;
    overflow: hidden;

    // 内部光晕
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 30% 50%, var(--color-accent-light) 0%, transparent 50%);
      opacity: 0;
      transition: opacity 0.4s ease;
      pointer-events: none;
    }
  }

  // 搜索图标
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-right: $spacing-sm;
    color: var(--color-text-muted);
    flex-shrink: 0;
    transition: color 0.3s ease;
    will-change: transform;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  // 输入框
  &__input {
    flex: 1;
    height: 100%;
    background: transparent;
    border: none;
    color: var(--color-text-primary);
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    letter-spacing: 0.3px;

    &::placeholder {
      color: var(--color-text-muted);
      font-weight: $font-weight-normal;
      transition: color 0.3s ease;
    }

    &:focus {
      outline: none;

      &::placeholder {
        color: var(--color-text-secondary);
      }
    }
  }

  // 清除按钮
  &__clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin-left: $spacing-xs;
    border-radius: $radius-full;
    color: var(--color-text-muted);
    background: var(--color-bg-hover);
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.25s ease;
    will-change: transform;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background: var(--color-accent-light);
      color: var(--color-accent);
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  // 快捷键提示
  &__shortcut {
    display: flex;
    align-items: center;
    margin-left: $spacing-sm;
    opacity: 0.6;
    transition: opacity 0.3s ease;

    kbd {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      background: var(--color-bg-hover);
      border: 1px solid var(--color-border);
      border-radius: $radius-sm;
      color: var(--color-text-muted);
      font-family: inherit;
      font-size: 11px;
      font-weight: $font-weight-medium;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
  }

  // 悬停状态
  &:hover:not(.is-focused) {
    .search-bar__border {
      background: linear-gradient(135deg, var(--color-text-muted) 0%, var(--color-border) 100%);
    }

    .search-bar__icon {
      color: var(--color-text-secondary);
    }

    .search-bar__shortcut {
      opacity: 1;
    }
  }

  // 聚焦状态
  &.is-focused {
    .search-bar__glow {
      opacity: 0.15;
    }

    .search-bar__border {
      background: linear-gradient(135deg, var(--color-accent) 0%, #a855f7 50%, var(--color-accent) 100%);
      background-size: 200% 200%;
      animation: gradient-shift 3s ease infinite;
    }

    .search-bar__content::before {
      opacity: 1;
    }

    .search-bar__icon {
      color: var(--color-accent);
    }
  }

  // 有值状态
  &.has-value {
    .search-bar__icon {
      color: var(--color-accent);
    }
  }
}

// 渐变边框动画
@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

// 响应式适配
@include mobile-only {
  .search-bar {
    --search-height: 44px;
    --search-radius: 22px;
    max-width: 100%;

    &__shortcut {
      display: none;
    }
  }
}

// 建议面板动画
.suggestions-enter-active,
.suggestions-leave-active {
  transition: all 0.25s ease;
}

.suggestions-enter-from,
.suggestions-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

<!-- 全局样式用于 Teleport 的建议面板 -->
<style lang="scss">
@use '@/assets/styles/variables' as *;

.search-bar__suggestions {
  max-height: 300px;
  overflow-y: auto;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: $radius-lg;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 10000;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm $spacing-md;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  .suggestion-text {
    flex: 1;
    font-size: $font-size-sm;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .highlight {
      color: #e53e3e;
      font-weight: $font-weight-semibold;
      background: rgba(229, 62, 62, 0.1);
      padding: 0 2px;
      border-radius: 2px;
    }
  }

  &:hover,
  &.is-selected {
    background: var(--color-bg-hover);

    svg {
      color: var(--color-accent);
    }
  }

  &.is-selected {
    background: var(--color-accent-light);

    .suggestion-text {
      color: var(--color-accent);
      font-weight: $font-weight-medium;
    }
  }
}
</style>
