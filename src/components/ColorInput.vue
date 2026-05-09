<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ modelValue: string; label?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const inputRef = ref<HTMLInputElement | null>(null)

function openPicker() {
  inputRef.value?.click()
}
</script>

<template>
  <div class="color-input-wrap d-flex align-center gap-2">
    <v-label v-if="label" class="text-caption text-medium-emphasis">{{ label }}</v-label>
    <v-btn
      :color="props.modelValue"
      width="44"
      min-width="44"
      height="28"
      class="pa-0"
      density="compact"
      variant="flat"
      rounded="sm"
      border
      @click="openPicker"
    />
    <input
      ref="inputRef"
      type="color"
      :value="props.modelValue"
      style="position:absolute;opacity:0;pointer-events:none;width:0;height:0"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
