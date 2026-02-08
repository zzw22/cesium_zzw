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

export class EllipsoidFadeMaterialProperty {
  constructor(color, duration) {
    this._definitionChanged = new Cesium.Event();
    this._color = undefined;
    this._colorSubscription = undefined;
    
    this.color = (color && typeof color.getValue === 'function') ? color : new Cesium.ConstantProperty(color);
    this.duration = duration;
    this._time = (new Date()).getTime();
    
    this._initMaterial();
  }

  _initMaterial() {
    if (Cesium.Material['EllipsoidFade']) {
      return;
    }
    
    Cesium.Material['EllipsoidFade'] = 'EllipsoidFade';
    Cesium.Material._materialCache.addMaterial('EllipsoidFade', {
      fabric: {
        type: 'EllipsoidFade',
        uniforms: {
          color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
          time: 0
        },
        source: `
          czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);
            material.diffuse = 1.5 * color.rgb;
            vec2 st = materialInput.st;
            float dis = distance(st, vec2(0.5, 0.5));
            float per = fract(time);
            if(dis > per * 0.5){
              material.alpha = 0.0;
              discard;
            } else {
              material.alpha = color.a * dis / per / 1.0;
            }
            return material;
          }
        `
      },
      translucent: function() {
        return true;
      }
    });
  }

  get isConstant() { return false; }
  get definitionChanged() { return this._definitionChanged; }
  getType(time) { return 'EllipsoidFade'; }
  getValue(time, result) {
    if (!defined(result)) {
      result = {};
    }
    result.color = Cesium.Property.getValueOrClonedDefault(this.color, time, Cesium.Color.WHITE, result.color);
    result.time = (((new Date()).getTime() - this._time) % this.duration) / this.duration;
    return result;
  }
  equals(other) {
    return this === other ||
      (other instanceof EllipsoidFadeMaterialProperty &&
        Cesium.Property.equals(this.color, other.color));
  }
}

Object.defineProperties(EllipsoidFadeMaterialProperty.prototype, {
  color: createPropertyDescriptor('color'),
  duration: createPropertyDescriptor('duration')
});
