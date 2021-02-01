namespace kodu {
    export const TWO_PI = 2 * Math.PI;

    export enum CardinalDirection {
        North = 1 << 0, // screen up
        South = 1 << 1, // screen down
        East = 1 << 2,  // screen right
        West = 1 << 3,  // screen left
        NorthWest = North | West,
        NorthEast = North | East,
        SouthWest = South | West,
        SouthEast = South | East,
        All = North | South | East | West
    }

    export class Hitbox {
        constructor(
            public width: number,
            public height: number,
            public minX: number,
            public minY: number) {}
    }

    export class HitboxBounds {
        //% blockCombine block="x" callInDebugger
        get width(): number { return this.right - this.left; }
        //% blockCombine block="x" callInDebugger
        get height(): number { return this.bottom - this.top; }
        //% blockCombine block="x" callInDebugger
        get center(): Vec2 { return mkVec2((this.left + this.right) >> 1, (this.top + this.bottom) >> 1); }

        constructor(
            public left: number,
            public right: number,
            public top: number,
            public bottom: number) { }

        public dup(): HitboxBounds {
            return new HitboxBounds(this.left, this.right, this.top, this.bottom);
        }

        public expand(dir: CardinalDirection) {
            if (dir & CardinalDirection.North) { this.top -= 1; }
            if (dir & CardinalDirection.South) { this.bottom += 1; }
            if (dir & CardinalDirection.East ) { this.right += 1; }
            if (dir & CardinalDirection.West ) { this.left -= 1; }
        }

        public occupy(dir: CardinalDirection) {
            const width = this.width;
            const height = this.height;
            if ((dir & CardinalDirection.North) && !(dir & CardinalDirection.South)) { this.bottom += Math.floor(height >> 1); }
            if ((dir & CardinalDirection.South) && !(dir & CardinalDirection.North)) { this.top -= Math.floor(height >> 1); }
            if ((dir & CardinalDirection.East ) && !(dir & CardinalDirection.West )) { this.left += Math.floor(width >> 1); }
            if ((dir & CardinalDirection.West ) && !(dir & CardinalDirection.East )) { this.right -= Math.floor(width >> 1); }
        }

        public static FromKelpie(s: Kelpie): HitboxBounds {
            const box = s.hitbox;
            const left = Math.floor(s.x + box.minX);
            const top = Math.floor(s.y + box.minY);
            const right = Math.floor(left + box.width);
            const bottom = Math.floor(top + box.height);
            return new HitboxBounds(left, right, top, bottom);
        }

        public static Intersects(a: HitboxBounds, b: HitboxBounds): boolean {
            if (util.pointInHitboxBounds(a.left, a.top, b)) { return true; }
            if (util.pointInHitboxBounds(a.right, a.top, b)) { return true; }
            if (util.pointInHitboxBounds(a.left, a.bottom, b)) { return true; }
            if (util.pointInHitboxBounds(a.right, a.bottom, b)) { return true; }
            if (util.pointInHitboxBounds(b.left, b.top, a)) { return true; }
            if (util.pointInHitboxBounds(b.right, b.top, a)) { return true; }
            if (util.pointInHitboxBounds(b.left, b.bottom, a)) { return true; }
            if (util.pointInHitboxBounds(b.right, b.bottom, a)) { return true; }
            return false;
        }
    }

    export class util {
        public static pointInHitboxBounds(x: number, y: number, bounds: HitboxBounds): boolean {
            return (x >= bounds.left) && (x <= bounds.right) && (y >= bounds.top) && (y <= bounds.bottom);
        }

        public static pointInSprite(kel: Kelpie, x: number, y: number): boolean {
            const wOver2 = kel.width / 2;
            const hOver2 = kel.height / 2;
            return (x >= kel.x - wOver2) && (x <= kel.x + wOver2) && (y >= kel.y - hOver2) && (y <= kel.y + hOver2);
        }

        public static hitboxBoundsOverlap(a: HitboxBounds, b: HitboxBounds): boolean {
            const dimA = Math.max(a.width, a.height);
            const dimB = Math.max(b.width, b.height);
            const maxSq = dimA * dimA + dimB * dimB;
            const distSq = Vec2.MagnitudeSq(Vec2.Sub(a.center, b.center));
            // Are they safely too far apart?
            if (distSq > maxSq) { return false; }
            return HitboxBounds.Intersects(a, b);
        }

        public static centerSpriteOnSprite(src: Kelpie, dst: Kelpie) {
            src.x = dst.x;
            src.y = dst.y;
        }

        public static calculateHitbox(s: Kelpie): Hitbox {
            const i = s.image;
            let minX = i.width;
            let minY = i.height;
            let maxX = 0;
            let maxY = 0;

            for (let col = 0; col < i.width; ++col) {
                for (let row = 0; row < i.height; ++row) {
                    if (i.getPixel(col, row)) {
                        minX = Math.min(minX, col);
                        minY = Math.min(minY, row);
                        maxX = Math.max(maxX, col);
                        maxY = Math.max(maxY, row);
                    }
                }
            }

            const width = maxX - minX + 1;
            const height = maxY - minY + 1;
            minX -= i.width >> 1;
            minY -= i.height >> 1;

            return new Hitbox(width, height, minX, minY);
        }

        public static distSqBetweenSprites(a: Kelpie, b: Kelpie): number {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            return (dx * dx) + (dy * dy);
        }

        public static distBetweenSprites(a: Kelpie, b: Kelpie): number {
            return Math.sqrt(util.distSqBetweenSprites(a, b));
        }

        public static rotationFromDirection(dx: number, dy: number): number {
            // Assumes dx/dy is normalized.
            let angle = Math.acos(dx);
            if (dy < 0) {
                angle = TWO_PI - angle;
            }
            return angle;
        }
    }
}