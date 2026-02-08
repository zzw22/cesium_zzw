import * as Cesium from "cesium";

/**
 * 可视域分析核心类
 * 封装了 ShadowMap 和 视锥体可视化逻辑
 */
class ViewshedAnalysis {
    /**
     * @param {Cesium.Viewer} viewer 
     * @param {Cesium.Cartesian3} viewPosition 观察点位置
     * @param {Cesium.Cartesian3} targetPosition 目标点位置
     */
    constructor(viewer, viewPosition, targetPosition) {
        this.viewer = viewer;
        this.viewPosition = viewPosition;
        this.targetPosition = targetPosition;
        
        this.shadowMap = null;
        this.previousShadowMap = null;
        this.frustumPrimitive = null;
        this.sketchPrimitive = null;
        this.lightCamera = null;
        this.visibleEntities = [];
        this.invisibleEntities = [];
        this.visibleEdgeEntities = [];
        this.invisibleEdgeEntities = [];

        this.init();
    }

    init() {
        // 1. 创建光源相机 (Light Camera)
        this.createLightCamera();
        
        this.createResultVisualization();
    }

    createLightCamera() {
        this.lightCamera = new Cesium.Camera(this.viewer.scene);
        
        // 计算方向向量
        const direction = Cesium.Cartesian3.subtract(this.targetPosition, this.viewPosition, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(direction, direction);

        // 设置相机位置和方向
        this.lightCamera.position = this.viewPosition;
        this.lightCamera.direction = direction;
        this.lightCamera.up = Cesium.Cartesian3.clone(this.viewer.camera.up);
        this.lightCamera.right = Cesium.Cartesian3.cross(direction, this.lightCamera.up, new Cesium.Cartesian3());
        this.lightCamera.up = Cesium.Cartesian3.cross(this.lightCamera.right, direction, new Cesium.Cartesian3());

        // 设置视锥体参数
        const distance = Cesium.Cartesian3.distance(this.viewPosition, this.targetPosition);
        this.lightCamera.frustum = new Cesium.PerspectiveFrustum({
            fov: Cesium.Math.PI_OVER_THREE, // 60度视场角
            aspectRatio: 1.0,
            near: 1.0,
            far: distance + 100.0 // 稍微延伸一点
        });
    }

    createShadowMap() {
        if (!this.previousShadowMap) {
            this.previousShadowMap = this.viewer.scene.shadowMap;
        }
        this.shadowMap = new Cesium.ShadowMap({
            context: this.viewer.scene.context,
            lightCamera: this.lightCamera,
            enabled: true,
            isPointLight: true, // 视为点光源
            pointLightRadius: Cesium.Cartesian3.distance(this.viewPosition, this.targetPosition),
            cascadesEnabled: false,
            size: 2048,
            softShadows: true,
            normalOffset: false,
            fromLightCamera: true
        });
        
        this.viewer.scene.shadowMap = this.shadowMap;
    }

    getSurfacePoint(cartesian) {
        try {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const height = this.viewer.scene.globe.getHeight(cartographic);
            const finalHeight = Cesium.defined(height) ? height : cartographic.height;
            return Cesium.Cartesian3.fromRadians(
                cartographic.longitude,
                cartographic.latitude,
                finalHeight
            );
        } catch (e) {
            return cartesian;
        }
    }

    computeVisibilitySamples() {
        const scene = this.viewer.scene;
        const maxDistance = Cesium.Cartesian3.distance(this.viewPosition, this.targetPosition);
        const fov = this.lightCamera.frustum.fov;
        const half = fov * 0.5;
        const samples = 72;
        const baseDir = Cesium.Cartesian3.normalize(
            Cesium.Cartesian3.subtract(this.targetPosition, this.viewPosition, new Cesium.Cartesian3()),
            new Cesium.Cartesian3()
        );

        let up = Cesium.Cartesian3.normalize(this.viewPosition, new Cesium.Cartesian3());
        let right = Cesium.Cartesian3.cross(baseDir, up, new Cesium.Cartesian3());
        if (Cesium.Cartesian3.magnitude(right) === 0) {
            right = Cesium.Cartesian3.clone(this.viewer.camera.right);
        }
        Cesium.Cartesian3.normalize(right, right);
        up = Cesium.Cartesian3.cross(right, baseDir, new Cesium.Cartesian3());
        Cesium.Cartesian3.normalize(up, up);

        const visiblePoints = [];
        const outerPoints = [];
        for (let i = 0; i <= samples; i += 1) {
            const angle = -half + (fov * i) / samples;
            const rotation = Cesium.Quaternion.fromAxisAngle(up, angle);
            const rotMat = Cesium.Matrix3.fromQuaternion(rotation);
            const dir = Cesium.Matrix3.multiplyByVector(rotMat, baseDir, new Cesium.Cartesian3());
            const ray = new Cesium.Ray(this.viewPosition, dir);

            let position = null;
            const hit = scene.pickFromRay ? scene.pickFromRay(ray) : null;
            if (Cesium.defined(hit) && Cesium.defined(hit.position)) {
                position = hit.position;
            }
            if (!position && scene.globe) {
                position = scene.globe.pick(ray, scene);
            }
            if (!position) {
                position = Cesium.Cartesian3.add(
                    this.viewPosition,
                    Cesium.Cartesian3.multiplyByScalar(dir, maxDistance, new Cesium.Cartesian3()),
                    new Cesium.Cartesian3()
                );
            }
            const outer = Cesium.Cartesian3.add(
                this.viewPosition,
                Cesium.Cartesian3.multiplyByScalar(dir, maxDistance, new Cesium.Cartesian3()),
                new Cesium.Cartesian3()
            );

            const visDistance = Cesium.Cartesian3.distance(this.viewPosition, position);
            if (visDistance > maxDistance) {
                position = outer;
            }

            visiblePoints.push(this.getSurfacePoint(position));
            outerPoints.push(this.getSurfacePoint(outer));
        }

        return { visiblePoints, outerPoints };
    }

    createResultVisualization() {
        const samples = this.computeVisibilitySamples();
        if (!samples || samples.visiblePoints.length < 3) return;

        const viewSurface = this.getSurfacePoint(this.viewPosition);
        const visiblePoints = samples.visiblePoints;
        const outerPoints = samples.outerPoints;

        for (let i = 0; i < visiblePoints.length - 1; i += 1) {
            const v0 = visiblePoints[i];
            const v1 = visiblePoints[i + 1];
            const o0 = outerPoints[i];
            const o1 = outerPoints[i + 1];

            this.visibleEntities.push(this.viewer.entities.add({
                polygon: {
                    hierarchy: [viewSurface, v0, v1],
                    material: Cesium.Color.LIME.withAlpha(0.65),
                    perPositionHeight: true,
                    outline: true,
                    outlineColor: Cesium.Color.LIME
                }
            }));

            this.visibleEdgeEntities.push(this.viewer.entities.add({
                polyline: {
                    positions: [viewSurface, v0, v1, viewSurface],
                    width: 1.5,
                    material: Cesium.Color.LIME,
                    clampToGround: true
                }
            }));

            if (Cesium.Cartesian3.distance(v0, o0) > 0.5 || Cesium.Cartesian3.distance(v1, o1) > 0.5) {
                this.invisibleEntities.push(this.viewer.entities.add({
                    polygon: {
                        hierarchy: [v0, v1, o1, o0],
                        material: Cesium.Color.RED.withAlpha(0.65),
                        perPositionHeight: true,
                        outline: true,
                        outlineColor: Cesium.Color.RED
                    }
                }));

                this.invisibleEdgeEntities.push(this.viewer.entities.add({
                    polyline: {
                        positions: [v0, v1, o1, o0, v0],
                        width: 1.5,
                        material: Cesium.Color.RED,
                        clampToGround: true
                    }
                }));
            }
        }
    }

    createFrustumVisualization() {
        // 计算四元数用于姿态
        const direction = this.lightCamera.direction;
        const hpr = new Cesium.HeadingPitchRoll(
            Math.atan2(direction.y, direction.x), 
            Math.asin(direction.z), 
            0.0
        );
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(this.viewPosition, hpr);

        // 创建视锥体线框
        const instance = new Cesium.GeometryInstance({
            geometry: new Cesium.FrustumOutlineGeometry({
                frustum: this.lightCamera.frustum,
                origin: this.viewPosition,
                orientation: orientation
            }),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.YELLOW.withAlpha(0.5))
            }
        });

