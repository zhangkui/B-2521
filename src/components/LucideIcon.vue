<template>
  <component
    :is="iconComponent"
    :size="size"
    :color="color"
    :stroke-width="strokeWidth"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import * as LucideIcons from "lucide-vue-next";

const props = defineProps<{
  name: string;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
}>();

const iconComponent = computed(() => {
  // @ts-ignore
  return LucideIcons[props.name] || LucideIcons.HelpCircle;
});
</script>
