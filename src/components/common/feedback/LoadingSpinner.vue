<script setup>
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v),
  },
})
</script>

<template>
  <div class="loading-spinner" :class="[`size-${size}`]">
    <div class="spinner" />
  </div>
</template>

<style lang="scss" scoped>
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;

  &.size-sm {
    .spinner {
      width: 20px;
      height: 20px;
      border-width: 2px;
    }
  }

  &.size-md {
    .spinner {
      width: 32px;
      height: 32px;
      border-width: 3px;
    }
  }

  &.size-lg {
    .spinner {
      width: 48px;
      height: 48px;
      border-width: 4px;
    }
  }
}

.spinner {
  border-radius: 50%;
  border-style: solid;
  border-color: var(--color-border);
  border-top-color: var(--color-accent);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
