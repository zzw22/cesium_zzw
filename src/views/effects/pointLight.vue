<template>
  <div class="effect-panel">
    <h3>点光源效果</h3>
    <div class="control-group">
      <label>光照强度:</label>
      <input
        type="range"
        min="0.1"
        max="10.0"
        step="0.1"
        v-model.number="lightIntensity"
      />
    </div>
    <div class="control-group">
      <label>光源高度:</label>
      <input
        type="range"
        min="10"
        max="500"
        step="10"
        v-model.number="lightHeight"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { CircleGradientMaterialProperty } from "@/utils/cesium";

const store = useCesiumStore();
let tileset = null;
let viewer = null;
let handler = null;
const lightIntensity = ref(6.0);
const lightHeight = ref(100);
const lightEntities = {
  red: null,
  green: null,
  blue: null,
};

// 合肥白膜数据 (常用测试数据)
const tilesetUrl = "https://data.mars3d.cn/3dtiles/jzw-hefei/tileset.json";

// 创建 CustomShader
const createCustomShader = () => {
  return new Cesium.CustomShader({
    mode: Cesium.CustomShaderMode.REPLACE_MATERIAL,
    lightingModel: Cesium.LightingModel.UNLIT, // 我们自己计算光照
    uniforms: {
      u_lightPositionRed: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3(),
      },
      u_lightColorRed: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3(3.0, 0.0, 0.0),
      },
      u_lightPositionGreen: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3(),
      },
      u_lightColorGreen: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3(0.0, 3.0, 0.0),
      },
      u_lightPositionBlue: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3(),
      },
      u_lightColorBlue: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3(1.0, 3.0, 3.0),
      },
      u_extraLightPosition: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3(),
      },
      u_extraLightColor: {
        type: Cesium.UniformType.VEC3,
        value: new Cesium.Cartesian3(0.0, 0.0, 0.0), // 默认黑色关闭
      },
      u_lightRadius: {
        type: Cesium.UniformType.FLOAT,
        value: 700.0,
      },
    },
    fragmentShaderText: `
      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 positionWC = (czm_model * vec4(fsInput.attributes.positionMC, 1.0)).xyz;
        vec3 normalEC = normalize(fsInput.attributes.normalEC);
        vec3 totalLight = vec3(0.0);

        // 计算红色光源
        vec3 lightDirRed = u_lightPositionRed - positionWC;
        float distanceRed = length(lightDirRed);
        vec3 lightDirectionRed = normalize(lightDirRed);
        float diffuseFactorRed = max(dot(normalEC, lightDirectionRed), 0.9);
        vec3 diffuseRed = diffuseFactorRed * u_lightColorRed;
        float distanceFactorRed = clamp(distanceRed / u_lightRadius, 0.2, 1.0);
        
        vec3 customRedColor = vec3(0.0, 0.1, 0.3); // 自定义颜色
        vec3 mixedColorRed = mix(customRedColor, diffuseRed, 1.0 - distanceFactorRed);
        totalLight += mixedColorRed;

        // 计算绿色光源
        vec3 lightDirGreen = u_lightPositionGreen - positionWC;
        float distanceGreen = length(lightDirGreen);
        vec3 lightDirectionGreen = normalize(lightDirGreen);
        float diffuseFactorGreen = max(dot(normalEC, lightDirectionGreen), 0.9);
        vec3 diffuseGreen = diffuseFactorGreen * u_lightColorGreen;
        float distanceFactorGreen = clamp(distanceGreen / u_lightRadius, 0.2, 1.0);
        
        vec3 customGreenColor = vec3(0,0.1,0.3); // 自定义颜色
        vec3 mixedColorGreen = mix(customGreenColor, diffuseGreen, 1.0 - distanceFactorGreen);
        totalLight += mixedColorGreen;

        // 计算蓝色光源
        vec3 lightDirBlue = u_lightPositionBlue - positionWC;
        float distanceBlue = length(lightDirBlue);
        vec3 lightDirectionBlue = normalize(lightDirBlue);
        float diffuseFactorBlue = max(dot(normalEC, lightDirectionBlue), 0.9);
        vec3 diffuseBlue = diffuseFactorBlue * u_lightColorBlue;
        float distanceFactorBlue = clamp(distanceBlue / u_lightRadius, 0.2, 1.0);
        
        vec3 customBlueColor = vec3(0,0.1,0.3); // 自定义颜色
        vec3 mixedColorBlue = mix(customBlueColor, diffuseBlue, 1.0 - distanceFactorBlue);
        totalLight += mixedColorBlue;

        // 计算额外点击光源
        vec3 lightDirExtra = u_extraLightPosition - positionWC;
        float distanceExtra = length(lightDirExtra);
        vec3 lightDirectionExtra = normalize(lightDirExtra);
        float diffuseFactorExtra = max(dot(normalEC, lightDirectionExtra), 0.9);
        vec3 diffuseExtra = diffuseFactorExtra * u_extraLightColor;
        float distanceFactorExtra = clamp(distanceExtra / u_lightRadius, 0.2, 1.0);
        vec3 mixedColorExtra = mix(vec3(0.0), diffuseExtra, 1.0 - distanceFactorExtra);
        totalLight += mixedColorExtra;

        material.diffuse = totalLight;

        // 计算光环效果
        float _baseHeight = -10.0;
        float _heightRange = 100.0;
        float _glowRange = 300.0;
        
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
    `,
  });
};

