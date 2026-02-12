/*
 * @Title:
 * @Author: zhangzhiwei
 * @Date: 2025-12-26 21:34:39
 * @FilePath: \src\router\index.js
 * @Description:
 */
import { createRouter, createWebHistory, RouterView } from "vue-router";
import Layout from "../layout/index.vue";
import Login from "../views/Login.vue";
import Home from "../views/Home.vue";
import BaseEntities from "../views/base/entities.vue";
import BasePosition from "../views/base/position.vue";
import BaseFly from "../views/base/fly.vue";
import BaseSport from "../views/base/sport.vue";
import BaseTip from "../views/base/tip.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: { title: "登录" },
  },
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "",
        name: "Home",
        component: Home,
        meta: { title: "menu.home", icon: "House" },
      },
      {
        path: "/base",
        name: "Base",
        component: RouterView,
        meta: { title: "menu.base", icon: "Operation" },
        children: [
          {
            path: "/entities",
            name: "BaseEntities",
            component: BaseEntities,
            meta: { title: "menu.baseEntities", icon: "DataBoard" },
          },
          {
            path: "/position",
            name: "BasePosition",
            component: () => import("../views/base/position.vue"),
            meta: { title: "menu.basePosition", icon: "DataBoard" },
          },
          {
            path: "/fly",
            name: "BaseFly",
            component: BaseFly,
            meta: { title: "menu.baseFly", icon: "DataBoard" },
          },
          {
            path: "/sport",
            name: "BaseSport",
            component: () => import("../views/base/sport.vue"),
            meta: { title: "menu.baseSport", icon: "DataBoard" },
          },
          {
            path: "/tip",
            name: "BaseTip",
            component: BaseTip,
            meta: { title: "menu.baseTip", icon: "DataBoard" },
          },
          {
            path: "/mask",
            name: "BaseMask",
            component: () => import("../views/base/mask.vue"),
            meta: { title: "menu.baseMask", icon: "DataBoard" },
          },
          {
            path: "/loadShp",
            name: "BaseLoadShp",
            component: () => import("../views/base/loadShp.vue"),
            meta: { title: "menu.baseLoadShp", icon: "DataBoard" },
          },
          {
            path: "/loadMVT",
            name: "BaseLoadMVT",
            component: () => import("../views/base/loadMVT.vue"),
            meta: { title: "menu.baseLoadMVT", icon: "DataBoard" },
          },
          {
            path: "/zoomControl",
            name: "BaseZoomControl",
            component: () => import("../views/base/zoomControl.vue"),
            meta: { title: "menu.baseZoomControl", icon: "DataBoard" },
          },
          {
            path: "/transparent",
            name: "BaseTransparent",
            component: () => import("../views/base/transparent.vue"),
            meta: { title: "menu.baseTransparent", icon: "DataBoard" },
          },
          {
            path: "/flyCircle",
            name: "BaseFlyCircle",
            component: () => import("../views/base/flyCircle.vue"),
            meta: { title: "menu.baseFlyCircle", icon: "DataBoard" },
          },
        ],
      },
      {
        path: "/layers",
        name: "Layers",
        component: RouterView,
        meta: { title: "menu.baseLayers", icon: "MapLocation" },
        children: [
          {
            path: "/singleImage",
            name: "LayerSingleImage",
            component: () => import("../views/layers/singleImage.vue"),
            meta: { title: "menu.layersPicture", icon: "Picture" },
          },
          {
            path: "/xyz",
            name: "LayerXYZ",
            component: () => import("../views/layers/xyz.vue"),
            meta: { title: "menu.layersXYZ", icon: "DataBoard" },
          },
          {
            path: "/tms",
            name: "LayerTMS",
            component: () => import("../views/layers/tms.vue"),
            meta: { title: "menu.layersTMS", icon: "DataBoard" },
          },
          {
            path: "/wms",
            name: "LayerWMS",
            component: () => import("../views/layers/wms.vue"),
            meta: { title: "menu.layersWMS", icon: "DataBoard" },
          },
          {
            path: "/wmts",
            name: "LayerWMTS",
            component: () => import("../views/layers/wmts.vue"),
            meta: { title: "menu.layersWMTS", icon: "DataBoard" },
          },
          {
            path: "/tdt",
            name: "LayerTDT",
            component: () => import("../views/layers/tdt.vue"),
            meta: { title: "menu.layersTDT", icon: "DataBoard" },
          },
          {
            path: "/cgcs4490",
            name: "Layer4490",
            component: () => import("../views/layers/epsg4490.vue"),
            meta: { title: "menu.layers4490", icon: "DataBoard" },
          },
          {
            path: "/amap",
            name: "LayerAmap",
            component: () => import("../views/layers/addAmap.vue"),
            meta: { title: "menu.layersAmap", icon: "DataBoard" },
          },
          {
            path: "/mapbox",
            name: "LayerMKT",
            component: () => import("../views/layers/mapbox.vue"),
            meta: { title: "menu.layersMapbox", icon: "DataBoard" },
          },
          {
            path: "/dynamicMap",
            name: "LayerDynamicMap",
            component: () => import("../views/layers/dynamicMap.vue"),
            meta: { title: "menu.layersDynamicMap", icon: "DataBoard" },
          },
          {
            path: "/offlineTerrain",
            name: "LayerOfflineTerrain",
            component: () => import("../views/layers/offlineTerrain.vue"),
            meta: { title: "menu.layersOfflineTerrain", icon: "DataBoard" },
          },
        ],
      },

      {
        path: "/elements",
        name: "Elements",
        component: RouterView,
        meta: { title: "menu.elements", icon: "Grid" },
        children: [
          {
            path: "/basicEntities",
            name: "ElementBasicEntities",
            component: () => import("../views/elements/basicEntities.vue"),
            meta: { title: "menu.elementBasicEntities", icon: "DataBoard" },
          },
          {
            path: "/billboard",
            name: "ElementBillboard",
            component: () => import("../views/elements/billboard.vue"),
            meta: { title: "menu.elementBillboard", icon: "DataBoard" },
          },
          {
            path: "/massiveBillboards",
            name: "ElementMassiveBillboards",
            component: () => import("../views/elements/massiveBillboards.vue"),
            meta: { title: "menu.elementMassiveBillboards", icon: "DataBoard" },
          },
          {
            path: "/popup",
            name: "ElementPopup",
            component: () => import("../views/elements/popup.vue"),
            meta: { title: "menu.elementPopup", icon: "DataBoard" },
          },
          {
            path: "/geojson",
            name: "ElementGeoJson",
            component: () => import("../views/elements/geoJson.vue"),
            meta: { title: "menu.elementGeoJson", icon: "DataBoard" },
          },
          {
            path: "/primitive",
            name: "ElementPrimitive",
            component: () => import("../views/elements/primitiveGeometry.vue"),
            meta: { title: "menu.elementPrimitive", icon: "DataBoard" },
          },
          {
            path: "/collection",
            name: "ElementCollection",
            component: () => import("../views/elements/entityCollection.vue"),
            meta: { title: "menu.elementEntityCollection", icon: "DataBoard" },
          },
          {
            path: "/events",
            name: "ElementEvents",
            component: () => import("../views/elements/events.vue"),
            meta: { title: "menu.elementEvents", icon: "DataBoard" },
          },
          {
            path: "/svg",
            name: "ElementSVG",
            component: () => import("../views/elements/svg.vue"),
            meta: { title: "menu.elementSVG", icon: "DataBoard" },
          },
          {
            path: "/gif",
            name: "ElementGIF",
            component: () => import("../views/elements/gif.vue"),
            meta: { title: "menu.elementGIF", icon: "DataBoard" },
          },
          {
            path: "/clustering",
            name: "ElementClustering",
            component: () => import("../views/elements/clustering.vue"),
            meta: { title: "menu.elementClustering", icon: "DataBoard" },
          },
          {
            path: "/czml",
            name: "ElementCZML",
            component: () => import("../views/elements/czml.vue"),
            meta: { title: "menu.elementCZML", icon: "DataBoard" },
          },
        ],
      },
      {
        path: "/particle",
        name: "Particle",
        meta: { title: "menu.particle", icon: "MagicStick" },
        children: [
          {
            path: "/particleExamples",
            name: "ParticleExamples",
            component: () =>
              import("../views/particleEffect/particleExamples.vue"),
            meta: { title: "menu.particleExamples", icon: "DataBoard" },
          },
        ],
      },
      {
        path: "/models",
        name: "Models",
        component: RouterView,
        meta: { title: "menu.models", icon: "Box" },
        children: [
          {
            path: "/loadModel",
            name: "ModelLoad",
            component: () => import("../views/models/loadModel.vue"),
            meta: { title: "menu.modelLoad", icon: "DataBoard" },
          },
          {
            path: "/primitiveModel",
            name: "ModelPrimitive",
            component: () => import("../views/models/primitiveModel.vue"),
            meta: { title: "menu.modelPrimitive", icon: "DataBoard" },
          },
          {
            path: "/primitiveMassive",
            name: "ModelPrimitiveMassive",
            component: () => import("../views/models/primitiveMassive.vue"),
            meta: { title: "menu.modelPrimitiveMassive", icon: "DataBoard" },
          },
          {
            path: "/interpolation",
            name: "ModelInterpolation",
            component: () => import("../views/models/interpolation.vue"),
            meta: { title: "menu.modelInterpolation", icon: "DataBoard" },
          },
          {
            path: "/info",
            name: "ModelInfo",
            component: () => import("../views/models/modelInfo.vue"),
            meta: { title: "menu.modelInfo", icon: "DataBoard" },
          },
          {
            path: "/windTurbine",
            name: "ModelWindTurbine",
            component: () => import("../views/models/windTurbine.vue"),
            meta: { title: "menu.modelWindTurbine", icon: "DataBoard" },
          },
        ],
      },
      {
        path: "/3dtiles",
        name: "3DTiles",
        component: RouterView,
        meta: { title: "menu.3dtiles", icon: "Collection" },
        children: [
          {
            path: "/texture",
            name: "Texture3DTiles",
            component: () => import("../views/3dtiles/texture3dtiles.vue"),
            meta: { title: "menu.texture3dtiles", icon: "DataBoard" },
          },
          {
            path: "/modelInfo",
            name: "ModelInfo3DTiles",
            component: () => import("../views/3dtiles/modelInfo3dtiles.vue"),
            meta: { title: "menu.modelInfo3dtiles", icon: "DataBoard" },
          },
        ],
      },
      {
        path: "/measurement",
        name: "Measurement",
        component: RouterView,
        meta: { title: "menu.measurement", icon: "Aim" },
        children: [
          {
            path: "/measurementTools",
            name: "MeasurementTools",
            component: () => import("../views/measurement/measurement.vue"),
            meta: { title: "menu.measurementTools", icon: "DataBoard" },
          },
        ],
      },
      {
        path: "/effects",
        name: "Effects",
        component: RouterView,
        meta: { title: "menu.effects", icon: "Tools" },
        children: [
          {
            path: "/flowLine",
            name: "EffectFlowLine",
            component: () => import("../views/effects/flowLine.vue"),
            meta: { title: "menu.flowLine", icon: "DataBoard" },
          },
          {
            path: "/radarScan",
            name: "EffectRadarScan",
            component: () => import("../views/effects/radarScan.vue"),
            meta: { title: "menu.radarScan", icon: "DataBoard" },
          },
          {
            path: "/waterRipple",
            name: "EffectWaterRipple",
            component: () => import("../views/effects/waterRipple.vue"),
            meta: { title: "menu.waterRipple", icon: "DataBoard" },
          },
          {
            path: "/diffusionPoint",
            name: "EffectDiffusionPoint",
            component: () => import("../views/effects/diffusionPoint.vue"),
            meta: { title: "menu.diffusionPoint", icon: "DataBoard" },
          },
          {
            path: "/electronicFence",
            name: "EffectElectronicFence",
            component: () => import("../views/effects/electronicFence.vue"),
            meta: { title: "menu.electronicFence", icon: "DataBoard" },
          },
          {
            path: "/electronicFence2",
            name: "EffectElectronicFence2",
            component: () => import("../views/effects/electronicFence2.vue"),
            meta: { title: "menu.electronicFence2", icon: "DataBoard" },
          },
          {
            path: "/movingCone",
            name: "EffectMovingCone",
            component: () => import("../views/effects/movingCone.vue"),
            meta: { title: "menu.movingCone", icon: "DataBoard" },
          },
          {
            path: "/movingFrustum",
            name: "EffectMovingFrustum",
            component: () => import("../views/effects/movingFrustum.vue"),
            meta: { title: "menu.movingFrustum", icon: "DataBoard" },
          },
          {
            path: "/pointLight",
            name: "EffectPointLight",
            component: () => import("../views/effects/pointLight.vue"),
            meta: { title: "menu.pointLight", icon: "DataBoard" },
          },

          {
            path: "/cityFlow",
            name: "EffectCityFlow",
            component: () => import("../views/effects/cityFlow.vue"),
            meta: { title: "menu.cityFlow", icon: "DataBoard" },
          },
        ],
      },
      {
        path: "/skyBox",
        name: "EffectSkyBox",
        meta: { title: "天空盒", icon: "Sunny" },
        children: [
          {
            path: "/baseSkyBox",
            name: "BaseSkyBox",
            component: () => import("../views/skyBox/baseSkyBox.vue"),
            meta: { title: "menu.baseSkyBox", icon: "Sunny" },
          },
          {
            path: "/nearEarth",
            name: "NearEarthSkyBox",
            component: () => import("../views/skyBox/nearEarthSkyBox.vue"),
            meta: { title: "menu.nearEarthSkyBox", icon: "Sunny" },
          },
          {
            path: "/groundSkyBox",
            name: "GroundSkyBox",
            component: () => import("../views/skyBox/groundSkyBox.vue"),
            meta: { title: "menu.groundSkyBox", icon: "Sunny" },
          },
        ],
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const tokenExpiry = localStorage.getItem("tokenExpiry");
  const now = Date.now();

  const isAuthenticated = token && tokenExpiry && parseInt(tokenExpiry) > now;

  if (to.path === "/login") {
    if (isAuthenticated) {
      next("/");
    } else {
      next();
    }
  } else {
    if (isAuthenticated) {
      next();
    } else {
      if (token) {
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");
      }
      next("/login");
    }
  }
});

export default router;
