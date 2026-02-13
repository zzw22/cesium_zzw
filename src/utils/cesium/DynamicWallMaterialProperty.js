import * as Cesium from 'cesium';

// Helper functions
function defaultValue(a, b) {
  if (a !== undefined && a !== null) {
    return a;
  }
  return b;
}

function defined(value) {
  return value !== undefined && value !== null;
}

function createPropertyDescriptor(name) {
  return {
    get: function() {
      return this['_' + name];
    },
    set: function(value) {
      const oldValue = this['_' + name];
      if (oldValue !== value) {
        this['_' + name] = value;
        this._definitionChanged.raiseEvent(this, name, value, oldValue);
      }
    }
  };
}

/**
 * 带方向的墙体Shader生成
 * 借鉴 1.html 的逻辑
 */
function _getDirectionWallShader(options) {
  if (options && options.get) {
    var materail = "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
      {\n\
          czm_material material = czm_getDefaultMaterial(materialInput);\n\
          vec2 st = materialInput.st;";
    
    // 1.html logic:
    // freely == "vertical" -> st.t animation (vertical)
    // freely != "vertical" -> st.s animation (horizontal)
    if (options.freely == "vertical") { 
      // Vertical movement (along height)
      materail += "vec4 colorImage = texture(image, vec2(fract(st.s), fract(float(" + options.count + ")*st.t" + options.direction + " time)));\n\ ";
    } else { 
      // Horizontal movement (along length)
      materail += "vec4 colorImage = texture(image, vec2(fract(float(" + options.count + ")*st.s " + options.direction + " time), fract(st.t)));\n\ ";
    }

    // 泛光/混合逻辑 from 1.html
    materail += "vec4 fragColor;\n\
          fragColor.rgb = (colorImage.rgb+color.rgb) / 1.0;\n\
          fragColor = czm_gammaCorrect(fragColor);\n\
          material.diffuse = colorImage.rgb;\n\
          material.alpha = colorImage.a;\n\
          material.emission = fragColor.rgb;\n\
          return material;\n\
      }";
    return materail;
  }
}

export default class DynamicWallMaterialProperty {
  constructor(options) {
    options = defaultValue(options, {});
    this._definitionChanged = new Cesium.Event();
    this._color = undefined;
    this._colorSubscription = undefined;
    
    const color = defaultValue(options.color, new Cesium.Color(1.0, 1.0, 1.0, 1.0));
    this.color = (defined(color) && typeof color.getValue === 'function') ? color : new Cesium.ConstantProperty(color);
    
    this.duration = defaultValue(options.duration, 1000);
    this.trailImage = options.trailImage;
    this.freely = defaultValue(options.freely, 'vertical'); // 'vertical' or 'standard' (horizontal)
    this.direction = defaultValue(options.direction, '-'); // '+' or '-'
    this.count = defaultValue(options.count, 1.0);
    
    this._time = (new Date()).getTime();
    
    this._initMaterial();
  }

  _initMaterial() {
    // Generate a unique type name based on configuration to allow different directions/counts
    // We use properties that affect shader code in the ID
    const MaterialType = `DynamicWall_${this.freely}_${this.direction}_${this.count}`;
    this._materialType = MaterialType;

    if (Cesium.Material[MaterialType]) {
        return;
    }

    Cesium.Material[MaterialType] = MaterialType;
    Cesium.Material._materialCache.addMaterial(MaterialType, {
      fabric: {
        type: MaterialType,
        uniforms: {
          color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
          image: Cesium.Material.DefaultImageId,
          time: 0
        },
        source: _getDirectionWallShader({
          get: true,
          count: this.count,
          freely: this.freely,
          direction: this.direction
        })
      },
      translucent: function (material) {
        return true;
      }
    });
  }

  get isConstant() { return false; }
  get definitionChanged() { return this._definitionChanged; }
  
  getType(time) { 
    return this._materialType; 
  }
  
  getValue(time, result) {
    if (!defined(result)) {
      result = {};
    }
    result.color = Cesium.Property.getValueOrClonedDefault(this.color, time, Cesium.Color.WHITE, result.color);
    result.image = this.trailImage;
    if (this.duration) {
      result.time = (((new Date()).getTime() - this._time) % this.duration) / this.duration;
    }
    return result;
  }
  
  equals(other) {
    return this === other ||
      (other instanceof DynamicWallMaterialProperty
        && Cesium.Property.equals(this.color, other.color)
        && this.duration === other.duration
        && this.freely === other.freely
        && this.direction === other.direction
        && this.count === other.count
      );
  }
}

Object.defineProperties(DynamicWallMaterialProperty.prototype, {
  color: createPropertyDescriptor('color')
});
