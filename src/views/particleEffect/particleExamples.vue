<!--
 * @Title: 粒子系统示例
 * @Description: 演示火焰、烟雾、水枪、爆炸、喷雾等粒子效果
-->
<template>
  <div class="absolute top-4 left-4 bg-white p-4 rounded shadow z-10 w-64">
    <div class="mb-4 font-bold border-b pb-2">粒子特效</div>

    <div class="space-y-2">
      <div
        v-for="effect in effects"
        :key="effect.id"
        class="flex items-center justify-between"
      >
        <span class="text-sm">{{ effect.name }}</span>
        <el-switch
          v-model="effect.enabled"
          @change="(val) => toggleEffect(effect.id, val)"
          size="small"
        />
      </div>
    </div>

    <div class="mt-4 text-xs text-gray-500">提示：粒子效果基于武汉大学区域</div>

    <el-button class="mt-4 w-full" size="small" @click="clearAll"
      >清除所有</el-button
    >
  </div>
</template>

<script setup>
import { onMounted, ref, reactive, onUnmounted } from "vue";
import { useCesiumStore } from "@/store/cesiumStore";
import * as Cesium from "cesium";
import { useCesiumCleanup } from "@/hooks/useCesiumCleanup";

// 导入图片资源
import fireImg from "@/assets/images/fire.png";
import smokeImg from "@/assets/images/smoke.png";
import waterImg from "@/assets/images/water.png";

let viewer = null;
const activeParticles = new Map();

const effects = reactive([
  { id: "fire", name: "火焰", enabled: false },
  { id: "smoke", name: "烟雾", enabled: false },
  { id: "water", name: "水枪", enabled: false },
  { id: "explosion", name: "爆炸", enabled: false },
  { id: "fountain", name: "喷雾/喷泉", enabled: false },
]);

// 粒子位置配置 (武汉大学附近) - 提高高度以防被地形遮挡
const locations = {
  fire: Cesium.Cartesian3.fromDegrees(114.36, 30.54, 50),
  smoke: Cesium.Cartesian3.fromDegrees(114.362, 30.54, 50),
  water: Cesium.Cartesian3.fromDegrees(114.364, 30.54, 80),
  explosion: Cesium.Cartesian3.fromDegrees(114.366, 30.54, 150),
  fountain: Cesium.Cartesian3.fromDegrees(114.368, 30.54, 50),
};

onMounted(() => {
  const store = useCesiumStore();
  viewer = store.viewer;

  if (viewer) {
    viewer.clock.shouldAnimate = true; // 确保时间流动，粒子系统依赖时间轴
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(114.364, 30.535, 1000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
    });
  } else {
    console.warn("Cesium viewer not initialized");
  }
});

// 辅助函数：生成简单的粒子纹理，避免图片加载失败导致无效果
const generateParticleCanvas = (type) => {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  if (type === "fire" || type === "explosion") {
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.5, "rgba(255, 200, 0, 0.8)");
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
  } else if (type === "smoke") {
    gradient.addColorStop(0, "rgba(200, 200, 200, 1)");
    gradient.addColorStop(1, "rgba(100, 100, 100, 0)");
  } else {
    gradient.addColorStop(0, "rgba(200, 200, 255, 1)");
    gradient.addColorStop(1, "rgba(0, 0, 255, 0)");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  return canvas;
};

const toggleEffect = (id, enabled) => {
  if (!viewer) {
    viewer = useCesiumStore().viewer;
    if (!viewer) return;
  }

  if (enabled) {
    createParticleSystem(id);
  } else {
    removeParticleSystem(id);
  }
};

