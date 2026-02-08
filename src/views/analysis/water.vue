<template>
  <div class="analysis-panel">
    <div class="panel-header">水域效果</div>
    <div class="panel-content">
       <el-button size="small" type="primary" @click="startAnalysis">绘制水域</el-button>
       <el-button size="small" @click="clearAnalysis">清除</el-button>
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
    
    // Draw Polygon Logic
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((event) => {
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
    
    handler.setInputAction((event) => {
        if (Cesium.defined(floatingPoint)) {
            const newPosition = viewer.scene.pickPosition(event.endPosition);
            if (Cesium.defined(newPosition)) {
                floatingPoint.position.setValue(newPosition);
                activeShapePoints.pop();
                activeShapePoints.push(newPosition);
            }
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    
    handler.setInputAction(() => {
        finishDrawing();
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
};

function createPoint(worldPosition) {
    return viewer.entities.add({
        position: worldPosition,
        point: { color: Cesium.Color.WHITE, pixelSize: 5 }
    });
}

function drawShape(positionData) {
    return viewer.entities.add({
        polygon: {
            hierarchy: positionData,
            material: new Cesium.ColorMaterialProperty(Cesium.Color.BLUE.withAlpha(0.5))
        }
    });
}

function finishDrawing() {
    activeShapePoints.pop();
    if(activeShapePoints.length < 3) return;
    
    const hierarchy = activeShape.polygon.hierarchy.getValue();
    
    // Replace with Water Material Primitive
    viewer.entities.remove(activeShape);
    
    viewer.scene.primitives.add(new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
            geometry: new Cesium.PolygonGeometry({
                polygonHierarchy: new Cesium.PolygonHierarchy(hierarchy),
                height: 0 // Assume ground or specific height
            })
        }),
        appearance: new Cesium.EllipsoidSurfaceAppearance({
            material: new Cesium.Material({
                fabric: {
                    type: 'Water',
                    uniforms: {
                        normalMap: '../assets/waterNormals.jpg', // Placeholder
                        frequency: 1000.0,
                        animationSpeed: 0.01,
                        amplitude: 10.0
                    }
                }
            })
        })
    }));
    
    if (handler) {
        handler.destroy();
        handler = null;
    }
    viewer.entities.remove(floatingPoint);
    floatingPoint = null;
    activeShape = null;
    activeShapePoints = [];
}

const clearAnalysis = () => {
    if (viewer) {
        viewer.entities.removeAll();
        viewer.scene.primitives.removeAll(); // Be careful not to remove tilesets
        // Better: store primitives in array and remove specific ones
    }
    activeShapePoints = [];
    if (handler) {
        handler.destroy();
        handler = null;
    }
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