        this.frustumPrimitive = this.viewer.scene.primitives.add(new Cesium.Primitive({
            geometryInstances: instance,
            appearance: new Cesium.PerInstanceColorAppearance({
                flat: true,
                translucent: true
            })
        }));
    }

    destroy() {
        if (!this.viewer || this.viewer.isDestroyed()) {
            this.shadowMap = null;
            this.frustumPrimitive = null;
            this.visibleEntities = [];
            this.invisibleEntities = [];
            this.visibleEdgeEntities = [];
            this.invisibleEdgeEntities = [];
            return;
        }
        // 移除图元
        if (this.frustumPrimitive) {
            this.viewer.scene.primitives.remove(this.frustumPrimitive);
            this.frustumPrimitive = null;
        }

        if (this.visibleEntities.length) {
            this.visibleEntities.forEach((entity) => this.viewer.entities.remove(entity));
            this.visibleEntities = [];
        }

        if (this.invisibleEntities.length) {
            this.invisibleEntities.forEach((entity) => this.viewer.entities.remove(entity));
            this.invisibleEntities = [];
        }

        if (this.visibleEdgeEntities.length) {
            this.visibleEdgeEntities.forEach((entity) => this.viewer.entities.remove(entity));
            this.visibleEdgeEntities = [];
        }

        if (this.invisibleEdgeEntities.length) {
            this.invisibleEdgeEntities.forEach((entity) => this.viewer.entities.remove(entity));
            this.invisibleEdgeEntities = [];
        }

        // 恢复默认 ShadowMap
        if (this.shadowMap) {
            if (this.previousShadowMap) {
                this.viewer.scene.shadowMap = this.previousShadowMap;
            } else {
                this.viewer.scene.shadowMap.enabled = false;
            }
            this.shadowMap = null;
        }
    }
}

export default ViewshedAnalysis;
