import * as Cesium from 'cesium';

// Helper functions
function defaultValue(a, b) {
  if (a !== undefined && a !== null) {
    return a;
  }
  return b;
}

export default class PolylineTrailMaterialProperty {
  constructor(options = {}) {
    this._definitionChanged = new Cesium.Event();
    
    const color = defaultValue(options.color, new Cesium.Color(1.0, 0.0, 0.0, 1.0));
    this._color = undefined;
    this._colorSubscription = undefined;
    this.color = (color && typeof color.getValue === 'function') ? color : new Cesium.ConstantProperty(color);
    
    this.speed = defaultValue(options.speed, 1.0);
    this.trailImage = defaultValue(options.trailImage, Cesium.Material.PolylineTrailLinkImage);
    this._time = new Date().getTime();
    
    this._initMaterial();
  }

  get isConstant() {
    return false;
  }

  get definitionChanged() {
    return this._definitionChanged;
  }

  getType(time) {
    return 'PolylineTrail';
  }

  getValue(time, result) {
    if (!Cesium.defined(result)) {
      result = {};
    }
    
    result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
    result.time = ((new Date().getTime() - this._time) % this.duration) / this.duration;
    result.image = this.trailImage;
    
    return result;
  }

  equals(other) {
    return (this === other ||
      (other instanceof PolylineTrailMaterialProperty &&
        Cesium.Property.equals(this._color, other._color) &&
        this.speed === other.speed &&
        this.trailImage === other.trailImage));
  }

  get color() {
    return this._color;
  }

  set color(value) {
    const oldValue = this._color;
    if (oldValue !== value) {
        if (this._colorSubscription) {
            this._colorSubscription();
            this._colorSubscription = undefined;
        }
        
        // 确保 value 是一个 Property
        const property = (value && typeof value.getValue === 'function') ? value : new Cesium.ConstantProperty(value);
        this._color = property;
        
        this._definitionChanged.raiseEvent(this, 'color', property, oldValue);
        
        // 如果是 Property，监听其变化
        if (typeof property.definitionChanged !== 'undefined') {
             this._colorSubscription = property.definitionChanged.addEventListener(function() {
                this._definitionChanged.raiseEvent(this, 'color', property, oldValue);
             }, this);
        }
    }
  }
  
  // 增加 duration 属性，控制周期时长(ms)
  get duration() {
      // 速度越快，周期越短。假设 speed 1.0 对应 3000ms
      return 3000 / this.speed;
  }

  _initMaterial() {
    if (Cesium.Material['PolylineTrail']) {
        return;
    }
    
    Cesium.Material['PolylineTrail'] = 'PolylineTrail';
    Cesium.Material._materialCache.addMaterial('PolylineTrail', {
      fabric: {
        type: 'PolylineTrail',
        uniforms: {
          color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
          time: 0,
          image: Cesium.Material.PolylineTrailLinkImage
        },
        source: `
          czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);
            vec2 st = materialInput.st;
            
            vec4 colorImage = texture(image, vec2(fract(st.s - time), st.t));
            
            material.alpha = colorImage.a * color.a;
            material.diffuse = (colorImage.rgb + color.rgb) / 2.0;
            return material;
          }
        `
      },
      translucent: function() {
        return true;
      }
    });
  }
}

// 默认定义一个线性渐变图作为 Trail 图片，如果项目中没有图片资源，可以用 canvas 生成
// 但为了简单，通常我们会依赖外部图片。
// 我们可以用 Canvas 动态生成一个渐变图片
function createTrailImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    gradient.addColorStop(1.0, 'rgba(255, 255, 255, 1.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 1);
    return canvas.toDataURL('image/png');
}

// 将生成的图片赋给 Material
Cesium.Material.PolylineTrailLinkImage = createTrailImage();

// 修正 source 中的 shader
// 注意：texture2D 已被 texture 替换，确保 image uniform 被正确传入
