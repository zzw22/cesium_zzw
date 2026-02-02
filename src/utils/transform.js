import * as Cesium from 'cesium'

/**
 * 坐标转换与视角操作工具类
 */
class Transform {
  /**
   * 获取鼠标当前的屏幕坐标位置的三维Cesium坐标
   * @param {Cesium.Scene} scene 
   * @param {Cesium.Cartesian2} position 二维屏幕坐标位置
   * @param {Cesium.Entity} noPickEntity 排除的对象（主要用于绘制中，排除对自己本身的拾取）
   * @returns {Cesium.Cartesian3|undefined}
   */
  static getCurrentMousePosition(scene, position, noPickEntity) {
    if (!scene || !position) return undefined

    // 尝试拾取模型上的点
    if (scene.pickPositionSupported) {
      const pickedObject = scene.pick(position)
      if (Cesium.defined(pickedObject)) {
        const entity = pickedObject.id
        if (!noPickEntity || (noPickEntity && entity !== noPickEntity)) {
          const cartesian = scene.pickPosition(position)
          if (Cesium.defined(cartesian)) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
            if (cartographic.height >= 0) return cartesian
            
            // 不是entity时，支持3dtiles地下
            if (!Cesium.defined(pickedObject.id) && cartographic.height >= -500) {
              return cartesian
            }
          }
        }
      }
    }

    // 拾取地形或椭球体
    // 3D模式下使用globe.pick
    if (scene.mode === Cesium.SceneMode.SCENE3D) {
      const pickRay = scene.camera.getPickRay(position)
      return scene.globe.pick(pickRay, scene)
    }
    
    // 2D/2.5D模式下使用pickEllipsoid
    return scene.camera.pickEllipsoid(position, scene.globe.ellipsoid)
  }

  /**
   * 提取地球中心点坐标
   * @param {Cesium.Viewer} viewer 
   */
  static getCenter(viewer) {
    const scene = viewer.scene
    let target = this._pickCenterPoint(scene)
    
    if (!target) {
      const globe = scene.globe
      const carto = scene.camera.positionCartographic.clone()
      const height = globe.getHeight(carto)
      carto.height = height || 0
      target = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto)
    }

    const result = this.formatPosition(target)
    
    // 计算相机距离中心点的距离
    result.cameraZ = Cesium.Cartesian3.distance(target, viewer.scene.camera.positionWC)
    
    return result
  }

  /**
   * 内部方法：拾取屏幕中心点
   * @private
   */
  static _pickCenterPoint(scene) {
    const canvas = scene.canvas
    const center = new Cesium.Cartesian2(
      canvas.clientWidth / 2,
      canvas.clientHeight / 2
    )

    const ray = scene.camera.getPickRay(center)
    const target = scene.globe.pick(ray, scene)
    return target || scene.camera.pickEllipsoid(center)
  }

  /**
   * 提取地球视域边界
   * @param {Cesium.Viewer} viewer 
   */
  static getExtent(viewer) {
    const extent = { xmin: 70, xmax: 140, ymin: 0, ymax: 55 } // 默认中国区域
    const scene = viewer.scene
    const ellipsoid = scene.globe.ellipsoid
    const canvas = scene.canvas

    // 辅助函数：尝试拾取点并更新范围
    const updateExtent = (pixel, isMin) => {
      const cartesian = viewer.camera.pickEllipsoid(pixel, ellipsoid)
      if (cartesian) {
        const carto = ellipsoid.cartesianToCartographic(cartesian)
        const lon = Cesium.Math.toDegrees(carto.longitude)
        const lat = Cesium.Math.toDegrees(carto.latitude)
        
        if (isMin) {
          extent.xmin = lon
          extent.ymax = lat
        } else {
          extent.xmax = lon
          extent.ymin = lat
        }
        return true
      }
      return false
    }

    // 左上角
    if (!updateExtent(new Cesium.Cartesian2(0, 0), true)) {
      const xMax = canvas.width / 2
      const yMax = canvas.height / 2
      // 逐步搜索有效点
      for (let y = 0; y <= yMax; y += 10) {
        const x = y <= xMax ? y : xMax
        if (updateExtent(new Cesium.Cartesian2(x, y), true)) break
      }
    }

    // 右下角
    if (!updateExtent(new Cesium.Cartesian2(canvas.width, canvas.height), false)) {
      const xMax = canvas.width / 2
      const yMax = canvas.height / 2
      // 逐步搜索有效点
      for (let y = canvas.height; y >= yMax; y -= 10) {
        const x = y >= xMax ? y : xMax
        if (updateExtent(new Cesium.Cartesian2(x, y), false)) break
      }
    }

    // 修正范围
    if (extent.xmax < extent.xmin) [extent.xmax, extent.xmin] = [extent.xmin, extent.xmax]
    if (extent.ymax < extent.ymin) [extent.ymax, extent.ymin] = [extent.ymin, extent.ymax]

    return extent
  }

  /**
   * 提取视域边界 (经纬度对象)
   * @param {Cesium.Viewer} viewer 
   */
  static getViewBounds(viewer) {
    const rectangle = viewer.camera.computeViewRectangle()
    const toDeg = (rad) => rad / Math.PI * 180
    
    return {
      southwest: {
        lng: toDeg(rectangle.west),
        lat: toDeg(rectangle.south)
      },
      northeast: {
        lng: toDeg(rectangle.east),
        lat: toDeg(rectangle.north)
      }
    }
  }

  /**
   * 提取相机视角范围参数
   * @param {Cesium.Viewer} viewer 
   */
  static getCameraView(viewer) {
    const camera = viewer.camera
    const position = camera.positionCartographic

    return {
      y: Number(Cesium.Math.toDegrees(position.latitude).toFixed(6)),
      x: Number(Cesium.Math.toDegrees(position.longitude).toFixed(6)),
      z: Number(position.height.toFixed(1)),
      heading: Number(Cesium.Math.toDegrees(camera.heading || -90).toFixed(1)),
      pitch: Number(Cesium.Math.toDegrees(camera.pitch || 0).toFixed(1)),
      roll: Number(Cesium.Math.toDegrees(camera.roll || 0).toFixed(1))
    }
  }

  /**
   * 格式化坐标点
   * @param {Cesium.Cartesian3} position 
   */
  static formatPosition(position) {
    const carto = Cesium.Cartographic.fromCartesian(position)
    return {
      y: Number(Cesium.Math.toDegrees(carto.latitude).toFixed(6)),
      x: Number(Cesium.Math.toDegrees(carto.longitude).toFixed(6)),
      z: Number(carto.height.toFixed(1))
    }
  }

  /**
   * 笛卡尔转经纬度/弧度
   */
  static cartesian3To(cartesian3, viewer) {
    if (!cartesian3) return undefined

    let cartographic
    if (viewer) {
      cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian3)
    } else {
      cartographic = Cesium.Cartographic.fromCartesian(cartesian3)
    }

    return {
      cartesian3,
      cartographic,
      latlng: {
        lat: Cesium.Math.toDegrees(cartographic.latitude),
        lng: Cesium.Math.toDegrees(cartographic.longitude),
        height: cartographic.height
      }
    }
  }
}

