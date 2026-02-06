<!--
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-03 14:50:56
 * @FilePath: \src\views\base\mask.vue
 * @Description: 
-->
<template>
  <div class="bg-white h-20"></div>
</template>

<script setup>
import { onMounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import axios from "axios";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

let viewer;

const addMask = () => {
  const maskpointArray = [];
  axios
    .get("../../../src/assets/modules/anzhouBorder.json") //读取区域json
    .then((response) => {
      for (
        let i = 0;
        i < response.data.features[0].geometry.coordinates[0].length;
        i++
      ) {
        maskpointArray.push(
          response.data.features[0].geometry.coordinates[0][i][0],
        );
        maskpointArray.push(
          response.data.features[0].geometry.coordinates[0][i][1],
        );
      }
      var maskspoint = Cesium.Cartesian3.fromDegreesArray(maskpointArray);
      const area = new Cesium.Entity({
        id: 1,
        polygon: {
          hierarchy: {
            positions: Cesium.Cartesian3.fromDegreesArray([
              100, 0, 100, 89, 150, 89, 150, 0,
            ]), //外部区域
            holes: [
              {
                positions: maskspoint, //挖空区域
              },
            ],
          },
          material: Cesium.Color.BLUE.withAlpha(0.6), //外部颜色
        },
      });
      const line = new Cesium.Entity({
        id: 2,
        polyline: {
          positions: maskspoint,
          width: 2, //边界线宽
          material: Cesium.Color.fromCssColorString("#6dcdeb"), //边界线颜色
        },
      });
      viewer.entities.add(area);
      viewer.entities.add(line);
      viewer.flyTo(line, { duration: 3 });
    })
    .catch((response) => {
      console.log(response);
    });
};

onMounted(() => {
   viewer = useCesiumStore().viewer;
  if (!viewer) return;
  addMask();
  console.log(viewer, 111);
});
useCesiumCleanup(() => {
  if (viewer) {
    viewer.entities.removeAll();
  }
});
</script>
