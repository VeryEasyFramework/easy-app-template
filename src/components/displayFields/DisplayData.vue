<template>
  <div class="data-field">
    {{ props.value }}
  </div>
</template>

<script setup lang="ts">
import type {EasyField} from "@vef/easy-api";

const props = defineProps<{
  value: any;
  field?: EasyField
}>()
</script>

<style scoped>
.data-field {
  white-space: break-spaces;
  word-wrap: break-word;
  word-break: break-all;
  max-width: 200px;
  height: max-content;

}
</style>
