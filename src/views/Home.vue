<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-02 15:41:05
 * @FilePath: \src\views\Home.vue
 * @Description: 
-->
<template>
  <div class="page-card" :class="{'dark': isDark}">
    这是首页
  </div>
</template>

<script setup>
import { useTheme } from '@/hooks/useTheme';
const { isDark } = useTheme();


</script>