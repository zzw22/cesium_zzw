<template>
  <div class="effect-panel">
    <h3>点光源效果</h3>
    <div class="control-group">
      <label>光照强度:</label>
      <input type="range" min="0.1" max="10.0" step="0.1" v-model.number="lightIntensity" />
    </div>
    <div class="control-group">
      <label>光源高度:</label>
      <input type="range" min="10" max="500" step="10" v-model.number="lightHeight" />
    </div>
    <div class="info">
      <p>R: 红色光源 (动态移动)</p>
      <p>G: 绿色光源 (固定)</p>
      <p>B: 蓝色光源 (固定)</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { PolylineTrailMaterialProperty } from '@/utils/cesium/PolylineTrailMaterialProperty.js';

const store = useCesiumStore();
let tileset = null;
let viewer = null;
const lightIntensity = ref(6.0);
const lightHeight = ref(100);

// 合肥白膜数据 (常用测试数据)
const tilesetUrl = 'https://data.mars3d.cn/3dtiles/jzw-hefei/tileset.json';

// 创建 CustomShader
const createCustomShader = () => {
  return new Cesium.CustomShader({
    lightingModel: Cesium.LightingModel.UNLIT, // 我们自己计算光照
    uniforms: {
      u_lightPositionRed: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3()
      },
      u_lightColorRed: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3(3.0, 0.0, 0.0)
      },
      u_lightPositionGreen: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3()
      },
      u_lightColorGreen: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3(0.0, 3.0, 0.0)
      },
      u_lightPositionBlue: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3()
      },
      u_lightColorBlue: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3(1.0, 3.0, 3.0)
      },
      u_lightRadius: {
        type: Cesium.UniformType.FLOAT,
        value: 700.0
      }
    },
    fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 positionWC = fsInput.attributes.positionWC;
        vec3 normalEC = normalize(fsInput.attributes.normalEC);
        
        vec3 totalLight = vec3(0.0);

        // --- 红色光源 ---
        vec3 lightDirRed = u_lightPositionRed - positionWC;
        float distanceRed = length(lightDirRed);
        vec3 lightDirectionRed = normalize(lightDirRed);
        // 原始代码中使用 normalEC (眼坐标) 点乘 lightDirectionRed (世界坐标)，这是不严谨的，
        // 但为了还原效果保持原样，或者您可以取消下面这行的注释来修正坐标系：
        // vec3 normalWC = normalize(czm_inverseViewRotation * normalEC);
        // float diffuseFactorRed = max(dot(normalWC, lightDirectionRed), 0.9);
        float diffuseFactorRed = max(dot(normalEC, lightDirectionRed), 0.9);
        
        vec3 diffuseRed = diffuseFactorRed * u_lightColorRed;
        float distanceFactorRed = clamp(distanceRed / u_lightRadius, 0.2, 1.0);
        
        vec3 customRedColor = vec3(0.0, 0.1, 0.3); // 自定义底色
        vec3 mixedColorRed = mix(customRedColor, diffuseRed, 1.0 - distanceFactorRed);
        totalLight += mixedColorRed;

        // --- 绿色光源 ---
        vec3 lightDirGreen = u_lightPositionGreen - positionWC;
        float distanceGreen = length(lightDirGreen);
        vec3 lightDirectionGreen = normalize(lightDirGreen);
        float diffuseFactorGreen = max(dot(normalEC, lightDirectionGreen), 0.9);
        vec3 diffuseGreen = diffuseFactorGreen * u_lightColorGreen;
        float distanceFactorGreen = clamp(distanceGreen / u_lightRadius, 0.2, 1.0);
        
        vec3 customGreenColor = vec3(0.0, 0.1, 0.3);
        vec3 mixedColorGreen = mix(customGreenColor, diffuseGreen, 1.0 - distanceFactorGreen);
        totalLight += mixedColorGreen;

        // --- 蓝色光源 ---
        vec3 lightDirBlue = u_lightPositionBlue - positionWC;
        float distanceBlue = length(lightDirBlue);
        vec3 lightDirectionBlue = normalize(lightDirBlue);
        float diffuseFactorBlue = max(dot(normalEC, lightDirectionBlue), 0.9);
        vec3 diffuseBlue = diffuseFactorBlue * u_lightColorBlue;
        float distanceFactorBlue = clamp(distanceBlue / u_lightRadius, 0.2, 1.0);
        
        vec3 customBlueColor = vec3(0.0, 0.1, 0.3);
        vec3 mixedColorBlue = mix(customBlueColor, diffuseBlue, 1.0 - distanceFactorBlue);
        totalLight += mixedColorBlue;

        material.diffuse = totalLight;

        // --- 光环效果 ---
        float _baseHeight = 0.0; // 根据模型调整基准高度
        float _heightRange = 100.0;
        float _glowRange = 300.0;
        
        // 使用 positionMC.z 或 positionWC.z
        float vtxf_height = fsInput.attributes.positionMC.z - _baseHeight;
        
        float vtxf_a11 = fract(czm_frameNumber / 100.0) * 3.14159265 * 2.0;
        float vtxf_a12 = vtxf_height / _heightRange + sin(vtxf_a11) * 0.1;
        material.diffuse *= vec3(vtxf_a12, vtxf_a12, vtxf_a12);
        
        float vtxf_a13 = fract(czm_frameNumber / 360.0);
        float vtxf_h = clamp(vtxf_height / _glowRange, 0.0, 1.0);
        vtxf_a13 = abs(vtxf_a13 - 0.5) * 2.0;
        float vtxf_diff = step(0.005, abs(vtxf_h - vtxf_a13));
        material.diffuse += material.diffuse * (1.0 - vtxf_diff);
      }
    `
  });
};

// 更新光源位置
const updateLights = (time) => {
  if (!tileset || !tileset.customShader) return;

  const t = time / 2000.0;
  
  // 光源位置计算 (基于模型中心偏移)
  // 向左(西)移动 4500 米，向上(北)移动 1500 米
  const offsetX = -4500.0;
  const offsetY = 1500.0;
  
  // 红色：动态旋转
  const r = 0.0;
  const xRed = Math.cos(t) * r + offsetX;
  const yRed = Math.sin(t) * r + offsetY;
  
  // 绿色：固定偏移
  const xGreen = offsetX;
  const yGreen = offsetY;
  
  // 蓝色：固定偏移
  const xBlue = offsetX;
  const yBlue = offsetY;

  const centerCartesian = tileset.boundingSphere.center;
  const transform = Cesium.Transforms.eastNorthUpToFixedFrame(centerCartesian);
  
  const setLightPos = (uniformName, localX, localY) => {
    const localPos = new Cesium.Cartesian3(localX, localY, lightHeight.value);
    const worldPos = Cesium.Matrix4.multiplyByPoint(transform, localPos, new Cesium.Cartesian3());
    tileset.customShader.setUniform(uniformName, worldPos);
  };

  setLightPos('u_lightPositionRed', xRed, yRed);
  setLightPos('u_lightPositionGreen', xGreen, yGreen);
  setLightPos('u_lightPositionBlue', xBlue, yBlue);
  
  tileset.customShader.setUniform('u_lightRadius', lightIntensity.value * 100.0);
};

// 生成抛物线坐标
const getParabolaPositions = (startPosition, endPosition, height = 50000, count = 50) => {
  const result = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    // 线性插值
    const p = Cesium.Cartesian3.lerp(startPosition, endPosition, t, new Cesium.Cartesian3());
    
    // 计算抛物线高度偏移: h * 4 * t * (1 - t)
    const alt = height * 4 * t * (1 - t);
    
    // 沿地心方向抬升
    const pNorm = Cesium.Cartesian3.normalize(p, new Cesium.Cartesian3());
    const pMag = Cesium.Cartesian3.magnitude(p);
    const newP = Cesium.Cartesian3.multiplyByScalar(pNorm, pMag + alt, new Cesium.Cartesian3());
    
    result.push(newP);
  }
  return result;
};

// 添加城市流向线
const addCityFlow = () => {
  // 合肥 (117.227, 31.820) -> 上海 (121.473, 31.230)
  const start = Cesium.Cartesian3.fromDegrees(117.227, 31.820, 0);
  const end = Cesium.Cartesian3.fromDegrees(121.473, 31.230, 0);
  
  const positions = getParabolaPositions(start, end, 50000); // 高度 50km

  viewer.entities.add({
    name: 'CityFlow',
    polyline: {
      positions: positions,
      width: 5,
      material: new PolylineTrailMaterialProperty({
        color: Cesium.Color.fromCssColorString("#00FFFF"),
        duration: 3000,
        speed: 5.0
      })
    }
  });
};

onMounted(async () => {
  viewer = store.viewer;
  if (!viewer) return;

  try {
    tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl, {
      maximumScreenSpaceError: 1,
    });

    tileset.customShader = createCustomShader();
    viewer.scene.primitives.add(tileset);
    
    await viewer.zoomTo(tileset);

    // 添加流向线
    addCityFlow();

    // 调整更好的视角
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(117.32648, 31.820, 2500),
        orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-40),
            roll: 0
        }
    });

    // 开启循环更新
    viewer.scene.postUpdate.addEventListener(onPostUpdate);

  } catch (error) {
    console.error('Error loading tileset:', error);
  }
});

const onPostUpdate = (scene, time) => {
    updateLights(performance.now());
};

onUnmounted(() => {
  if (viewer) {
    if (tileset) {
      viewer.scene.primitives.remove(tileset);
    }
    viewer.scene.postUpdate.removeEventListener(onPostUpdate);
  }
});

watch([lightIntensity, lightHeight], () => {
    // 触发更新
});

</script>

<style scoped>
.effect-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  background: white;
  color: black;
  padding: 15px;
  border-radius: 8px;
  width: 250px;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  padding-bottom: 5px;
}

.control-group {
  margin-bottom: 15px;
}

.control-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
}

input[type="range"] {
  width: 100%;
}

.info {
  font-size: 12px;
  color: #aaa;
  margin-top: 10px;
}

.info p {
  margin: 3px 0;
}
</style>
