<template>
  <div class="demo_panel">
    <h3 class="demo_title">位置信息</h3>
    <div class="control-panel">
      <el-button
        @click="togglePick"
        :type="isPicking ? 'primary' : ''"
      >
        {{ isPicking ? "停止拾取" : "开始拾取" }}
      </el-button>
      <el-button  @click="clearAll">清空所有</el-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import PositionPick from "@/utils/cesium/PositionPick";
import * as Cesium from "cesium";
import circleIcon from "@/assets/images/circleIcon.png";

let viewer;
let handler;
const isPicking = ref(false);
const pickInstances = ref([]);

const togglePick = () => {
  isPicking.value = !isPicking.value;
  if (isPicking.value) {
    initHandler();
  } else {
    destroyHandler();
  }
};

const initHandler = () => {
  if (handler) return;
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  // Picking logic on click
  handler.setInputAction((movement) => {
    if (!isPicking.value) return;

    // Prevent picking if we clicked on an existing UI element or entity if needed
    const pickedObject = viewer.scene.pick(movement.position);
    if (
      Cesium.defined(pickedObject) &&
      pickedObject.id &&
      pickedObject.id.type === "PositionPick"
    ) {
      return;
    }

    // Strategy:
    // 1. If we picked a 3D object (Model, 3DTiles), use pickPosition for accurate surface
    // 2. Otherwise (Terrain/Globe), use globe.pick (ray intersection) which is more stable for ground

    let pickPos;
    if (Cesium.defined(pickedObject)) {
      // Picked a model or 3D tile
      pickPos = viewer.scene.pickPosition(movement.position);
    }

    // If no model picked or pickPosition failed, try globe pick
    if (!pickPos) {
      const ray = viewer.camera.getPickRay(movement.position);
      pickPos = viewer.scene.globe.pick(ray, viewer.scene);
    }

    if (pickPos) {
      addPositionPick(pickPos);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

const destroyHandler = () => {
  if (handler) {
    handler.destroy();
    handler = null;
  }
};

const addPositionPick = (position) => {
  const instance = new PositionPick(viewer, position, {
    onRemove: (inst) => {
      const index = pickInstances.value.indexOf(inst);
      if (index > -1) {
        pickInstances.value.splice(index, 1);
      }
    },
    imgUrl: circleIcon,
    width:22,
    height:22,
  });
  pickInstances.value.push(instance);
};

const clearAll = () => {
  // Create a copy of the array to iterate because remove() modifies the original array via callback
  [...pickInstances.value].forEach((inst) => inst.remove());
  pickInstances.value = [];
};

onMounted(async () => {
  viewer = useCesiumStore().viewer;
  const terrainProvider =
    await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
      "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
    );
  viewer.terrainProvider = terrainProvider;
});

onUnmounted(() => {
  destroyHandler();
  clearAll();
});
</script>

<style scoped>
.control-panel {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}
</style>
