<template>
  <div class="analysis-panel">
    <div class="panel-header">测量工具</div>
    <div class="panel-content">
      <div class="mb-2">
        <el-radio-group v-model="mapType" size="small" @change="handleMapTypeChange">
          <el-radio-button label="imagery">影像图</el-radio-button>
          <el-radio-button label="terrain">地形图</el-radio-button>
        </el-radio-group>
      </div>
      <div class="mb-2">
        <el-select v-model="mode" size="small" style="width: 180px">
          <el-option
            v-for="item in availableModes"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <el-button size="small" type="primary" @click="start">开始测量</el-button>
      <el-button size="small" @click="finish">完成</el-button>
      <el-button size="small" @click="clearAll">清除</el-button>
      <div v-if="info" class="mt-2 text-xs">{{ info }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";
import * as Cesium from "cesium";

const mode = ref("spaceDistance");
const mapType = ref("imagery");
const info = ref("");
let viewer = null;
let handler = null;
let points = [];
let drawEntities = [];
let resultEntities = [];

const availableModes = computed(() => {
  const allModes = [
    { label: "空间距离", value: "spaceDistance" },
    { label: "地表距离", value: "surfaceDistance" },
    { label: "地表面积", value: "surfaceArea" },
    { label: "高度差", value: "heightDiff" },
    { label: "三角测量", value: "triangle" },
    { label: "方位角", value: "azimuth" },
  ];
  if (mapType.value === "imagery") {
    return allModes.filter((m) =>
      ["spaceDistance", "triangle", "azimuth"].includes(m.value),
    );
  } else if (mapType.value === "terrain") {
    return allModes.filter((m) =>
      ["surfaceDistance", "surfaceArea", "heightDiff"].includes(m.value),
    );
  }
  return allModes;
});

const handleMapTypeChange = async (val) => {
  if (!viewer) return;
  clearAll();
  if (val === "imagery") {
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
    mode.value = "spaceDistance";
  } else {
    try {
      viewer.terrainProvider =
        await Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
          "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer",
        );
      mode.value = "surfaceDistance";
    } catch (e) {
      console.error("Terrain load failed", e);
    }
  }
};

onMounted(() => {
  viewer = useCesiumStore().viewer;
});

useCesiumCleanup(() => {
  clearAll();
  if (viewer) {
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
  }
});

const addPoint = (pos) => {
  const e = viewer.entities.add({
    position: pos,
    point: { pixelSize: 8, color: Cesium.Color.YELLOW },
  });
  drawEntities.push(e);
};

const addPolyline = (positions, color, clamp = false) => {
  const e = viewer.entities.add({
    polyline: { positions, width: 2, material: color, clampToGround: clamp },
  });
  drawEntities.push(e);
};

const addPolygon = (positions, color, clamp = false) => {
  const e = viewer.entities.add({
    polygon: {
      hierarchy: positions,
      material: color,
      clampToGround: clamp,
      perPositionHeight: !clamp,
    },
  });
  drawEntities.push(e);
};

const labelAt = (pos, text) => {
  const e = viewer.entities.add({
    position: pos,
    label: {
      text,
      font: "14px sans-serif",
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      pixelOffset: new Cesium.Cartesian2(0, -18),
    },
  });
  resultEntities.push(e);
};