const createParticleSystem = (id) => {
  removeParticleSystem(id); // 防止重复

  let particleSystem;
  const position = locations[id];
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(position);

  // 预定义的重力向量 (用于复用)
  const gravityScratch = new Cesium.Cartesian3();
  const gravityVector = new Cesium.Cartesian3(0.0, 0.0, -9.8);

  switch (id) {
    case "fire":
      particleSystem = new Cesium.ParticleSystem({
        image: fireImg || generateParticleCanvas("fire"),
        startColor: Cesium.Color.RED.withAlpha(0.7),
        endColor: Cesium.Color.YELLOW.withAlpha(0.3),
        startScale: 1.0,
        endScale: 5.0,
        minimumParticleLife: 1.2,
        maximumParticleLife: 1.2,
        minimumSpeed: 1.0,
        maximumSpeed: 4.0,
        imageSize: new Cesium.Cartesian2(20, 20),
        emissionRate: 20.0,
        bursts: [
          new Cesium.ParticleBurst({ time: 5.0, minimum: 10, maximum: 100 }),
          new Cesium.ParticleBurst({ time: 10.0, minimum: 50, maximum: 100 }),
          new Cesium.ParticleBurst({ time: 15.0, minimum: 200, maximum: 300 }),
        ],
        lifetime: 16.0,
        emitter: new Cesium.CircleEmitter(2.0),
        modelMatrix: modelMatrix,
      });
      break;

    case "smoke":
      particleSystem = new Cesium.ParticleSystem({
        image: smokeImg || generateParticleCanvas("smoke"),
        startColor: Cesium.Color.GRAY.withAlpha(0.7),
        endColor: Cesium.Color.WHITE.withAlpha(0.0),
        startScale: 1.0,
        endScale: 8.0,
        minimumParticleLife: 1.2,
        maximumParticleLife: 3.2,
        minimumSpeed: 1.0,
        maximumSpeed: 3.0,
        imageSize: new Cesium.Cartesian2(25, 25),
        emissionRate: 15.0,
        emitter: new Cesium.CircleEmitter(2.0),
        modelMatrix: modelMatrix,
      });
      break;

    case "water":
      particleSystem = new Cesium.ParticleSystem({
        image: waterImg || generateParticleCanvas("water"),
        startColor: new Cesium.Color(0.5, 0.8, 1.0, 0.8),
        endColor: new Cesium.Color(0.8, 0.9, 1.0, 0.2),
        startScale: 1.0,
        endScale: 1.0,
        minimumParticleLife: 1.5,
        maximumParticleLife: 2.0,
        minimumSpeed: 15.0,
        maximumSpeed: 20.0,
        imageSize: new Cesium.Cartesian2(10, 10),
        emissionRate: 50.0,
        emitter: new Cesium.CircleEmitter(0.5),
        modelMatrix: modelMatrix,
        updateCallback: (p, dt) => {
          // 更新速度以模拟重力
          Cesium.Cartesian3.multiplyByScalar(gravityVector, dt, gravityScratch);
          Cesium.Cartesian3.add(p.velocity, gravityScratch, p.velocity);
        },
      });
      break;

    case "explosion":
      particleSystem = new Cesium.ParticleSystem({
        image: fireImg || generateParticleCanvas("fire"),
        startColor: Cesium.Color.ORANGE.withAlpha(0.7),
        endColor: Cesium.Color.RED.withAlpha(0.0),
        startScale: 5.0,
        endScale: 10.0,
        minimumParticleLife: 0.5,
        maximumParticleLife: 1.0,
        minimumSpeed: 10.0,
        maximumSpeed: 30.0,
        imageSize: new Cesium.Cartesian2(30, 30),
        emissionRate: 5.0,
        bursts: [
          new Cesium.ParticleBurst({ time: 0.0, minimum: 50, maximum: 100 }),
          new Cesium.ParticleBurst({ time: 2.0, minimum: 50, maximum: 100 }),
        ],
        lifetime: 4.0,
        emitter: new Cesium.SphereEmitter(5.0),
        modelMatrix: modelMatrix,
      });
      break;

    case "fountain":
      particleSystem = new Cesium.ParticleSystem({
        image: waterImg || generateParticleCanvas("water"),
        startColor: new Cesium.Color(0.8, 0.9, 1.0, 0.8),
        endColor: new Cesium.Color(1.0, 1.0, 1.0, 0.2),
        startScale: 2.0,
        endScale: 4.0,
        minimumParticleLife: 2.0,
        maximumParticleLife: 3.0,
        minimumSpeed: 5.0,
        maximumSpeed: 10.0,
        imageSize: new Cesium.Cartesian2(15, 15),
        emissionRate: 80.0,
        emitter: new Cesium.ConeEmitter(Cesium.Math.toRadians(30.0)),
        modelMatrix: modelMatrix,
        updateCallback: (p, dt) => {
          // 更新速度以模拟重力
          Cesium.Cartesian3.multiplyByScalar(gravityVector, dt, gravityScratch);
          Cesium.Cartesian3.add(p.velocity, gravityScratch, p.velocity);
        },
      });
      break;
  }

  if (particleSystem) {
    viewer.scene.primitives.add(particleSystem);
    activeParticles.set(id, particleSystem);
    console.log(`Particle system ${id} added at`, position);
  }
};

const removeParticleSystem = (id) => {
  if (activeParticles.has(id)) {
    const ps = activeParticles.get(id);
    viewer.scene.primitives.remove(ps);
    activeParticles.delete(id);
  }
};

const clearAll = () => {
  effects.forEach((e) => {
    e.enabled = false;
    removeParticleSystem(e.id);
  });
};

useCesiumCleanup(() => {
  clearAll();
});
</script>
