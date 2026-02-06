
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-2 font-bold">Primitive 示例</div>
    <div class="flex gap-2">
      <el-button size="small" @click="addPrimitive">添加几何体</el-button>
      <el-button size="small" type="danger" @click="clear">清除</el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;
let primitive = null;

onMounted(() => {
  viewer = useCesiumStore().viewer;
});

const addPrimitive = () => {
  if (!viewer) return;
  clear();

  const instance = new Cesium.GeometryInstance({
    geometry: new Cesium.RectangleGeometry({
      rectangle: Cesium.Rectangle.fromDegrees(114.0, 30.0, 115.0, 31.0),
      vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT
    }),
    attributes: {
      color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.RED.withAlpha(0.5))
    }
  });

  primitive = new Cesium.Primitive({
    geometryInstances: instance,
    appearance: new Cesium.PerInstanceColorAppearance()
  });

  viewer.scene.primitives.add(primitive);
  
  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(114.0, 30.0, 115.0, 31.0)
  });
};

const clear = () => {
  if (viewer && primitive) {
    viewer.scene.primitives.remove(primitive);
    primitive = null;
  }
};

useCesiumCleanup(() => {
  clear();
});
</script>
