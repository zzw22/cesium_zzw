<!--
 * @Title: EntityCollection / DataSource
 * @Description: 使用 CustomDataSource 管理一组 Entity
-->
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-2 font-bold">EntityCollection 示例</div>
    <div class="flex gap-2">
      <el-button size="small" @click="addCollection">添加集合</el-button>
      <el-button size="small" @click="toggleShow">显示/隐藏</el-button>
      <el-button size="small" type="danger" @click="clear">清除</el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;
let dataSource = null;
const isVisible = ref(true);

onMounted(() => {
  viewer = useCesiumStore().viewer;
});

const addCollection = async () => {
  if (!viewer) return;
  clear();

  dataSource = new Cesium.CustomDataSource('my-collection');
  
  // 向集合添加实体
  for (let i = 0; i < 5; i++) {
    dataSource.entities.add({
      position: Cesium.Cartesian3.fromDegrees(114.30 + i * 0.1, 30.60, 1000),
      box: {
        dimensions: new Cesium.Cartesian3(5000, 5000, 5000),
        material: Cesium.Color.fromRandom({ alpha: 0.8 })
      }
    });
  }

  await viewer.dataSources.add(dataSource);
  viewer.flyTo(dataSource);
};

const toggleShow = () => {
  if (dataSource) {
    isVisible.value = !isVisible.value;
    dataSource.show = isVisible.value;
  }
};

const clear = () => {
  if (viewer && dataSource) {
    viewer.dataSources.remove(dataSource);
    dataSource = null;
  }
};

useCesiumCleanup(() => {
  clear();
});
</script>