/**
 * 绕点环绕飞行控制器
 */
class WindingPointController {
  constructor() {
    this.isStart = false
    this.viewer = null
    this._tickHandler = this._onTick.bind(this)
  }

  /**
   * 开始环绕
   * @param {Cesium.Viewer} viewer 
   * @param {Object} options 
   */
  start(viewer, options = {}) {
    if (this.isStart) this.stop()

    this.viewer = viewer
    const center = options.position || Transform.getCenter(viewer)
    
    // 如果传入的是格式化对象，转换为Cartesian3
    this.position = center instanceof Cesium.Cartesian3 
      ? center 
      : Cesium.Cartesian3.fromDegrees(center.x, center.y, center.z)

    this.distance = options.distance || Cesium.Cartesian3.distance(this.position, viewer.camera.positionWC)
    this.angle = 360 / (options.time || 60) // 每秒旋转角度

    this.startTime = viewer.clock.currentTime.clone()
    this.initialHeading = viewer.camera.heading
    this.initialPitch = viewer.camera.pitch

    viewer.clock.onTick.addEventListener(this._tickHandler)
    this.isStart = true
  }

  _onTick() {
    const delTime = Cesium.JulianDate.secondsDifference(this.viewer.clock.currentTime, this.startTime)
    const heading = Cesium.Math.toRadians(delTime * this.angle) + this.initialHeading

    this.viewer.scene.camera.setView({
      destination: this.position,
      orientation: {
        heading: heading,
        pitch: this.initialPitch,
      }
    })
    this.viewer.scene.camera.moveBackward(this.distance)
  }

  stop() {
    if (!this.isStart || !this.viewer) return
    this.viewer.clock.onTick.removeEventListener(this._tickHandler)
    this.isStart = false
    this.viewer = null
  }
}

/**
 * 固定点自旋转控制器
 */
class AroundPointController {
  constructor() {
    this.isStart = false
    this.viewer = null
    this._tickHandler = this._onTick.bind(this)
  }

  start(viewer, options = {}) {
    if (this.isStart) this.stop()

    this.viewer = viewer
    // 仅用于获取初始位置信息，实际旋转是原地旋转视角
    const center = options.position || Transform.getCenter(viewer)
    
    this.angle = 360 / (options.time || 60)
    this.startTime = viewer.clock.currentTime.clone()
    this.initialHeading = viewer.camera.heading
    this.initialPitch = viewer.camera.pitch

    viewer.clock.onTick.addEventListener(this._tickHandler)
    this.isStart = true
  }

  _onTick() {
    const delTime = Cesium.JulianDate.secondsDifference(this.viewer.clock.currentTime, this.startTime)
    const heading = Cesium.Math.toRadians(delTime * this.angle) + this.initialHeading
    
    this.viewer.scene.camera.setView({
      orientation: {
        heading: heading,
        pitch: this.initialPitch,
      }
    })
  }

  stop() {
    if (!this.isStart || !this.viewer) return
    this.viewer.clock.onTick.removeEventListener(this._tickHandler)
    this.isStart = false
    this.viewer = null
  }
}

// 导出单例或静态类
export default Transform
export const windingPoint = new WindingPointController()
export const aroundPoint = new AroundPointController()
