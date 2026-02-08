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

export class CircleWaveMaterialProperty {
  constructor(options = {}) {
    this._definitionChanged = new Cesium.Event();
    
    const color = defaultValue(options.color, new Cesium.Color(1.0, 0.0, 0.0, 1.0));
    this.color = (color && typeof color.getValue === 'function') ? color : new Cesium.ConstantProperty(color);
    
    this.duration = defaultValue(options.duration, 1000);
    this.count = defaultValue(options.count, 2);
    this.gradient = defaultValue(options.gradient, 0.1);
    this.time = new Date().getTime();
    
    this._initMaterial();
  }

  _initMaterial() {
    if (Cesium.Material['CircleWave']) {
        return;
    }
    
    Cesium.Material['CircleWave'] = 'CircleWave';
    Cesium.Material._materialCache.addMaterial('CircleWave', {
      fabric: {
        type: 'CircleWave',
        uniforms: {
          color: new Cesium.Color(1.0, 0.0, 0.0, 1.0),
          time: 0,
          count: 1,
          gradient: 0.1
        },
        source: `
          czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);
            material.diffuse = 1.5 * color.rgb;
            vec2 st = materialInput.st;
            vec3 str = materialInput.str;
            float dis = distance(st, vec2(0.5, 0.5));
            float per = fract(time);
            if (abs(str.z) > 0.001) {
              discard;
            }
            if (dis > 0.5) {
              discard;
            } else {
              float perDis = 0.5 / count;
              float disNum;
              float bl = .0;
              for (int i = 0; i <= 9; i++) {
                if (float(i) <= count) {
                  disNum = perDis * float(i) - dis + per / count;
                  if (disNum > 0.0) {
                    if (disNum < perDis) {
                      bl = 1.0 - disNum / perDis;
                    } else if(disNum - perDis < perDis) {
                      bl = 1.0 - abs(1.0 - disNum / perDis);
                    }
                    material.alpha = pow(bl, gradient);
                  }
                }
              }
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
  getType(time) { return 'CircleWave'; }
  getValue(time, result) {
    if (!defined(result)) {
      result = {};
    }
    result.color = Cesium.Property.getValueOrClonedDefault(this.color, time, Cesium.Color.WHITE, result.color);
    result.time = ((new Date().getTime() - this.time) % this.duration) / this.duration;
    result.count = this.count;
    result.gradient = 1 + 10 * (1 - this.gradient);
    return result;
  }
  equals(other) {
    return this === other || (other instanceof CircleWaveMaterialProperty && Cesium.Property.equals(this.color, other.color));
  }
}

Object.defineProperties(CircleWaveMaterialProperty.prototype, {
  color: createPropertyDescriptor('color'),
  duration: createPropertyDescriptor('duration'),
  count: createPropertyDescriptor('count'),
  gradient: createPropertyDescriptor('gradient')
});
