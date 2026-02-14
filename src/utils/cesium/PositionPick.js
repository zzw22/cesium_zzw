import * as Cesium from 'cesium';
import './PositionPick.css';

/**
 * 经纬度信息拾取类 在场景中显示经度 纬度 高度信息
 */
export default class PositionPick {
    constructor(viewer, position, options = {}) {
        this.position = position;
        this.index = (new Date().getTime()) + Math.random();
        this.viewer = viewer;
        this.options = options;
        this.onRemove = options.onRemove; // Callback when removed
        this.onUpdate = options.onUpdate; // Callback when position updates
        this.enableDragging = options.enableDragging !== false; // Default to true

        const c = Cesium.Cartographic.fromCartesian(this.position);
        const point = {
            x: Cesium.Math.toDegrees(c.longitude),
            y: Cesium.Math.toDegrees(c.latitude),
            z: c.height,
        };

        this.createDom(point);

        viewer.cesiumWidget.container.appendChild(this.container);
        this.addPostRender();
        this.addBillboard();
        this.initEvents();
    }

    createDom(point) {
        this.container = document.createElement("div");
        this.container.classList.add("LocationPlot-container");
        this.container.innerHTML = `
            <div class="info-item info-item-close">
                <span>位置信息</span>
                <span class="info-close" title="关闭">×</span>
            </div>
            <div class="info-item">
                <span class="info-label">经度：</span>
                <span class="info-value lonId">${point.x.toFixed(6)}°</span>
            </div>
            <div class="info-item">
                <span class="info-label">纬度：</span>
                <span class="info-value latId">${point.y.toFixed(6)}°</span>
            </div>
            <div class="info-item">
                <span class="info-label">高度：</span>
                <span class="info-value altId">${point.z.toFixed(2)}m</span>
            </div>`;
            
        const closeBtn = this.container.querySelector('.info-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                this.remove();
            };
        }
    }

    updatePosition(newPosition) {
        this.position = newPosition;
        if (this.onUpdate) {
            this.onUpdate(newPosition);
        }
        const c = Cesium.Cartographic.fromCartesian(this.position);
        const point = {
            x: Cesium.Math.toDegrees(c.longitude),
            y: Cesium.Math.toDegrees(c.latitude),
            z: c.height,
        };
        this.setValue(point);
    }

    setValue(point) {
        const lonEl = this.container.querySelector(".lonId");
        const latEl = this.container.querySelector(".latId");
        const altEl = this.container.querySelector(".altId");
        
        if (lonEl) lonEl.innerHTML = `${point.x.toFixed(6)}°`;
        if (latEl) latEl.innerHTML = `${point.y.toFixed(6)}°`;
        if (altEl) altEl.innerHTML = `${point.z.toFixed(2)}m`;
    }

    addBillboard() {
        if (this.options.imgUrl) {
            // If image is provided, use Billboard
            this.locationBillboard = this.viewer.entities.add({
                position: new Cesium.CallbackProperty(() => {
                    return this.position;
                }, false),
                type: "PositionPick",
                index: this.index,
                billboard: {
                    image: this.options.imgUrl,
                    width: this.options.width || 32,
                    height: this.options.height || 32,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, 
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                }
            });
        } else {
            // Otherwise default to Point
            this.locationBillboard = this.viewer.entities.add({
                position: new Cesium.CallbackProperty(() => {
                    return this.position;
                }, false),
                type: "PositionPick",
                index: this.index,
                point: {
                    pixelSize: 10,
                    color: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, 
                    disableDepthTestDistance: Number.POSITIVE_INFINITY, 
                }
            });
        }
    }

    addPostRender() {
        this.postRenderHandler = this.postRender.bind(this);
        this.viewer.scene.postRender.addEventListener(this.postRenderHandler);
    }

    postRender() {
        if (!this.container || !this.container.style) return;
        
        const canvasHeight = this.viewer.scene.canvas.height;
        const windowPosition = new Cesium.Cartesian2();
        
        // Convert Cartesian3 to Window Coordinates
        try {
            // Cesium.SceneTransforms.wgs84ToWindowCoordinates was removed in Cesium 1.107+
            // Use scene.cartesianToCanvasCoordinates instead
            const result = this.viewer.scene.cartesianToCanvasCoordinates(this.position, windowPosition);
            
            // If position is behind the camera or off-screen in a way wgs84ToWindowCoordinates handles poorly
            if (!result) {
                this.container.style.display = "none";
                return;
            }

            // Simple visibility check (is it on screen?)
            // Note: wgs84ToWindowCoordinates can return coordinates outside canvas
            
            // Update position
            this.container.style.position = "absolute";
            // Offset logic: The box should be above the pin.
            // Pin height is ~48px. Container bottom is at 0. css::before adds 30px line.
            // So container bottom should be at windowPosition.y - some_offset
            // Actually, `bottom` CSS property is distance from bottom of parent.
            // windowPosition.y is from top.
            
            const bottom = canvasHeight - windowPosition.y + 50; // 50px offset up
            this.container.style.bottom = `${bottom}px`;
            
            const elWidth = this.container.offsetWidth;
            this.container.style.left = `${windowPosition.x - (elWidth / 2)}px`;
            this.container.style.display = "block";

            // Hide if camera is too high? The demo had this logic.
            // if (this.viewer.camera.positionCartographic.height > 100000) {
            //     this.container.style.display = "none";
            // }

        } catch (e) {
            console.error("PositionPick postRender error:", e);
            this.container.style.display = "none";
        }
    }

    initEvents() {
        this.eventHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.registerMouseEvents();
    }

    registerMouseEvents() {
        this.initLeftDownEventHandler();
        this.initMouseMoveEventHandler();
        this.initLeftUpEventHandler();
    }

    unRegisterMouseEvents() {
        if (this.eventHandler) {
            this.eventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
            this.eventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
            this.eventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.eventHandler.destroy();
            this.eventHandler = null;
        }
    }

    initLeftDownEventHandler() {
        this.eventHandler.setInputAction((e) => {
            if (!this.enableDragging) return;
            const picked = this.viewer.scene.pick(e.position);
            if (!picked || !picked.id || !picked.id.type) return;

            if (picked.id.type === "PositionPick" && picked.id.index === this.index) {
                this.isEditing = true;
                this.viewer.scene.screenSpaceCameraController.enableRotate = false;
                this.viewer.enableCursorStyle = false;
                this.viewer._element.style.cursor = '';
                document.body.style.cursor = "move";
            }
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
    }

    initLeftUpEventHandler() {
        this.eventHandler.setInputAction(() => {
            if (this.isEditing) {
                this.isEditing = false;
                this.viewer.enableCursorStyle = true;
                document.body.style.cursor = "default";
                this.viewer.scene.screenSpaceCameraController.enableRotate = true;
            }
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
    }

    initMouseMoveEventHandler() {
        this.eventHandler.setInputAction((e) => {
            if (!this.isEditing) return;
            
            const ray = this.viewer.camera.getPickRay(e.endPosition);
            const position = this.viewer.scene.globe.pick(ray, this.viewer.scene);
            
            if (position) {
                this.updatePosition(position);
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    }

    remove() {
        this.unRegisterMouseEvents();
        if (this.locationBillboard) {
            this.viewer.entities.remove(this.locationBillboard);
        }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        if (this.postRenderHandler) {
            this.viewer.scene.postRender.removeEventListener(this.postRenderHandler);
        }
        if (this.onRemove) {
            this.onRemove(this);
        }
    }
}