// 更新光源位置
const updateLights = (time) => {
  if (!tileset || !tileset.customShader) return;

  const lightPositionRed = Cesium.Cartesian3.fromDegrees(
    117.23585,
    31.83864,
    lightHeight.value
  );

  const lightPositionGreen = Cesium.Cartesian3.fromDegrees(
    117.21589,
    31.840009,
    lightHeight.value
  );

  const lightPositionBlue = Cesium.Cartesian3.fromDegrees(
    117.213929,
    31.8500233,
    lightHeight.value
  );

  // 设置光源位置
  tileset.customShader.setUniform('u_lightPositionRed', lightPositionRed);
  tileset.customShader.setUniform('u_lightPositionGreen', lightPositionGreen);
  tileset.customShader.setUniform('u_lightPositionBlue', lightPositionBlue);
  
  // 更新或创建扩散点 Entity
  updateLightEntity('red', lightPositionRed);
  updateLightEntity('green', lightPositionGreen);
  updateLightEntity('blue', lightPositionBlue);
  
  tileset.customShader.setUniform('u_lightRadius', lightIntensity.value * 100.0);
};

// 更新光源实体
const updateLightEntity = (colorName, position) => {
  if (!lightEntities[colorName]) {
    const materialColor = Cesium.Color.WHITE;
    lightEntities[colorName] = viewer.entities.add({
      position: position,
      ellipse: {
        semiMajorAxis: 500.0,
        semiMinorAxis: 500.0,
        height: lightHeight.value,
        material: new CircleGradientMaterialProperty(materialColor)
      }
    });
  } else {
    lightEntities[colorName].position = position;
    lightEntities[colorName].ellipse.height = lightHeight.value;
  }
};

onMounted(async () => {
  viewer = store.viewer;
  if (!viewer) return;

  // 添加底图设置
  const xyz = new Cesium.UrlTemplateImageryProvider({
    "url": '//data.mars3d.cn/tile/img/{z}/{x}/{y}.jpg'
  });
  viewer.imageryLayers.addImageryProvider(xyz);
  viewer.imageryLayers.remove(viewer.imageryLayers.get(0));

  try {
    tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl, {
      maximumScreenSpaceError: 1,
    });

    tileset.customShader = createCustomShader();
    viewer.scene.primitives.add(tileset);
    
    await viewer.zoomTo(tileset);

    // 调整更好的视角
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(117.23, 31.84, 2500),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-40),
        roll: 0,
      },
    });

    // 开启循环更新
    viewer.scene.postUpdate.addEventListener(onPostUpdate);

    // 绑定点击事件
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const cartesian = viewer.scene.pickPosition(movement.position);

      if (cartesian) {
        console.log("Picked position:", cartesian);

        // 正确计算抬高后的位置：转为经纬度(Cartographic)，增加高度，再转回 Cartesian3
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        cartographic.height += 50.0; // 抬高 50 米
        const lightPos = Cesium.Cartographic.toCartesian(cartographic);

        // 更新 Shader Uniform
        tileset.customShader.setUniform("u_extraLightPosition", lightPos);
        tileset.customShader.setUniform(
          "u_extraLightColor",
          new Cesium.Cartesian3(3.0, 0.0, 0.0),
        ); // 与红色光源颜色一致

        // 添加/更新扩散点实体
        const materialColor = new Cesium.Color(1.0, 0.0, 0.0, 0.2);
        if (!lightEntities.extra) {
          lightEntities.extra = viewer.entities.add({
            position: lightPos,
            ellipse: {
              semiMajorAxis: 500.0,
              semiMinorAxis: 500.0,
              height: cartographic.height,
              material: new CircleGradientMaterialProperty(materialColor),
            },
          });
        } else {
          lightEntities.extra.position = lightPos;
          lightEntities.extra.ellipse.height = cartographic.height;
        }
      } else {
        console.log("Pick failed");
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  } catch (error) {
    console.error("Error loading tileset:", error);
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

    // 清理 Entity
    Object.values(lightEntities).forEach((entity) => {
      if (entity) viewer.entities.remove(entity);
    });
    lightEntities.red = null;
    lightEntities.green = null;
    lightEntities.blue = null;
    lightEntities.extra = null;

    if (handler) {
      handler.destroy();
      handler = null;
    }
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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
</style>