const start = () => {
  clearTemp();
  info.value = "";
  points = [];
  handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
  handler.setInputAction((click) => {
    let cartesian;
    if (viewer.scene.pickPositionSupported)
      cartesian = viewer.scene.pickPosition(click.position);
    if (!cartesian)
      cartesian = viewer.scene.camera.pickEllipsoid(
        click.position,
        viewer.scene.globe.ellipsoid,
      );
    if (!cartesian) return;
    if (mode.value === "triangle" && points.length >= 3) return;
    points.push(cartesian);
    addPoint(cartesian);
    if (mode.value === "spaceDistance" || mode.value === "surfaceDistance") {
      if (points.length > 1)
        addPolyline(
          points.slice(-2),
          Cesium.Color.CYAN,
          mode.value === "surfaceDistance",
        );
    } else if (mode.value === "surfaceArea") {
      if (points.length >= 3)
        addPolygon(points, Cesium.Color.ORANGE.withAlpha(0.25), true);
    } else if (mode.value === "heightDiff") {
      if (points.length === 2) addPolyline(points, Cesium.Color.YELLOW, false);
    } else if (mode.value === "triangle") {
      if (points.length === 3)
        addPolyline(
          [points[0], points[1], points[2], points[0]],
          Cesium.Color.PURPLE,
          false,
        );
    } else if (mode.value === "azimuth") {
      if (points.length === 2) addPolyline(points, Cesium.Color.GREEN, true);
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

const finish = async () => {
  if (!viewer) return;
  if (handler) {
    handler.destroy();
    handler = null;
  }
  if (mode.value === "spaceDistance") {
    const d = distance3D(points);
    info.value = formatMeters(d);
    if (points.length) labelAt(points[points.length - 1], info.value);
  } else if (mode.value === "surfaceDistance") {
    const d = surfaceDistance(points);
    info.value = formatMeters(d);
    if (points.length) labelAt(points[points.length - 1], info.value);
  } else if (mode.value === "surfaceArea") {
    const a = areaENU(points);
    info.value = formatSquareMeters(a);
    if (points.length) labelAt(points[0], info.value);
  } else if (mode.value === "heightDiff") {
    if (points.length === 2) {
      const diff = await heightDifference(points[0], points[1]);
      info.value = `高度差: ${diff.toFixed(2)} m`;
      labelAt(points[1], info.value);
    }
  } else if (mode.value === "triangle") {
    if (points.length === 3) {
      const res = triangleMeasure(points[0], points[1], points[2]);
      info.value = "";
      labelTriangle(points[0], points[1], points[2], res);
    }
  } else if (mode.value === "azimuth") {
    if (points.length === 2) {
      const az = azimuth(points[0], points[1]);
      info.value = `方位角: ${az.toFixed(1)}°`;
      labelAt(points[1], info.value);
    }
  }
};

const clearTemp = () => {
  drawEntities.forEach((e) => viewer.entities.remove(e));
  drawEntities = [];
  resultEntities.forEach((e) => viewer.entities.remove(e));
  resultEntities = [];
};

const clearAll = () => {
  if (handler) {
    handler.destroy();
    handler = null;
  }
  clearTemp();
  points = [];
  info.value = "";
};

const formatMeters = (m) => {
  if (m < 1000) return `${m.toFixed(2)} m`;
  return `${(m / 1000).toFixed(3)} km`;
};
const formatSquareMeters = (m2) => {
  if (m2 < 1000000) return `${m2.toFixed(2)} m²`;
  return `${(m2 / 1000000).toFixed(3)} km²`;
};

const distance3D = (positions) => {
  if (!positions || positions.length < 2) return 0;
  let d = 0;
  for (let i = 0; i < positions.length - 1; i++)
    d += Cesium.Cartesian3.distance(positions[i], positions[i + 1]);
  return d;
};

const surfaceDistance = (positions) => {
  if (!positions || positions.length < 2) return 0;
  let d = 0;
  const geodesic = new Cesium.EllipsoidGeodesic();
  for (let i = 0; i < positions.length - 1; i++) {
    const p1 = Cesium.Cartographic.fromCartesian(positions[i]);
    const p2 = Cesium.Cartographic.fromCartesian(positions[i + 1]);
    geodesic.setEndPoints(p1, p2);
    d += geodesic.surfaceDistance;
  }
  return d;
};

const areaENU = (positions) => {
  if (!positions || positions.length < 3) return 0;
  const origin = positions[0];
  const enuToWorld = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
  const worldToEnu = Cesium.Matrix4.inverse(enuToWorld, new Cesium.Matrix4());
  const pts = positions.map((p) =>
    Cesium.Matrix4.multiplyByPoint(worldToEnu, p, new Cesium.Cartesian3()),
  );
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area);
};

const heightDifference = async (p1, p2) => {
  const c1 = Cesium.Cartographic.fromCartesian(p1);
  const c2 = Cesium.Cartographic.fromCartesian(p2);
  if (viewer && viewer.terrainProvider && viewer.terrainProvider.ready) {
    const res = await Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, [Cesium.Cartographic.clone(c1), Cesium.Cartographic.clone(c2)]);
    const h1 = res[0].height ?? 0;
    const h2 = res[1].height ?? 0;
    return h2 - h1;
  } else {
    const h1 = viewer.scene.globe.getHeight(c1) ?? c1.height ?? 0;
    const h2 = viewer.scene.globe.getHeight(c2) ?? c2.height ?? 0;
    return h2 - h1;
  }
};

const triangleMeasure = (A, B, C) => {
  const a = Cesium.Cartesian3.distance(B, C);
  const b = Cesium.Cartesian3.distance(A, C);
  const c = Cesium.Cartesian3.distance(A, B);
  const angle = (u, v) => {
    const dot = Cesium.Cartesian3.dot(u, v);
    const mu = Cesium.Cartesian3.magnitude(u);
    const mv = Cesium.Cartesian3.magnitude(v);
    return Cesium.Math.toDegrees(
      Math.acos(Cesium.Math.clamp(dot / (mu * mv), -1, 1)),
    );
  };
  const AB = Cesium.Cartesian3.subtract(B, A, new Cesium.Cartesian3());
  const AC = Cesium.Cartesian3.subtract(C, A, new Cesium.Cartesian3());
  const BA = Cesium.Cartesian3.subtract(A, B, new Cesium.Cartesian3());
  const BC = Cesium.Cartesian3.subtract(C, B, new Cesium.Cartesian3());
  const CA = Cesium.Cartesian3.subtract(A, C, new Cesium.Cartesian3());
  const CB = Cesium.Cartesian3.subtract(B, C, new Cesium.Cartesian3());
  return { a, b, c, A: angle(AB, AC), B: angle(BA, BC), C: angle(CA, CB) };
};

const labelTriangle = (A, B, C, res) => {
  const midAB = Cesium.Cartesian3.midpoint(A, B, new Cesium.Cartesian3());
  const midBC = Cesium.Cartesian3.midpoint(B, C, new Cesium.Cartesian3());
  const midCA = Cesium.Cartesian3.midpoint(C, A, new Cesium.Cartesian3());
  labelAt(midBC, `a:${formatMeters(res.a)}`);
  labelAt(midCA, `b:${formatMeters(res.b)}`);
  labelAt(midAB, `c:${formatMeters(res.c)}`);
  labelAt(A, `α:${res.A.toFixed(1)}°`);
  labelAt(B, `β:${res.B.toFixed(1)}°`);
  labelAt(C, `γ:${res.C.toFixed(1)}°`);
};

const azimuth = (p1, p2) => {
  const c1 = Cesium.Cartographic.fromCartesian(p1);
  const c2 = Cesium.Cartographic.fromCartesian(p2);
  const lon1 = c1.longitude;
  const lon2 = c2.longitude;
  const lat1 = c1.latitude;
  const lat2 = c2.latitude;
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  let brg = Cesium.Math.toDegrees(Math.atan2(y, x));
  if (brg < 0) brg += 360;
  return brg;
};
</script>

<style scoped>
.analysis-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  z-index: 100;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
.panel-header {
  font-weight: bold;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}
.mb-2 {
  margin-bottom: 8px;
  font-size: 12px;
}
</style>
