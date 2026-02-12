<!--
 * @Title: 实体聚集示例
 * @Description: 演示海量点数据的聚合效果
-->
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10">
    <div class="mb-4 font-bold border-b pb-2">实体聚集</div>
    <div class="flex items-center space-x-2">
      <span class="text-sm">启用聚集</span>
      <el-switch v-model="clusteringEnabled" @change="toggleClustering" />
    </div>
    <div class="mt-2 text-xs text-gray-500">
      当前点数量: {{ pointCount }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';
import { useCesiumCleanup } from '@/hooks/useCesiumCleanup';

const clusteringEnabled = ref(true);
const pointCount = ref(5000);
let dataSource = null;
let viewer = null;

onMounted(async () => {
  const store = useCesiumStore();
  viewer = store.viewer;
  
  if (!viewer) return;

  // 生成随机点数据 (GeoJSON格式)
  const features = [];
  // 武汉大概坐标 114.30, 30.60
  for (let i = 0; i < pointCount.value; i++) {
    const lon = 114.1 + Math.random() * 0.5;
    const lat = 30.4 + Math.random() * 0.5;
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      properties: {
        id: i,
        name: `Point ${i}`
      }
    });
  }

  const geoJson = {
    type: 'FeatureCollection',
    features: features
  };

  try {
    dataSource = await Cesium.GeoJsonDataSource.load(geoJson);
    
    // 设置点的样式
    const entities = dataSource.entities.values;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      entity.billboard = undefined;
      entity.point = new Cesium.PointGraphics({
        color: Cesium.Color.fromRandom({ alpha: 1.0 }),
        pixelSize: 10,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2
      });
    }

    // 配置聚集参数
    configureClustering(dataSource);

    viewer.dataSources.add(dataSource);
    viewer.flyTo(dataSource);

  } catch (error) {
    console.error('Error loading data:', error);
  }
});

const configureClustering = (ds) => {
  const pixelRange = 15;
  const minimumClusterSize = 3;
  const enabled = clusteringEnabled.value;

  ds.clustering.enabled = enabled;
  ds.clustering.pixelRange = pixelRange;
  ds.clustering.minimumClusterSize = minimumClusterSize;

  // 自定义聚集样式
  ds.clustering.clusterEvent.addEventListener((entities, cluster) => {
    // 隐藏 label，因为数字已经绘制在圆圈上了
    cluster.label.show = false;

    cluster.billboard.show = true;
    cluster.billboard.verticalOrigin = Cesium.VerticalOrigin.CENTER;
    cluster.billboard.horizontalOrigin = Cesium.HorizontalOrigin.CENTER;
    
    // 根据数量改变颜色和大小
    if (entities.length >= 100) {
        cluster.billboard.image = generateClusterCircle(Cesium.Color.RED, 44, entities.length);
    } else if (entities.length >= 50) {
        cluster.billboard.image = generateClusterCircle(Cesium.Color.ORANGE, 38, entities.length);
    } else {
        cluster.billboard.image = generateClusterCircle(Cesium.Color.BLUE, 32, entities.length);
    }
  });
};

const generateClusterCircle = (color, size, count) => {
    // 增加画布尺寸，确保圆不会被裁剪
    const canvasSize = size + 4;
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    
    const center = canvasSize / 2;
    const radius = size / 2;
    
    // 绘制圆
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fillStyle = color.toCssColorString();
    ctx.fill();
    
    // 添加白色边框
    ctx.beginPath();
    ctx.arc(center, center, radius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制数字
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = count >= 1000 ? '999+' : count.toString();
    ctx.fillText(text, center, center);
    
    return canvas;
};

const toggleClustering = (val) => {
  if (dataSource) {
    dataSource.clustering.enabled = val;
  }
};

useCesiumCleanup(() => {
  if (viewer && dataSource) {
    viewer.dataSources.remove(dataSource);
    dataSource = null;
  }
});
</script>
