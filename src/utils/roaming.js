import * as Cesium from 'cesium'

/**
 * @class Roaming
 * @category 场景
 * @classdesc 漫游控制器（支持相机漫游和模型漫游）
 */
class Roaming {
  /**
   * @param {Cesium.Viewer} viewer - Cesium Viewer 实例
   * @param {Object} [options] - 配置参数
   * @param {number} [options.time=360] - 漫游总时间（秒）
   * @param {number} [options.multiplier=1] - 飞行速度倍率
   * @param {boolean} [options.isLoop=false] - 是否循环播放
   */
  constructor(viewer, options = {}) {
    this.viewer = viewer
    this.options = options
    
    // 状态与配置
    this.time = options.time || 360
    this.multiplier = options.multiplier || 1
    this.isLoop = options.isLoop || options.ifClockLoop || false // 兼容旧参数 ifClockLoop
    
    // 内部状态
    this.entity = null
    this.polyline = null
    this.cylinder = null
    this.start = null
    this.stop = null
    this.data = {}
    
    // 事件监听器引用，用于销毁
    this._updateHandler = null
  }

  /**
   * 计算漫游路线属性
   * @private
   * @param {Array<Cesium.Cartesian3>} lines 点集合
   * @param {number} totalTime 总时间
   * @returns {Cesium.SampledPositionProperty}
   */
  _computeLineProperty(lines, totalTime) {
    const property = new Cesium.SampledPositionProperty()
    const lineLength = lines.length
    const startTime = Cesium.JulianDate.now()
    const stopTime = Cesium.JulianDate.addSeconds(startTime, totalTime, new Cesium.JulianDate())

    this.start = startTime
    this.stop = stopTime

    // 设置时钟
    this.viewer.clock.startTime = startTime.clone()
    this.viewer.clock.stopTime = stopTime.clone()
    this.viewer.clock.currentTime = startTime.clone()
    this.viewer.clock.clockRange = this.isLoop ? Cesium.ClockRange.LOOP_STOP : Cesium.ClockRange.CLAMPED
    this.viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK
    this.viewer.clock.shouldAnimate = true
    this.viewer.clock.multiplier = this.multiplier

    const timeStep = totalTime / lineLength
    
    lines.forEach((pos, i) => {
      let time = Cesium.JulianDate.addSeconds(startTime, i * timeStep, new Cesium.JulianDate())
      if (i === lineLength - 1) {
        time = stopTime
      }
      
      let position = pos
      if (this.options.ifTileset) {
        position = this.viewer.scene.clampToHeight(pos)
      }
      property.addSample(time, position)
    })

    return property
  }

  /**
   * 相机漫游
   * @param {Array<Cesium.Cartesian3>} lines - 路径点集合
   */
  cameraRoaming(lines) {
    if (!lines || lines.length === 0) return
    
    this.lines = lines
    const property = this._computeLineProperty(lines, this.time)
    this._initCameraRoaming(property, this.start, this.stop)
  }

