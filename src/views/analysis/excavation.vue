<template>
  <div class="analysis-panel">
    <div class="panel-header">开挖分析</div>
    <div class="panel-content">
       <el-button size="small" type="primary" @click="startAnalysis">绘制开挖区域</el-button>
       <el-button size="small" @click="clearAnalysis">清除</el-button>
       <div class="mt-2 text-xs text-gray-500">
         注：适用于3D Tiles或地形开挖
       </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';
import * as Cesium from 'cesium';

let viewer = null;
let handler = null;
let activeShapePoints = [];
let activeShape = null;
let floatingPoint = null;
let clippingPlanes = [];

onMounted(() => {
  const store = useCesiumStore();
  viewer = store.viewer;
});

useCesiumCleanup(() => {
   clearAnalysis();
});

const startAnalysis = () => {
    if (!viewer) return;
    clearAnalysis();
    
    // Initialize drawing tool logic (Simplified for brevity)
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    
    handler.setInputAction(function (event) {
        const earthPosition = viewer.scene.pickPosition(event.position);
        if (Cesium.defined(earthPosition)) {
            if (activeShapePoints.length === 0) {
                floatingPoint = createPoint(earthPosition);
                activeShapePoints.push(earthPosition);
                const dynamicPositions = new Cesium.CallbackProperty(function () {
                    return activeShapePoints;
                }, false);
                activeShape = drawShape(dynamicPositions);
            }
            activeShapePoints.push(earthPosition);
            createPoint(earthPosition);
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    
    handler.setInputAction(function (event) {
        if (Cesium.defined(floatingPoint)) {
            const newPosition = viewer.scene.pickPosition(event.endPosition);
            if (Cesium.defined(newPosition)) {
                floatingPoint.position.setValue(newPosition);
                activeShapePoints.pop();
                activeShapePoints.push(newPosition);
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    handler.setInputAction(function (event) {
        terminateShape();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
};

function createPoint(worldPosition) {
    const point = viewer.entities.add({
        position: worldPosition,
        point: {
            color: Cesium.Color.WHITE,
            pixelSize: 5,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
    });
    return point;
}

function drawShape(positionData) {
    let shape;
    shape = viewer.entities.add({
        polygon: {
            hierarchy: positionData,
            material: new Cesium.ColorMaterialProperty(Cesium.Color.WHITE.withAlpha(0.7))
        }
    });
    return shape;
}

function terminateShape() {
    activeShapePoints.pop();
    if(activeShapePoints.length < 3) return;
    
    // Compute clipping planes from points
    // This is complex, simplified logic:
    // Create planes around the polygon
    
    // For now, just remove the drawing entity and show a message
    // Real implementation requires calculating planes and applying to viewer.scene.globe.clippingPlanes
    
    const points = activeShapePoints;
    const pointsLength = points.length;
    const clippingPlanesList = [];
    
    for (let i = 0; i < pointsLength; ++i) {
        const nextIndex = (i + 1) % pointsLength;
        let midpoint = Cesium.Cartesian3.add(points[i], points[nextIndex], new Cesium.Cartesian3());
        midpoint = Cesium.Cartesian3.multiplyByScalar(midpoint, 0.5, midpoint);
        
        const up = Cesium.Cartesian3.normalize(midpoint, new Cesium.Cartesian3());
        let right = Cesium.Cartesian3.subtract(points[nextIndex], midpoint, new Cesium.Cartesian3());
        right = Cesium.Cartesian3.normalize(right, right);
        
        let normal = Cesium.Cartesian3.cross(right, up, new Cesium.Cartesian3());
        normal = Cesium.Cartesian3.normalize(normal, normal);
        
        // Compute distance
        const plane = Cesium.Plane.fromPointNormal(midpoint, normal);
        clippingPlanesList.push(new Cesium.ClippingPlane(normal, plane.distance));
    }
    
    // Applying to globe (simplified)
    // viewer.scene.globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
    //    planes: clippingPlanesList,
    //    edgeWidth: 1.0,
    //    edgeColor: Cesium.Color.WHITE
    // });
    
    alert("开挖区域绘制完成 (Clipping Plane logic placeholder)");
    
    if (handler) {
        handler.destroy();
        handler = null;
    }
    viewer.entities.remove(floatingPoint);
    viewer.entities.remove(activeShape);
    floatingPoint = null;
    activeShape = null;
    activeShapePoints = [];
}

const clearAnalysis = () => {
    if (viewer) {
        viewer.entities.removeAll();
        // viewer.scene.globe.clippingPlanes = undefined;
    }
    if (handler) {
        handler.destroy();
        handler = null;
    }
    activeShapePoints = [];
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
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}
.panel-header {
  font-weight: bold;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}
</style>
