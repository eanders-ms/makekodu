namespace kodu {
    export enum KelpieFlags {
        Invisible = 1 >> 0,
        HUD = 1 >> 1,
    }

    export class Kelpie extends sprites.BaseSprite {
        private _x: Fx8
        private _y: Fx8
        private _image: Image;
        private _data: any;
        private _flags: number;

        //% callInDebugger
        get x(): number {
            return Fx.toFloat(this._x);
        }
        set x(v: number) {
            this._x = Fx8(v);
        }

        //% callInDebugger
        get y(): number {
            return Fx.toFloat(this._y);
        }
        set y(v: number) {
            this._y = Fx8(v);
        }

        //% callInDebugger
        get width() {
            return this._image.width;
        }
        get height() {
            return this._image.height;
        }

        //% callInDebugger
        get left() {
            return Fx.toFloat(this._x) - (this.width >> 1);
        }
        set left(value: number) {
            this._x = Fx8(value - (this.width >> 1));
        }

        //% callInDebugger
        get right() {
            return this.left + this.width;
        }

        //% callInDebugger
        get top() {
            return Fx.toFloat(this._y) - (this.height >> 1);
        }
        set top(value: number) {
            this._y = Fx8(value + (this.width >> 1));
        }

        //% callInDebugger
        get bottom() {
            return this.top + this.height;
        }

        get data(): any {
            if (!this._data) this._data = {};
            return this._data;
        }
        set data(value: any) {
            this._data = value;
        }

        //% callInDebugger
        get image(): Image {
            return this._image;
        }
        setImage(img: Image) {
            if (!img) return;
            this._image = img;
        }

        //% callInDebugger
        get hud() { return !!(this._flags & KelpieFlags.HUD); }
        set hud(b: boolean) { b ? this._flags |= KelpieFlags.HUD : this._flags &= ~KelpieFlags.HUD; }

        //% callInDebugger
        get invisible() { return !!(this._flags & KelpieFlags.Invisible); }
        set invisible(b: boolean) { b ? this._flags |= KelpieFlags.Invisible : this._flags &= ~KelpieFlags.Invisible; }

        constructor(img: Image) {
            super(scene.SPRITE_Z);
            this._x = Fx8(screen.width - (img.width >> 1));
            this._y = Fx8(screen.height - (img.height >> 1));
            this.data["kelpie"] = 1; // hack for typecheck in getOverlapping
            this.setImage(img);
        }

        public destroy() {
            const scene = game.currentScene();
            scene.allSprites.removeElement(this);
            this._image = undefined;
        }

        isOutOfScreen(camera: scene.Camera): boolean {
            const ox = (this.hud) ? 0 : camera.drawOffsetX;
            const oy = (this.hud) ? 0 : camera.drawOffsetY;
            return this.right - ox < 0 || this.bottom - oy < 0 || this.left - ox > screen.width || this.top - oy > screen.height;
        }

        __visible(): boolean {
            return !this.invisible;
        }

        __drawCore(camera: scene.Camera) {
            if (this.isOutOfScreen(camera)) return;

            const ox = (this.hud) ? 0 : camera.drawOffsetX;
            const oy = (this.hud) ? 0 : camera.drawOffsetY;

            const l = this.left - ox;
            const t = this.top - oy;

            screen.drawTransparentImage(this._image, l, t);
        }
    }
}