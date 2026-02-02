<template>
  <div class="bg-white h-20">1111</div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useCesiumStore } from '@/store/cesiumStore'



onMounted(() => {
  const viewer = useCesiumStore().viewer
  console.log(viewer, 111);
});
</script>
