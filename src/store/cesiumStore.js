import { defineStore } from 'pinia';
import { markRaw } from 'vue';

export const useCesiumStore = defineStore('cesium', {
  state: () => ({
    viewer: null,
  }),
  actions: {
    setViewer(viewer) {
      // 关键点：使用 markRaw 标记 viewer 为非响应式
      // Cesium.Viewer 对象极其复杂，包含大量循环引用
      // 如果被 Vue 代理为 Proxy，会造成严重的性能问题甚至堆栈溢出
      this.viewer = markRaw(viewer);
    },
    getViewer() {
      return this.viewer;
    },
    /**
     * 重置地图状态：
     * 1. 清除所有实体 (Entities)
     * 2. 清除所有数据源 (DataSources)
     * 3. 清除所有图元 (Primitives, 不包含默认的Globe等)
     * 4. 视角复位
     */
    resetViewer() {
      if (!this.viewer) return;

      const viewer = this.viewer;

      // 1. 清除实体
      viewer.entities.removeAll();

      // 2. 清除数据源
      viewer.dataSources.removeAll();

      // 3. 清除图元 (注意：这将清除所有primitives，包括3D Tileset)
      // 如果有系统级图元需要保留，建议使用 collection 操作而不是 removeAll
      // 这里假设 reset 是完全重置
      viewer.scene.primitives.removeAll();

      // 4. 视角复位
      viewer.camera.flyHome(1.5); // 1.5秒动画
    },
  },
});
