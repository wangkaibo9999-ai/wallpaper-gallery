<script setup>
import { computed } from 'vue'

const env = import.meta.env.VITE_ENV || 'development'
const showBadge = import.meta.env.VITE_SHOW_ENV_BADGE === 'true' || env !== 'production'

const envConfig = computed(() => {
  switch (env) {
    case 'staging':
      return { label: '测试环境', color: '#f59e0b' }
    case 'preview':
      return { label: 'PR 预览', color: '#8b5cf6' }
    case 'development':
      return { label: '开发环境', color: '#10b981' }
    default:
      return null
  }
})
</script>

<template>
  <div v-if="showBadge && envConfig" class="env-badge" :style="{ backgroundColor: envConfig.color }">
    {{ envConfig.label }}
  </div>
</template>

<style lang="scss" scoped>
.env-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  border-radius: 6px;
  white-space: nowrap;
}
</style>
