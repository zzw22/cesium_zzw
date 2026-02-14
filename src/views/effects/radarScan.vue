<template>
  <div class="demo_panel">
    <h3 class="demo_title">雷达扫描</h3>
    <el-button @click="toggleEffect">切换显示</el-button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';
import * as Cesium from 'cesium';

const store = useCesiumStore();
let stage = null;
let removeListener = null;

const toggleEffect = () => {
  if (stage) {
    stage.enabled = !stage.enabled;
  }
};

onMounted(() => {
  const viewer = store.viewer;
  if (!viewer) return;

  // 武汉中心位置
  const center = Cesium.Cartesian3.fromDegrees(114.3055, 30.5928);
  
  const robustRadarShader = `
    uniform sampler2D colorTexture;
    uniform sampler2D depthTexture;
    in vec2 v_textureCoordinates;
    out vec4 fragColor;
    uniform vec4 u_scanCenterEC;
    uniform vec3 u_scanPlaneNormalEC;
    uniform vec3 u_scanLineDirEC;
    uniform float u_radius;
    uniform vec4 u_scanColor;

    vec4 toEye(in vec2 uv, in float depth){
      vec2 xy = vec2((uv.x * 2.0 - 1.0),(uv.y * 2.0 - 1.0));
      vec4 pos = vec4(xy, depth, 1.0);
      pos = czm_inverseProjection * pos;
      pos /= pos.w;
      return pos;
    }
    vec3 pointProjectOnPlane(in vec3 planeNormal, in vec3 planeOrigin, in vec3 point){
        vec3 v01 = point - planeOrigin;
        float d = dot(planeNormal, v01);
        return (point - planeNormal * d);
    }

    void main() {
        fragColor = texture(colorTexture, v_textureCoordinates);
        float depth = czm_readDepth(depthTexture, v_textureCoordinates);
        vec4 viewPos = toEye(v_textureCoordinates, depth);

        vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);
        float dist = length(prjOnPlane - u_scanCenterEC.xyz);

        if(dist < u_radius){
            vec3 dir = normalize(prjOnPlane - u_scanCenterEC.xyz);

            float dotVal = dot(dir, u_scanLineDirEC);

            vec3 sideVec = cross(u_scanLineDirEC, u_scanPlaneNormalEC);
            float side = dot(dir, sideVec);

            if(side > 0.0){
                float intensity = pow(dotVal, 5.0);
                if(dotVal > 0.0) {
                    fragColor = mix(fragColor, u_scanColor, intensity);
                }
            }
        }
    }
  `;

  stage = new Cesium.PostProcessStage({
    fragmentShader: robustRadarShader,
    uniforms: {
      u_scanCenterEC: function() {
        return Cesium.Matrix4.multiplyByVector(viewer.camera.viewMatrix, new Cesium.Cartesian4(center.x, center.y, center.z, 1.0), new Cesium.Cartesian4());
      },
      u_scanPlaneNormalEC: function() {
        const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(center);
        return Cesium.Matrix4.multiplyByPointAsVector(viewer.camera.viewMatrix, normal, new Cesium.Cartesian3());
      },
      u_scanLineDirEC: function() {
        // Calculate rotating vector
        const now = Date.now();
        const angle = ((now % 3000) / 3000) * Cesium.Math.TWO_PI; 
        
        
        const dx = Math.sin(angle);
        const dy = Math.cos(angle);
        
        const localDir = new Cesium.Cartesian3(dx, dy, 0.0);
        
        const transform = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        const worldDir = Cesium.Matrix4.multiplyByPointAsVector(transform, localDir, new Cesium.Cartesian3());
        
        return Cesium.Matrix4.multiplyByPointAsVector(viewer.camera.viewMatrix, worldDir, new Cesium.Cartesian3());
      },
      u_radius: 1500.0,
      u_scanColor: new Cesium.Color(1.0, 0.0, 0.0, 0.5)
    }
  });

  viewer.scene.postProcessStages.add(stage);
  
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(114.3055, 30.5928, 3000)
  });
});

onUnmounted(() => {
  const viewer = store.viewer;
  if (viewer && stage) {
    viewer.scene.postProcessStages.remove(stage);
    stage = null;
  }
});
</script>
