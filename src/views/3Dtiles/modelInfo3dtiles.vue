<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10 w-80">
    <div class="mb-4 font-bold border-b pb-2">3D Tiles 模型详情</div>
    <div class="text-xs text-gray-500 mb-2">点击模型查看属性信息</div>
    
    <div v-if="selectedFeatureInfo" class="max-h-96 overflow-y-auto">
      <div v-for="(value, key) in selectedFeatureInfo" :key="key" class="mb-1 text-sm border-b border-gray-100 pb-1">
        <span class="font-semibold text-gray-700">{{ key }}:</span>
        <span class="ml-2 text-gray-600 break-words">{{ value }}</span>
      </div>
    </div>
    <div v-else class="text-sm text-gray-400 italic">
      暂未选择模型
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

const selectedFeatureInfo = ref(null);
let viewer = null;
let tileset = null;
let handler = null;
let highlightedFeature = null;

const tilesetUrl = 'https://data.mars3d.cn/3dtiles/jzw-shanghai/tileset.json';

const loadTileset = async () => {
  try {
    tileset = await Cesium.Cesium3DTileset.fromUrl(tilesetUrl, {
      maximumScreenSpaceError: 1,
    });

    // 调整模型高度，使其接地
    const cartographic = Cesium.Cartographic.fromCartesian(tileset.boundingSphere.center);
    const surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
    const offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, -20.0);
    const translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
    tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);

    viewer.scene.primitives.add(tileset);

    await viewer.zoomTo(tileset);

    viewer.camera.flyToBoundingSphere(tileset.boundingSphere, {
        offset: new Cesium.HeadingPitchRange(
            Cesium.Math.toRadians(0),
            Cesium.Math.toRadians(-30),
            tileset.boundingSphere.radius * 2.0
        )
    });

    initInteraction();

  } catch (error) {
    console.error('Error loading tileset:', error);
  }
};

const initInteraction = () => {
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    
    handler.setInputAction(function onLeftClick(movement) {
        // 清除之前的高亮
        if (highlightedFeature) {
            highlightedFeature.color = Cesium.Color.WHITE;
            highlightedFeature = null;
        }
        
        const pickedFeature = viewer.scene.pick(movement.position);
        
        if (Cesium.defined(pickedFeature) && pickedFeature instanceof Cesium.Cesium3DTileFeature) {
            // 高亮选中
            highlightedFeature = pickedFeature;
            pickedFeature.color = Cesium.Color.BLUE.withAlpha(0.5);
            
            // 获取属性
            const info = {};
            // 基础信息
            if (pickedFeature.featureId !== undefined) {
                 info['Feature ID'] = pickedFeature.featureId;
            }
            
            console.log('Picked Feature Object:', pickedFeature);

            try {
                let propertyNames = [];
                
                // 1. 尝试标准方法 pickedFeature.getPropertyNames()
                if (typeof pickedFeature.getPropertyNames === 'function') {
                    propertyNames = pickedFeature.getPropertyNames();
                } 
                // 2. 尝试通过 content.batchTable 获取 (如果存在且有该方法)
                else if (pickedFeature.content && pickedFeature.content.batchTable && typeof pickedFeature.content.batchTable.getPropertyNames === 'function') {
                    propertyNames = pickedFeature.content.batchTable.getPropertyNames(pickedFeature.featureId);
                }
                // 3. 尝试访问私有属性 _content._batchTable._properties (Hack 方式，应对某些特殊情况)
                else if (pickedFeature._content && pickedFeature._content.batchTable && pickedFeature._content.batchTable._properties) {
                    propertyNames = Object.keys(pickedFeature._content.batchTable._properties);
                }
                // 4. 另一种私有结构可能是 _batchTable._properties
                else if (pickedFeature._batchTable && pickedFeature._batchTable._properties) {
                    propertyNames = Object.keys(pickedFeature._batchTable._properties);
                }

                if (propertyNames && propertyNames.length > 0) {
                    for (let i = 0; i < propertyNames.length; ++i) {
                        const name = propertyNames[i];
                        // 确保 getProperty 存在
                        if (typeof pickedFeature.getProperty === 'function') {
                            const value = pickedFeature.getProperty(name);
                            info[name] = value;
                        } else {
                             // 如果没有 getProperty，尝试直接访问 _batchTable (Hack)
                             // 这里比较复杂，暂不深入，避免更多错误
                        }
                    }
                } else {
                    info['提示'] = '无法获取详细属性列表，请查看控制台 Picked Feature Object';
                    // 尝试盲猜一些常见属性
                    const commonProps = ['name', 'Name', 'id', 'ID', 'height', 'Height'];
                    if (typeof pickedFeature.getProperty === 'function') {
                        commonProps.forEach(prop => {
                            try {
                                const val = pickedFeature.getProperty(prop);
                                if (val !== undefined) {
                                    info[prop] = val;
                                }
                            } catch(err) {}
                        });
                    }
                }
            } catch (e) {
                console.error('Error extracting properties:', e);
                info['Error'] = '属性读取出错: ' + e.message;
            }
            
            selectedFeatureInfo.value = info;
        } else {
            selectedFeatureInfo.value = null;
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
};

onMounted(() => {
  const store = useCesiumStore();
  viewer = store.viewer;
  if (!viewer) return;
  
  loadTileset();
});

useCesiumCleanup(() => {
  if (viewer) {
    if (tileset) {
      viewer.scene.primitives.remove(tileset);
    }
    if (handler) {
        handler.destroy();
        handler = null;
    }
    if (highlightedFeature) {
        highlightedFeature = null;
    }
  }
});
</script>