  /**
   * 初始化相机漫游
   * @private
   */
  _initCameraRoaming(position, start, stop) {
    this.entity = this.viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({ start, stop })
      ]),
      position: position,
      orientation: new Cesium.VelocityOrientationProperty(position)
    })

    this.entity.position.setInterpolationOptions({
      interpolationDegree: 2, // 降低插值阶数以提高性能，原值100过高
      interpolationAlgorithm: Cesium.HermitePolynomialApproximation
    })

    this.viewer.trackedEntity = this.entity

    // 绑定实时更新
    this._bindUpdateEvent((center) => {
      // 相机漫游时的特殊视角处理
      this.viewer.camera.lookAt(center, {
        heading: Cesium.Math.toRadians(117.7),
        pitch: Cesium.Math.toRadians(0),
        range: 100
      })
    })
  }

  /**
   * 模型漫游
   * @param {Object} options - 参数
   * @param {Array} options.lines - 点集合
   * @param {Object} [options.model] - 模型配置
   * @param {boolean} [options.isClampToGround=false] - 是否贴地 (兼容 ifAffixedTo)
   * @param {boolean} [options.interpolation=false] - 是否插值
   * @param {Object} [options.path] - 路径配置
   * @param {Object} [options.polyline] - 尾迹线配置
   * @param {Object} [options.cylinder] - 扫描锥配置
   * @param {Object} [options.label] - 标签配置
   */
  modelRoaming(options = {}) {
    this.modelOptions = {
      model: { minimumPixelSize: 64, ...options.model },
      path: { show: false, ...options.path },
      polyline: { show: false, material: Cesium.Color.RED, ...options.polyline },
      cylinder: {
        show: false,
        topRadius: 0.0,
        bottomRadius: 100.0,
        material: Cesium.Color.RED.withAlpha(0.3),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        ...options.cylinder
      },
      label: { show: false, ...options.label }
    }

    this.lines = options.lines || options.Lines
    this.isClampToGround = options.isClampToGround || options.ifAffixedTo || false
    this.isInterpolation = options.interpolation || false
    this.isTileset = options.isTileset || options.ifTileset || false
    this.showLabel = options.showLabel || false

    // 初始化动态属性
    this.modelOptions.polyline.positions = new Cesium.CallbackProperty(() => this._trackedPositions, false)
    this.modelOptions.cylinder.length = new Cesium.CallbackProperty(() => this._cylinderLength, false)
    this._trackedPositions = []
    this._cylinderLength = 0

    const property = this._computeLineProperty(this.lines, this.time)
    this._initModelRoaming(property, this.start, this.stop)
  }

  /**
   * 初始化模型漫游
   * @private
   */
  _initModelRoaming(position, start, stop) {
    // 创建主实体
    this.entity = this.viewer.entities.add({
      availability: new Cesium.TimeIntervalCollection([
        new Cesium.TimeInterval({ start, stop })
      ]),
      position: position,
      orientation: new Cesium.VelocityOrientationProperty(position),
      model: this.modelOptions.model,
      label: this.modelOptions.label,
      path: this.modelOptions.path,
    })

    // 插值设置
    if (!this.isClampToGround && this.isInterpolation) {
      this.entity.position.setInterpolationOptions({
        interpolationDegree: 5,
        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation,
      })
    }

    // 辅助图形
    if (this.modelOptions.polyline.show) {
      this.polyline = this.viewer.entities.add({
        polyline: this.modelOptions.polyline,
      })
    }

    if (this.modelOptions.cylinder.show) {
      this.cylinder = this.viewer.entities.add({
        position: position,
        orientation: new Cesium.VelocityOrientationProperty(position),
        cylinder: this.modelOptions.cylinder
      })
    }

    // 绑定更新逻辑
    this._bindUpdateEvent((center) => {
      // 更新尾迹线
      if (this.modelOptions.polyline.show) {
        this._trackedPositions.push(center)
      }

      // 贴地计算
      if (this.isClampToGround) {
        this._updateClampToGround(center)
      }

      // 3D Tiles 贴合
      if (this.isTileset) {
        this.entity.position.addSample(
          this.viewer.clock.currentTime, 
          this.viewer.scene.clampToHeight(center, [this.entity])
        )
      }

      // 更新圆锥体高度
      if (this.modelOptions.cylinder.show) {
        const carto = Cesium.Cartographic.fromCartesian(center)
        this._cylinderLength = carto.height
      }
    })

    this.changeView(2) // 默认跟随视角
  }

  /**
   * 绑定帧更新事件
   * @private
   * @param {Function} callback 每帧回调
   */
  _bindUpdateEvent(callback) {
    // 先清理旧的
    this._unbindUpdateEvent()

    this._updateHandler = () => {
      if (!this.entity || !this.viewer.clock.shouldAnimate) return

      const currentTime = this.viewer.clock.currentTime
      const center = this.entity.position.getValue(currentTime)

      if (center) {
        callback(center)
        this._updateRealTimeData(center)
      }
    }

    this.viewer.scene.preUpdate.addEventListener(this._updateHandler)
  }

  _unbindUpdateEvent() {
    if (this._updateHandler) {
      this.viewer.scene.preUpdate.removeEventListener(this._updateHandler)
      this._updateHandler = null
    }
  }

  /**
   * 贴地高度计算
   * @private
   */
  _updateClampToGround(center) {
    const carto = Cesium.Cartographic.fromCartesian(center)
    const terrainProvider = this.viewer.terrainProvider

    // 检查地形是否支持采样
    if (terrainProvider instanceof Cesium.EllipsoidTerrainProvider) {
       // 不做贴地处理或简单贴椭球
       return 
    }

    Cesium.sampleTerrainMostDetailed(terrainProvider, [carto]).then((updatedPositions) => {
      if (updatedPositions && updatedPositions[0]) {
        const pos = updatedPositions[0]
        this.entity.position.addSample(
          this.viewer.clock.currentTime,
          Cesium.Cartesian3.fromRadians(pos.longitude, pos.latitude, pos.height)
        )
      }
    })
  }

  /**
   * 暂停/继续
   * @param {boolean} shouldAnimate 
   */
  togglePause(shouldAnimate) {
    this.viewer.clock.shouldAnimate = shouldAnimate
  }

  /**
   * 修改速度
   * @param {number} multiplier 
   */
  setSpeed(multiplier) {
    this.viewer.clock.multiplier = multiplier
  }

  /**
   * 结束漫游并清理
   */
  stop() {
    this._unbindUpdateEvent()
    this.togglePause(false)

    const entitiesToRemove = [this.entity, this.polyline, this.cylinder]
    entitiesToRemove.forEach(entity => {
      if (entity) this.viewer.entities.remove(entity)
    })

    this.entity = null
    this.polyline = null
    this.cylinder = null
    this.viewer.trackedEntity = undefined
    
    // 可以在这里重置时钟设置，如果需要的话
    // this.viewer.clock.clockRange = Cesium.ClockRange.UNBOUNDED;
  }

  /**
   * 获取数据绑定的钩子
   * @param {Function} callback 
   */
  onDataChange(callback) {
    // 使用 Proxy 或简单的 getter/setter 监听数据变化可能更好
    // 这里保留原逻辑的简单封装，实际建议外部直接轮询 data 或使用 Vue 的 watch
    this._dataCallback = callback
  }

  /**
   * 切换视角
   * @param {number} mode 1:跟踪 2:上方 3:侧方 4:自定义
   * @param {Object} [options] 自定义视角参数
   */
  changeView(mode, options = {}) {
    this.viewer.trackedEntity = undefined
    
    switch (mode) {
      case 1:
        this.viewer.trackedEntity = this.entity
        break
      case 2:
        this.viewer.zoomTo(this.viewer.entities, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90)))
        break
      case 3:
        this.viewer.zoomTo(this.viewer.entities, new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(-90),
          Cesium.Math.toRadians(-15),
          8000
        ))
        break
      case 4:
        this.viewer.zoomTo(this.viewer.entities, new Cesium.HeadingPitchRange(
          Cesium.Math.toRadians(options.heading || 0),
          Cesium.Math.toRadians(options.pitch || 0),
          options.range || 0
        ))
        break
    }
  }

  /**
   * 更新实时数据
   * @private
   */
  _updateRealTimeData(center) {
    const now = this.viewer.clock.currentTime
    const start = this.viewer.clock.startTime
    
    // 基础数据
    this.data.shouldAnimate = this.viewer.clock.shouldAnimate
    this.data.totalLength = this._calculateDistance(this.lines)
    this.data.totalTime = this._formatTime(this.time)
    
    // 时间差
    const secondsDiff = Cesium.JulianDate.secondsDifference(now, start)
    this.data.delTime = this._formatTime(secondsDiff)
    
    // 进度
    const progressRatio = Math.min(Math.max(secondsDiff / this.time, 0), 1)
    this.data.roamingLength = (parseFloat(this.data.totalLength) * progressRatio).toFixed(3)
    this.data.progress = (progressRatio * 100).toFixed(0) + '%'

    // 位置信息
    const carto = Cesium.Cartographic.fromCartesian(center)
    this.data.longitude = Cesium.Math.toDegrees(carto.longitude).toFixed(6)
    this.data.latitude = Cesium.Math.toDegrees(carto.latitude).toFixed(6)
    
    // 检查地形提供者是否支持采样
    const terrainProvider = this.viewer.terrainProvider
    if (terrainProvider instanceof Cesium.EllipsoidTerrainProvider) {
      // 如果是默认椭球体，不支持地形采样，直接返回0高度
      this.data.terrainHeight = 0.00
      this.data.roamingElevation = carto.height.toFixed(2)
      this.data.liftoffHeight = carto.height.toFixed(2)
      if (this._dataCallback) this._dataCallback(this.data)
      return
    }

    Cesium.sampleTerrainMostDetailed(terrainProvider, [carto]).then((updatedPositions) => {
      if (updatedPositions && updatedPositions[0]) {
        const terrainHeight = updatedPositions[0].height
        const currentHeight = carto.height
        
        this.data.terrainHeight = terrainHeight.toFixed(2)
        this.data.roamingElevation = currentHeight.toFixed(2)
        this.data.liftoffHeight = (currentHeight - terrainHeight).toFixed(2)
        
        // 触发回调
        if (this._dataCallback) this._dataCallback(this.data)
      }
    })
  }

  /**
   * 计算路径总距离
   * @private
   */
  _calculateDistance(positions) {
    if (!positions || positions.length < 2) return '0.000'
    
    let distance = 0
    const geodesic = new Cesium.EllipsoidGeodesic()
    
    for (let i = 0; i < positions.length - 1; i++) {
      const p1 = Cesium.Cartographic.fromCartesian(positions[i])
      const p2 = Cesium.Cartographic.fromCartesian(positions[i + 1])
      
      geodesic.setEndPoints(p1, p2)
      let s = geodesic.surfaceDistance
      // 加上垂直距离的平方，计算直线距离
      s = Math.sqrt(Math.pow(s, 2) + Math.pow(p2.height - p1.height, 2))
      distance += s
    }
    
    return distance.toFixed(3)
  }

  /**
   * 格式化时间
   * @private
   * @param {number} seconds 
   */
  _formatTime(seconds) {
    if (!seconds || seconds < 0) return '0秒'
    
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    
    let result = ''
    if (h > 0) result += `${h}小时`
    if (m > 0) result += `${m}分钟`
    if (s > 0) result += `${s}秒`
    
    return result || '0秒'
  }

      /**
     *漫游的暂停和继续
    *
    * @param {*} state bool类型 false为暂停，ture为继续
    * @memberof Roaming
    */
    pauseOrContinue (state) {
      this.viewer.clock.shouldAnimate = state;
    }

     /**
     *
     *取消漫游
    * @memberof Roaming
    */
    endRoaming () {
      if (this.entity !== undefined) {
        this.viewer.entities.remove(this.entity);
        this.viewer.entities.remove(this.polyline);
        this.viewer.entities.remove(this.cylinder);
        this.entity = undefined;
        this.polyline = undefined;
        this.cylinder = undefined;
        this.pauseOrContinue (false);

      }
    }
}

export default Roaming
