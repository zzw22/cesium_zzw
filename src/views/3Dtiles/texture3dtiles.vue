<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-4 font-bold border-b pb-2">3D Tiles 贴图叠加</div>
    <div class="text-xs text-gray-500 mb-2">CustomShader 效果演示</div>
    <div class="space-y-2">
        <button @click="applyGradientShader" class="block w-full bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition cursor-pointer">纯渐变色</button>
        <button @click="applyGradientGlowShader" class="block w-full bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition cursor-pointer">渐变+动态光圈</button>
        <button @click="applyTechGridShader" class="block w-full bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition cursor-pointer">科技网格</button>
        <button @click="applyFlowingLightShader" class="block w-full bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 transition cursor-pointer">流光特效</button>
        <button @click="clearShader" class="block w-full bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition cursor-pointer">清除</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

let viewer = null;
let tileset = null;
// 使用上海建筑物数据
const tilesetUrl = 'https://data.mars3d.cn/3dtiles/jzw-shanghai/tileset.json';

const loadTileset = async () => {
  try {
    tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl, {
      maximumScreenSpaceError: 16,
    });
    
    viewer.scene.primitives.add(tileset);
    
    await viewer.zoomTo(tileset);
    
    // 调整视角
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(121.49, 31.23, 2000),
        orientation: {
            heading: Cesium.Math.toRadians(180),
            pitch: Cesium.Math.toRadians(-30),
            roll: 0
        }
    });

  } catch (error) {
    console.error('Error loading tileset:', error);
  }
};

// 纯渐变色
const applyGradientShader = () => {
    if (!tileset) return;
    const customShader = new Cesium.CustomShader({
        lightingModel: Cesium.LightingModel.UNLIT,
        fragmentShaderText: `
            void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                vec3 positionMC = fsInput.attributes.positionMC;
                // 注意：这里假设Z轴是高度方向，根据实际模型坐标系调整 (原示例是Y轴)
                material.diffuse = vec3(0.0, 1.0 - positionMC.z * 0.005, 1.0 - positionMC.z * 0.0015);
            }
        `
    });
    tileset.customShader = customShader;
};

// 纯渐变色+动态光圈
const applyGradientGlowShader = () => {
    if (!tileset) return;
    const customShader = new Cesium.CustomShader({
        lightingModel: Cesium.LightingModel.UNLIT,
        fragmentShaderText: `
            void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                vec3 positionMC = fsInput.attributes.positionMC;
                // 基础渐变
                material.diffuse = vec3(0.0, 1.0 - positionMC.z * 0.005, 1.0 - positionMC.z * 0.0015);

                float _baseHeight = 0.0; // 物体的基础高度
                float _heightRange = 60.0; // 高亮的范围
                float _glowRange = 200.0; // 光环的移动范围(高度)

                float vtxf_height = fsInput.attributes.positionMC.z - _baseHeight;
                float vtxf_a11 = fract(czm_frameNumber / 360.0) * 3.14159265 * 2.0; // 速度
                float vtxf_a12 = vtxf_height / _heightRange + sin(vtxf_a11) * 0.1;
                material.diffuse *= vec3(vtxf_a12, vtxf_a12, vtxf_a12);

                float vtxf_a13 = fract(czm_frameNumber / 360.0);
                float vtxf_h = clamp(vtxf_height / _glowRange, 0.0, 1.0);
                vtxf_a13 = abs(vtxf_a13 - 0.5) * 2.0;
                float vtxf_diff = step(0.01, abs(vtxf_h - vtxf_a13)); // 光条粗细
                material.diffuse += material.diffuse * (1.0 - vtxf_diff);
            }
        `
    });
    tileset.customShader = customShader;
};

// 科技网格
const applyTechGridShader = () => {
    if (!tileset) return;
    const customShader = new Cesium.CustomShader({
        lightingModel: Cesium.LightingModel.UNLIT,
        fragmentShaderText: `
            void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                vec3 positionMC = fsInput.attributes.positionMC;
                
                // 基础深色背景
                vec3 baseColor = vec3(0.05, 0.05, 0.1);
                
                // 网格线颜色
                vec3 gridColor = vec3(0.0, 1.0, 1.0);
                
                // 网格间距
                float spacing = 10.0;
                
                // 动态扫描线 (沿Z轴上升)
                float scanLine = fract(czm_frameNumber / 200.0) * 200.0; // 扫描范围
                float scanWidth = 5.0;
                
                // 计算网格
                // 使用 fract 函数判断是否在网格线上
                float lineX = step(0.95, fract(positionMC.x / spacing));
                float lineY = step(0.95, fract(positionMC.y / spacing));
                float lineZ = step(0.95, fract(positionMC.z / spacing));
                
                // 混合网格
                float grid = max(max(lineX, lineY), lineZ);
                
                // 扫描线效果
                float scan = 0.0;
                if (positionMC.z > scanLine && positionMC.z < scanLine + scanWidth) {
                    scan = 1.0;
                }
                
                // 最终颜色混合
                vec3 finalColor = mix(baseColor, gridColor, grid * 0.5); // 网格半透明
                finalColor = mix(finalColor, vec3(1.0, 1.0, 0.0), scan * 0.8); // 叠加扫描线
                
                material.diffuse = finalColor;
                material.alpha = 0.9;
            }
        `
    });
    tileset.customShader = customShader;
};

// 流光特效
const applyFlowingLightShader = () => {
    if (!tileset) return;
    const customShader = new Cesium.CustomShader({
        lightingModel: Cesium.LightingModel.UNLIT,
        fragmentShaderText: `
            void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                vec3 positionMC = fsInput.attributes.positionMC;
                
                // 基础颜色 (紫色调)
                vec3 color1 = vec3(0.5, 0.0, 1.0);
                // 流光颜色 (青色调)
                vec3 color2 = vec3(0.0, 1.0, 1.0);
                
                // 计算流光因子
                // positionMC.z / 50.0 控制条纹密度
                // czm_frameNumber / 60.0 控制流动速度
                float t = fract(positionMC.z / 50.0 - czm_frameNumber / 120.0);
                
                // 使用 smoothstep 制作柔和的流光带
                float flow = smoothstep(0.0, 0.2, t) - smoothstep(0.3, 0.5, t);
                flow = max(0.0, flow); // 确保非负
                
                // 顶部发光
                float topGlow = smoothstep(50.0, 100.0, positionMC.z);
                
                vec3 finalColor = mix(color1, color2, flow);
                finalColor += vec3(1.0) * topGlow * 0.5; // 顶部叠加白光
                
                material.diffuse = finalColor;
            }
        `
    });
    tileset.customShader = customShader;
};

// 清除
const clearShader = () => {
    if (!tileset) return;
    tileset.customShader = undefined;
};

onMounted(() => {
  const store = useCesiumStore();
  viewer = store.viewer;
  if (!viewer) return;
  
  loadTileset();
});

useCesiumCleanup(() => {
  if (viewer && tileset) {
    viewer.scene.primitives.remove(tileset);
  }
});
</script>
