/*
 * @Title: 
 * @Author: zhangzhiwei
 * @Date: 2026-02-10 21:17:40
 * @FilePath: \src\utils\cesium\CircleGradientMaterialProperty.js
 * @Description: 
 */
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

export default class CircleGradientMaterialProperty {
  constructor(color) {
    this._definitionChanged = new Cesium.Event();
    this._color = undefined;
    this._colorSubscription = undefined;
    
    this.color = (color && typeof color.getValue === 'function') ? color : new Cesium.ConstantProperty(color);
    
    this._initMaterial();
  }

  _initMaterial() {
    if (Cesium.Material['CircleGradient']) {
      return;
    }
    
    Cesium.Material['CircleGradient'] = 'CircleGradient';
    Cesium.Material._materialCache.addMaterial('CircleGradient', {
      fabric: {
        type: 'CircleGradient',
        uniforms: {
          color: new Cesium.Color(1.0, 1.0, 1.0, 0.6)
        },
        source: `
          czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);
            material.diffuse = color.rgb;
            
            vec2 st = materialInput.st;
            float dis = distance(st, vec2(0.5, 0.5));
            
            // Calculate alpha: 1.0 at center, 0.0 at radius 0.5
            float alpha = 1.0 - smoothstep(0.0, 0.5, dis);
            
            material.alpha = color.a * alpha;
            return material;
          }
        `
      },
      translucent: function() {
        return true;
      }
    });
  }

  get isConstant() { return true; } // It's constant over time, though property values might change
  get definitionChanged() { return this._definitionChanged; }
  getType(time) { return 'CircleGradient'; }
  getValue(time, result) {
    if (!defined(result)) {
      result = {};
    }
    result.color = Cesium.Property.getValueOrClonedDefault(this.color, time, Cesium.Color.WHITE, result.color);
    return result;
  }
  equals(other) {
    return this === other ||
      (other instanceof CircleGradientMaterialProperty &&
        Cesium.Property.equals(this.color, other.color));
  }
}

Object.defineProperties(CircleGradientMaterialProperty.prototype, {
  color: createPropertyDescriptor('color')
});
