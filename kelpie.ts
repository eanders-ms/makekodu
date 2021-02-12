namespace kodu {
    export enum KelpieFlags {
        Invisible = 1 >> 0,
        HUD = 1 >> 1,
        NonInteractible = 1 >> 2
    }

    export type KelpieHandler = (kelpie: Kelpie) => void;

    /**
     * A kelpie is a shape-shifting spirit inhabiting lakes in Scottish folklore.
     * It's basically a sprite.
     */
    export class Kelpie extends sprites.BaseSprite {
        private _x: Fx8
        private _y: Fx8
        private _image: Image;
        private _data: any;
        private _flags: number;
        private _hitbox: Hitbox;
        private _destroyHandlers: KelpieHandler[];
        private _moveHandlers: KelpieHandler[];
        private _moved: boolean;
        
        onUpdate: (dt: number) => void;

        //% blockCombine block="x" callInDebugger
        get x(): number {
            return Fx.toFloat(this._x);
        }
        set x(v: number) {
            const fxv = Fx8(v);
            if (fxv !== this._x) {
                this._x = Fx8(v);
                this._moved = true;
            }
        }

        //% blockCombine block="y" callInDebugger
        get y(): number {
            return Fx.toFloat(this._y);
        }
        set y(v: number) {
            const fxv = Fx8(v);
            if (fxv !== this._y) {
                this._y = Fx8(v);
                this._moved = true;
            }
        }

        //% blockCombine block="x" callInDebugger
        get pos(): Vec2 {
            return new Vec2(this.x, this.y);
        }

        //% blockCombine block="width" callInDebugger
        get width() {
            return this._image.width;
        }
        //% blockCombine block="height" callInDebugger
        get height() {
            return this._image.height;
        }

        //% blockCombine block="left" callInDebugger
        get left() {
            return this.x - (this.width >> 1);
        }
        set left(value: number) {
            this.x = value - (this.width >> 1);
        }

        //% blockCombine block="right" callInDebugger
        get right() {
            return this.left + this.width;
        }

        //% blockCombine block="top" callInDebugger
        get top() {
            return this.y - (this.height >> 1);
        }
        set top(value: number) {
            this.y = value + (this.width >> 1);
        }

        //% blockCombine block="bottom" callInDebugger
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

        //% blockCombine block="image" callInDebugger
        get image(): Image {
            return this._image;
        }
        set image(img: Image) {
            this.setImage(img);
        }

        //% blockCombine block="image" callInDebugger
        get hitbox(): Hitbox { return this._hitbox; }
        set hitbox(v: Hitbox) { this._hitbox = v; }

        //% blockCombine block="hud" callInDebugger
        get hud() { return !!(this._flags & KelpieFlags.HUD); }
        set hud(b: boolean) { b ? this._flags |= KelpieFlags.HUD : this._flags &= ~KelpieFlags.HUD; }

        //% blockCombine block="invisible" callInDebugger
        get invisible() { return !!(this._flags & KelpieFlags.Invisible); }
        set invisible(b: boolean) { b ? this._flags |= KelpieFlags.Invisible : this._flags &= ~KelpieFlags.Invisible; }

        //% blockCombine block="interactible" callInDebugger
        get interactible() { return !(this._flags & KelpieFlags.NonInteractible); }
        set interactible(b: boolean) { (!b) ? this._flags |= KelpieFlags.NonInteractible : this._flags &= ~KelpieFlags.NonInteractible; }

        constructor(img: Image) {
            super(scene.SPRITE_Z);
            this._x = Fx8(screen.width - (img.width >> 1));
            this._y = Fx8(screen.height - (img.height >> 1));
            this.image = img; // initializes hitbox
            this.onDestroy((k: Kelpie) => {
                const scene = game.currentScene();
                scene.allSprites.removeElement(k);
            });
        }

        public destroy() {
            const handlers = this._destroyHandlers || [];
            for (const handler of handlers) {
                handler(this);
            }
            this._image = undefined;
            this._hitbox = undefined;
            this._data = undefined;
            this._destroyHandlers = undefined;
        }

        public onDestroy(handler: KelpieHandler) {
            this._destroyHandlers = this._destroyHandlers || [];
            this._destroyHandlers.push(handler);
        }

        public onMoved(handler: KelpieHandler) {
            this._moveHandlers = this._moveHandlers || [];
            this._moveHandlers.push(handler);
        }

        protected setImage(img: Image) {
            this._image = img;
            this._hitbox = util.calculateHitbox(this);
        }

        private isOutOfScreen(camera: scene.Camera): boolean {
            const ox = (this.hud) ? 0 : camera.drawOffsetX;
            const oy = (this.hud) ? 0 : camera.drawOffsetY;
            return this.left - ox > screen.width || this.top - oy > screen.height || this.right - ox < 0 || this.bottom - oy < 0;
        }

        private fireMoved() {
            const handlers = this._moveHandlers|| [];
            for (const handler of handlers) {
                handler(this);
            }
        }

        __visible(): boolean {
            // Would be nice if the camera was passed in, for clip check.
            return !this.invisible;
        }

        __drawCore(camera: scene.Camera) {
            if (this.isOutOfScreen(camera)) { return; }

            const ox = (this.hud) ? 0 : camera.drawOffsetX;
            const oy = (this.hud) ? 0 : camera.drawOffsetY;

            const l = this.left - ox;
            const t = this.top - oy;

            screen.drawTransparentImage(this._image, l, t);

            /* Render hitbox
            const bounds = HitboxBounds.FromKelpie(this);
            screen.drawLine(bounds.left  - ox, bounds.top    - oy, bounds.right - ox, bounds.top    - oy, 15);
            screen.drawLine(bounds.left  - ox, bounds.bottom - oy, bounds.right - ox, bounds.bottom - oy, 15);
            screen.drawLine(bounds.left  - ox, bounds.top    - oy, bounds.left  - ox, bounds.bottom - oy, 15);
            screen.drawLine(bounds.right - ox, bounds.top    - oy, bounds.right - ox, bounds.bottom - oy, 15);
            */

            /* Render containing GridTiles */
            if (DBG_RENDER_GRIDTILES) {
                const gb = this.data[GRID_BOUNDS] as HitboxBounds;
                if (gb) {
                    const radar = this.data[".sys-dbg-tilegrid"] as KelpieGrid;
                    if (radar) {
                        const tileSet = radar.extractTileSet(gb);
                        const draw = (tile: GridTile) => {
                            const left = tile.col * GRID_DIM - ox;
                            const top = tile.row * GRID_DIM - oy;
                            const right = left + GRID_DIM;
                            const bottom = top + GRID_DIM;
                            screen.drawLine(left , top   , right, top   , 14);
                            screen.drawLine(left , bottom, right, bottom, 14);
                            screen.drawLine(left , top   , left , bottom, 14);
                            screen.drawLine(right, top   , right, bottom, 14);
                        }
                        if (tileSet.topLeft) { draw(tileSet.topLeft); }
                        if (tileSet.topRight) { draw(tileSet.topRight); }
                        if (tileSet.bottomLeft) { draw(tileSet.bottomLeft); }
                        if (tileSet.bottomRight) { draw(tileSet.bottomRight); }
                    }
                }
            }
        }

        __update(camera: scene.Camera, dt: number) {
            // Hm, dt is always 0.
            if (this.onUpdate) { this.onUpdate(dt); }

            if (this._moved) {
                this._moved = false;
                this.fireMoved();
            }
        }
    }

    class GridTile {
        kels: Kelpie[];
        constructor(public row: number, public col: number) {
            this.kels = [];
        }
        add(k: Kelpie) {
            this.kels[k.id] = k;
        }
        remove(k: Kelpie) {
            this.kels[k.id] = undefined;
        }
        collectInto(dst: Kelpie[]) {
            this.kels.forEach(k => dst.push(k));
        }
    }

    class GridTileSet {

        get left(): number {
            if (this.topLeft) { return this.topLeft.col; }
            if (this.bottomLeft) { return this.bottomLeft.col; }
            if (this.topRight) { return this.topRight.col; }
            if (this.bottomRight) { return this.bottomRight.col; }
            return undefined;
        }

        get right(): number {
            if (this.topRight) { return this.topRight.col + GRID_DIM; }
            if (this.bottomRight) { return this.bottomRight.col + GRID_DIM; }
            if (this.topLeft) { return this.topLeft.col + GRID_DIM; }
            if (this.bottomLeft) { return this.bottomLeft.col + GRID_DIM; }
            return undefined;
        }

        get top(): number {
            if (this.topLeft) { return this.topLeft.row; }
            if (this.topRight) { return this.topRight.row; }
            if (this.bottomRight) { return this.bottomRight.row; }
            if (this.bottomLeft) { return this.bottomLeft.row; }
            return undefined;
        }

        get bottom(): number {
            if (this.bottomRight) { return this.bottomRight.row; }
            if (this.bottomLeft) { return this.bottomLeft.row; }
            if (this.topLeft) { return this.topLeft.row; }
            if (this.topRight) { return this.topRight.row; }
            return undefined;
        }

        constructor(
            public topLeft: GridTile,
            public topRight: GridTile,
            public bottomLeft: GridTile,
            public bottomRight: GridTile) { }

        public remove(kelpie: Kelpie) {
            if (this.topLeft) { this.topLeft.remove(kelpie); }
            if (this.topRight) { this.topRight.remove(kelpie); }
            if (this.bottomLeft) { this.bottomLeft.remove(kelpie); }
            if (this.bottomRight) { this.bottomRight.remove(kelpie); }
        }

        public collectInto(dst: Kelpie[]) {
            if (this.topLeft) { this.topLeft.collectInto(dst); }
            if (this.topRight) { this.topRight.collectInto(dst); }
            if (this.bottomLeft) { this.bottomLeft.collectInto(dst); }
            if (this.bottomRight) { this.bottomRight.collectInto(dst); }
        }
    }

    // As implemented, GRID_DIM must be at least as large as the largest interactible kelpie,
    // otherwise the interior grid tiles won't be included. It will be straight forward to
    // include interior tiles as soon as we want it.
    const GRID_DIM = 16;
    const GRID_BOUNDS = ".sys-grid-bounds";
    const DBG_RENDER_GRIDTILES = true;

    export class KelpieGrid {
        // [row][col], e.g. [top][left]
        private tiles: GridTile[][];

        constructor() {
            this.tiles = [];
        }

        public destroy() {
            this.tiles = undefined;
        }

        public add(kelpie: Kelpie) {
            if (!kelpie) { return; }
            kelpie.onMoved(() => this.handleKelpieMoved(kelpie));
            kelpie.onDestroy(() => this.handleKelpieDestroy(kelpie));
            const bounds = HitboxBounds.FromKelpie(kelpie);
            kelpie.data[GRID_BOUNDS] = bounds;
            if (DBG_RENDER_GRIDTILES) {
                kelpie.data[".sys-dbg-tilegrid"] = this;
            }
            this.refresh(kelpie);
        }

        public remove(kelpie: Kelpie) {
            const bounds = HitboxBounds.FromKelpie(kelpie);
            const tileSet = this.extractTileSet(bounds);
            if (tileSet) {
                tileSet.remove(kelpie);
            }
        }

        public getOverlapping(src: Kelpie): Kelpie[] {
            const bounds = HitboxBounds.FromKelpie(src);
            const kels = this.getOverlappingFromBounds(bounds);
            return kels.filter(k => k !== src);
        }

        public getOverlappingFromBounds(bounds: HitboxBounds): Kelpie[] {
            // kels may contain dups, that's ok.
            let kels: Kelpie[] = [];
            const tileSet = this.extractTileSet(bounds);
            if (tileSet) {
                tileSet.collectInto(kels);
            }
            return kels
                .filter(k => k && !k.invisible && k.interactible)
                .filter(k => {
                    const kbounds = HitboxBounds.FromKelpie(k);
                    return util.hitboxBoundsOverlap(kbounds, bounds);
                })
                .sort((a, b) => b.z - a.z);
        }

        public getNearestInDirection(src: Kelpie, dir: CardinalDirection, minDist: number, maxDist: number): Kelpie {
            minDist = Math.max(0, Math.floor(minDist / GRID_DIM));
            maxDist = Math.max(0, Math.floor(maxDist / GRID_DIM));
            const bounds = HitboxBounds.FromKelpie(src);
            const gridbounds = this.toGridCoords(bounds);
            gridbounds.occupy(dir);
            for (let dist = minDist; dist <= maxDist; ++dist) {
                let kels = this.collectEdgeKels(gridbounds)
                kels = kels.filter(k => k && k !== src && !k.invisible && k.interactible)
                kels = kels.filter(k => {
                        const kb = HitboxBounds.FromKelpie(k);
                        return !util.hitboxBoundsOverlap(kb, bounds)
                    })
                kels = kels.filter(k => {
                        if (dir & CardinalDirection.North) { return k.y < src.y; }
                        if (dir & CardinalDirection.South) { return k.y > src.y; }
                        if (dir & CardinalDirection.East ) { return k.x > src.x; }
                        if (dir & CardinalDirection.West ) { return k.x < src.x; }
                        return false;
                    })
                kels = kels.sort((a, b) => Vec2.DistanceSq(a, b))
                    //.sort((a, b) => b.z - a.z);
                const kel = kels.shift();
                if (kel) { return kel; }
                gridbounds.expand(dir);
            }
            return null;
        }

        private collectEdgeKels(gridbounds: HitboxBounds): Kelpie[] {
            let kels: Kelpie[] = [];
            for (let col = gridbounds.left; col <= gridbounds.right; ++col) {
                const topTile = this.getTile(gridbounds.top, col);
                if (topTile) { topTile.collectInto(kels); }
                const bottomTile = this.getTile(gridbounds.bottom, col);
                if (bottomTile && bottomTile !== topTile) { bottomTile.collectInto(kels); }
            }
            for (let row = gridbounds.top + 1; row <= gridbounds.bottom - 1; ++row) {
                const leftTile = this.getTile(row, gridbounds.left);
                if (leftTile) { leftTile.collectInto(kels); }
                const rightTile = this.getTile(row, gridbounds.right);
                if (rightTile && rightTile !== leftTile) { rightTile.collectInto(kels); }
            }
            return kels;
        }

        /**
         * From the hitbox, return a set of grid tiles if they exist.
         */
        public extractTileSet(bounds: HitboxBounds): GridTileSet {
            if (!bounds) { return new GridTileSet(null, null, null, null); }
            const top = Math.floor(bounds.top / GRID_DIM);
            const left = Math.floor(bounds.left / GRID_DIM);
            const bottom = Math.floor(bounds.bottom / GRID_DIM);
            const right = Math.floor(bounds.right / GRID_DIM);
            const topLeftTile = this.getTile(top, left);
            const topRightTile = this.getTile(top, right);
            const bottomLeftTile = this.getTile(bottom, left);
            const bottomRightTile = this.getTile(bottom, right);
            return new GridTileSet(topLeftTile, topRightTile, bottomLeftTile, bottomRightTile);
        }

        /**
         * From the hitbox, return a set of grid tiles, creating them if necessary.
         */
        private ensureTileSet(bounds: HitboxBounds): GridTileSet {
            const top = Math.floor(bounds.top / GRID_DIM);
            const left = Math.floor(bounds.left / GRID_DIM);
            const bottom = Math.floor(bounds.bottom / GRID_DIM);
            const right = Math.floor(bounds.right / GRID_DIM);
            const topLeftTile = this.ensureTile(top, left);
            const topRightTile = this.ensureTile(top, right);
            const bottomLeftTile = this.ensureTile(bottom, left);
            const bottomRightTile = this.ensureTile(bottom, right);
            return new GridTileSet(topLeftTile, topRightTile, bottomLeftTile, bottomRightTile);
        }

        private getTile(rowIndex: number, colIndex: number): GridTile {
            const row = this.tiles[rowIndex];
            const tile = row ? row[colIndex] : undefined;
            return tile;
        }

        private ensureTile(rowIndex: number, colIndex: number): GridTile {
            let row = this.tiles[rowIndex];
            if (!row) {
                row = this.tiles[rowIndex] = [];
            }
            let tile = row[colIndex];
            if (!tile) {
                tile = row[colIndex] = new GridTile(rowIndex, colIndex);
            }
            return tile;
        }

        private toGridCoords(bounds: HitboxBounds): HitboxBounds {
            return new HitboxBounds(
                Math.floor(bounds.left / GRID_DIM),
                Math.floor(bounds.right / GRID_DIM),
                Math.floor(bounds.top / GRID_DIM),
                Math.floor(bounds.bottom / GRID_DIM));
        }

        private refresh(kelpie: Kelpie) {
            const oldBounds = kelpie.data[GRID_BOUNDS] as HitboxBounds;
            const oldTileSet = this.extractTileSet(oldBounds);
            const newBounds = HitboxBounds.FromKelpie(kelpie);
            const newTileSet = this.ensureTileSet(newBounds);
            if (oldTileSet.topLeft) { oldTileSet.topLeft.remove(kelpie); }
            if (oldTileSet.topRight) { oldTileSet.topRight.remove(kelpie); }
            if (oldTileSet.bottomLeft) { oldTileSet.bottomLeft.remove(kelpie); }
            if (oldTileSet.bottomRight) { oldTileSet.bottomRight.remove(kelpie); }
            newTileSet.topLeft.add(kelpie);
            newTileSet.topRight.add(kelpie);
            newTileSet.bottomLeft.add(kelpie);
            newTileSet.bottomRight.add(kelpie);
            kelpie.data[GRID_BOUNDS] = newBounds;
        }

        private handleKelpieMoved(kelpie: Kelpie) {
            this.refresh(kelpie);
        }

        private handleKelpieDestroy(kelpie: Kelpie) {
            this.remove(kelpie);
        }
    }
}