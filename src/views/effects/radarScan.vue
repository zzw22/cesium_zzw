<template>
  <div class="effect-panel">
    <h3>雷达扫描</h3>
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

  const center = Cesium.Cartesian3.fromDegrees(116.39, 39.9);
  
  const robustRadarShader = `
    uniform sampler2D colorTexture;
    uniform sampler2D depthTexture;
    varying vec2 v_textureCoordinates;
    uniform vec4 u_scanCenterEC;
    uniform vec3 u_scanPlaneNormalEC;
    uniform vec3 u_scanLineDirEC; // The current direction of the scan line
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
        gl_FragColor = texture2D(colorTexture, v_textureCoordinates);
        float depth = czm_readDepth(depthTexture, v_textureCoordinates);
        vec4 viewPos = toEye(v_textureCoordinates, depth);
        
        vec3 prjOnPlane = pointProjectOnPlane(u_scanPlaneNormalEC.xyz, u_scanCenterEC.xyz, viewPos.xyz);
        float dist = length(prjOnPlane - u_scanCenterEC.xyz);

        if(dist < u_radius){
            vec3 dir = normalize(prjOnPlane - u_scanCenterEC.xyz);
            
            // Calculate angle between current scan direction and point direction
            // We use cross product to determine "side" (left/right) if needed, but dot product gives cos(theta)
            float dotVal = dot(dir, u_scanLineDirEC);
            
            // We also need to know if it's "behind" the scan line to render the trail
            // To do this properly without branching, we need a "Right" vector (ScanDir x PlaneNormal)
            vec3 sideVec = cross(u_scanLineDirEC, u_scanPlaneNormalEC);
            float side = dot(dir, sideVec);
            
            // If side > 0, it is "behind" the scan line (assuming counter-clockwise rotation)
            if(side > 0.0){
                float factor = smoothstep(0.0, 1.0, dotVal); // Map -1..1 to 0..1 roughly, but we want a sharp leading edge
                
                // Let's use the angle directly.
                // dotVal is cos(theta). Theta goes from 0 to 180.
                // If we are "behind", theta is 0..180.
                // We want the trail to fade out as theta increases.
                // So if side > 0, we mix color.
                
                float intensity = pow(dotVal, 5.0); // Sharpen the trail
                if(dotVal > 0.0) { // Only the first 90 degrees behind
                    gl_FragColor = mix(gl_FragColor, u_scanColor, intensity);
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
    destination: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 3000)
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
