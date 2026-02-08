<template>
  <div class="effect-panel">
    <h3>流动线</h3>
    <el-button @click="toggleEffect">切换显示</el-button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';

const store = useCesiumStore();
let entity = null;

const toggleEffect = () => {
  if (entity) {
    entity.show = !entity.show;
  }
};

// 定义 MaterialProperty
class PolylineFlowMaterialProperty {
  constructor(options) {
    this._definitionChanged = new Cesium.Event();
    this._color = undefined;
    this._speed = undefined;
    this._percent = undefined;
    this.color = options.color;
    this.speed = options.speed;
    this.percent = options.percent;
  }

  get isConstant() { return false; }
  get definitionChanged() { return this._definitionChanged; }
  getType(time) { return 'PolylineFlow'; }
  getValue(time, result) {
    if (!Cesium.defined(result)) {
      result = {};
    }
    result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
    result.speed = Cesium.Property.getValueOrDefault(this._speed, time, 1.0, result.speed);
    result.percent = Cesium.Property.getValueOrDefault(this._percent, time, 0.03, result.percent);
    return result;
  }
  equals(other) {
    return this === other || (other instanceof PolylineFlowMaterialProperty && Cesium.Property.equals(this._color, other._color) && Cesium.Property.equals(this._speed, other._speed));
  }
}

Object.defineProperties(PolylineFlowMaterialProperty.prototype, {
  color: Cesium.createPropertyDescriptor('color'),
  speed: Cesium.createPropertyDescriptor('speed'),
  percent: Cesium.createPropertyDescriptor('percent')
});

onMounted(() => {
  const viewer = store.viewer;
  if (!viewer) return;

  // 自定义材质
  if (!Cesium.Material.PolylineFlowType) {
    Cesium.Material.PolylineFlowType = 'PolylineFlow';
    Cesium.Material._materialCache.addMaterial(Cesium.Material.PolylineFlowType, {
      fabric: {
        type: Cesium.Material.PolylineFlowType,
        uniforms: {
          color: new Cesium.Color(0.0, 1.0, 1.0, 1.0),
          speed: 1.0,
          percent: 0.03,
          gradient: 0.1
        },
        source: `
          uniform vec4 color;
          uniform float speed;
          uniform float percent;
          uniform float gradient;
          
          czm_material czm_getMaterial(czm_materialInput materialInput){
            czm_material material = czm_getDefaultMaterial(materialInput);
            vec2 st = materialInput.st;
            float t = fract(czm_frameNumber * speed / 1000.0);
            t *= (1.0 + percent);
            float alpha = smoothstep(t- percent, t, st.s) * step(-t, -st.s);
            alpha += smoothstep(t- percent, t, st.s - 1.0) * step(-t, -(st.s - 1.0));
            material.diffuse = color.rgb;
            material.alpha = alpha * color.a;
            return material;
          }
        `
      },
      translucent: true
    });
  }

  entity = viewer.entities.add({
    name: 'FlowLine',
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArrayHeights([
        114.3055, 30.5928, 0,
        114.3255, 30.6128, 0,
        114.3455, 30.5928, 0
      ]),
      width: 5,
      material: new PolylineFlowMaterialProperty({
        color: new Cesium.Color(0.0, 1.0, 1.0, 1.0),
        speed: 2.0,
        percent: 0.15
      })
    }
  });

  viewer.zoomTo(entity);
});

onUnmounted(() => {
  const viewer = store.viewer;
  if (viewer && entity) {
    viewer.entities.remove(entity);
  }
});
</script>

<style scoped>
.effect-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 4px;
}
</style>
