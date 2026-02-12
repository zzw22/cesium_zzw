<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-4 font-bold border-b pb-2">3D Tiles 贴图叠加</div>
    <div class="text-xs text-gray-500 mb-2">CustomShader 效果演示</div>
    <div class="space-y-2">
        <button @click="applyGradientShader" class="texture-btn texture-btn--blue">纯渐变色</button>
        <button @click="applyGradientGlowShader" class="texture-btn texture-btn--green">渐变+动态光圈</button>
        <button @click="applyTechGridShader" class="texture-btn texture-btn--purple">科技网格</button>
        <button @click="applyFlowingLightShader" class="texture-btn texture-btn--indigo">流光特效</button>
        <button @click="clearShader" class="texture-btn texture-btn--gray">清除</button>
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

    // 调整模型高度，使其接地
    const cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
    const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
    const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, -20.0);
    const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

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

// 科技网格 - 带纹理贴图
const applyTechGridShader = () => {
    if (!tileset) return;
    const customShader = new Cesium.CustomShader({
        lightingModel: Cesium.LightingModel.UNLIT,
        varyings: {
            v_normalMC: Cesium.VaryingType.VEC3,
            v_posMC: Cesium.VaryingType.VEC3
        },
        uniforms: {
            u_texture: {
                value: new Cesium.TextureUniform({
                    url: new URL('@/assets/images/wall.jpg', import.meta.url).href
                }),
                type: Cesium.UniformType.SAMPLER_2D
            }
        },
        vertexShaderText: `
            void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
                v_normalMC = vsInput.attributes.normalMC;
                v_posMC = vsInput.attributes.positionMC;
            }
        `,
        fragmentShaderText: `
            void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                vec3 positionMC = v_posMC;

                // 屋顶颜色（当法向量与Z轴接近平行时，判定为屋顶）
                if (dot(vec3(0.0, 0.0, 1.0), v_normalMC) > 0.95) {
                    material.diffuse = vec3(0.85, 0.85, 0.85);
                } else {
                    // 贴图尺寸设置
                    float width = 30.0;
                    float height = 50.0;

                    float textureX = 0.0;
                    float dotYAxis = dot(vec3(0.0, 1.0, 0.0), v_normalMC);

                    // 根据面的朝向选择贴图坐标
                    if (dotYAxis > 0.71 || dotYAxis < -0.71) {
                        // 前后面使用X坐标
                        textureX = mod(positionMC.x, width) / width;
                    } else {
                        // 左右面使用Y坐标
                        textureX = mod(positionMC.y, width) / width;
                    }
                    float textureY = mod(positionMC.z, height) / height;

                    // 应用纹理
                    vec3 rgb = texture(u_texture, vec2(textureX, textureY)).rgb;
                    material.diffuse = rgb;

                    // 科技网格线叠加
                    float spacingXY = 15.0;
                    float lineX = step(0.97, fract(positionMC.x / spacingXY));
                    float lineY = step(0.97, fract(positionMC.y / spacingXY));
                    float grid = max(lineX, lineY);

                    // 动态扫描线效果
                    float _baseHeight = 0.0;
                    float _glowRange = 120.0;
                    float vtxf_height = positionMC.z - _baseHeight;
                    float vtxf_a13 = fract(czm_frameNumber / 360.0);
                    float vtxf_h = clamp(vtxf_height / _glowRange, 0.0, 1.0);
                    vtxf_a13 = abs(vtxf_a13 - 0.5) * 2.0;
                    float vtxf_diff = step(0.02, abs(vtxf_h - vtxf_a13));

                    // 混合网格和扫描线
                    vec3 gridColor = vec3(0.0, 0.8, 1.0);
                    material.diffuse = mix(material.diffuse, gridColor, grid * 0.3);
                    material.diffuse += material.diffuse * (1.0 - vtxf_diff) * 0.5;
                }
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

<style scoped>
.texture-btn {
  display: block;
  width: 100%;
  color: #ffffff;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  transition: background-color 150ms;
  cursor: pointer;
  border: none;
}

.texture-btn--blue { background: #3b82f6; }
.texture-btn--blue:hover { background: #2563eb; }

.texture-btn--green { background: #22c55e; }
.texture-btn--green:hover { background: #16a34a; }

.texture-btn--purple { background: #a855f7; }
.texture-btn--purple:hover { background: #9333ea; }

.texture-btn--indigo { background: #6366f1; }
.texture-btn--indigo:hover { background: #4f46e5; }

.texture-btn--gray { background: #6b7280; }
.texture-btn--gray:hover { background: #4b5563; }
</style>
