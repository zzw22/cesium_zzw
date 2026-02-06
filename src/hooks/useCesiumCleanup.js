import { onUnmounted } from 'vue';
import { useCesiumStore } from '@/store/cesiumStore';

/**
 * 自动清理 Cesium 地图元素的 Hook
 * 在组件卸载时自动调用 store.resetViewer() 清除实体、数据源等
 * @param {Function} [beforeReset] - 可选的回调函数，在重置地图前执行（用于清理事件监听等）
 */
export function useCesiumCleanup(beforeReset) {
  onUnmounted(() => {
    // 1. 执行自定义清理逻辑 (如移除事件监听)
    if (typeof beforeReset === 'function') {
      try {
        beforeReset();
      } catch (error) {
        console.error('Custom cleanup failed:', error);
      }
    }

    // 2. 重置地图状态
    const store = useCesiumStore();
    if (store.viewer && !store.viewer.isDestroyed()) {
      try {
        store.resetViewer();
      } catch (error) {
        console.warn('Viewer reset encountered an error (likely already destroyed):', error);
      }
    }
  });
}
