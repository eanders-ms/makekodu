namespace util {
    export const TWO_PI = 2 * Math.PI;

    export function pointInHitboxBounds(x: number, y: number, bounds: HitboxBounds): boolean {
        return (x >= bounds.left) && (x <= bounds.right) && (y >= bounds.top) && (y <= bounds.bottom);
    }

    export function pointInSprite(spr: Sprite, x: number, y: number): boolean {
        const wOver2 = spr.width / 2;
        const hOver2 = spr.height / 2;
        return (x >= spr.x - wOver2) && (x <= spr.x + wOver2) && (y >= spr.y - hOver2) && (y <= spr.y + hOver2);
    }

    export function hitboxBoundsOverlap(a: HitboxBounds, b: HitboxBounds): boolean {
        const dimA = Math.max(a.width, a.height);
        const dimB = Math.max(b.width, b.height);
        const maxSq = dimA * dimA + dimB * dimB;
        const distSq = kodu.Vec2.MagnitudeSq(kodu.Vec2.Sub(a.center, b.center));
        // Are they safely too far apart?
        if (distSq > maxSq) { return false; }
        return HitboxBounds.Intersects(a, b);
    }

    export function getAllOverlapping(src: Sprite): Sprite[] {
        const srcHitbox = src.data["_hitbox"] || (src.data["_hitbox"] = calculateHitbox(src));
        const srcHitboxBounds = new HitboxBounds(src);
        const scene = game.currentScene();
        return (game.currentScene().allSprites)
            .filter(value => (value as any)["_kind"] !== undefined) // hack: filter to Sprite type
            .map(value => value as Sprite)
            .filter(value => value && value !== src)
            .filter(value => !(value.flags & SpriteFlag.Invisible))
            .filter(value => {
                const valHitboxBounds = new HitboxBounds(value);
                return hitboxBoundsOverlap(valHitboxBounds, srcHitboxBounds);
            })
            .sort((a, b) => (a.x - b.x) + (a.y - b.y));
    }

    export function centerSpriteOnSprite(src: Sprite, dst: Sprite) {
        src.x = dst.x;
        src.y = dst.y;
    }

    export class Hitbox {
        constructor(
            public width: number,
            public height: number,
            public minX: number,
            public minY: number) {}
    }

    export class HitboxBounds {
        top: number;
        left: number;
        right: number;
        bottom: number;

        get width(): number { return this.right - this.left; }
        get height(): number { return this.bottom - this.top; }
        get center(): kodu.Vec2 { return kodu.mkVec2((this.left + this.right) >> 1, (this.top + this.bottom) >> 1); }
        
        constructor(s: Sprite) {
            const box = s.data["_hitbox"] || (s.data["_hitbox"] = calculateHitbox(s));
            this.left = s.x + box.minX;
            this.top = s.y + box.minY;
            this.right = this.left + box.width;
            this.bottom = this.top + box.height;
        }

        public static Intersects(a: HitboxBounds, b: HitboxBounds): boolean {
            if (pointInHitboxBounds(a.left, a.top, b)) { return true; }
            if (pointInHitboxBounds(a.right, a.top, b)) { return true; }
            if (pointInHitboxBounds(a.left, a.bottom, b)) { return true; }
            if (pointInHitboxBounds(a.right, a.bottom, b)) { return true; }
            if (pointInHitboxBounds(b.left, b.top, a)) { return true; }
            if (pointInHitboxBounds(b.right, b.top, a)) { return true; }
            if (pointInHitboxBounds(b.left, b.bottom, a)) { return true; }
            if (pointInHitboxBounds(b.right, b.bottom, a)) { return true; }
            return false;
        }
    }

    export function calculateHitbox(s: Sprite): Hitbox {
        const i = s.image;
        let minX = i.width;
        let minY = i.height;
        let maxX = 0;
        let maxY = 0;

        for (let c = 0; c < i.width; c++) {
            for (let r = 0; r < i.height; r++) {
                if (i.getPixel(c, r)) {
                    minX = Math.min(minX, c);
                    minY = Math.min(minY, r);
                    maxX = Math.max(maxX, c);
                    maxY = Math.max(maxY, r);
                }
            }
        }

        const width = maxX - minX + 1;
        const height = maxY - minY + 1;

        return new Hitbox(width, height, minX, minY);
    }

    export function distSqBetweenSprites(a: Sprite, b: Sprite): number {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return (dx * dx) + (dy * dy);
    }

    export function distBetweenSprites(a: Sprite, b: Sprite): number {
        return Math.sqrt(distSqBetweenSprites(a, b));
    }

    export function rotationFromDirection(dx: number, dy: number): number {
        // Assumes dx/dy is normalized.
        let angle = Math.acos(dx);
        if (dy < 0) {
            angle = TWO_PI - angle;
        }
        return angle;
    }
}