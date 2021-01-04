namespace util {
    export const TWO_PI = 2 * Math.PI;

    export function pointInSprite(spr: Sprite, x: number, y: number) {
        const wOver2 = spr.width / 2;
        const hOver2 = spr.height / 2;
        return (x >= spr.x - wOver2) && (x <= spr.x + wOver2) && (y >= spr.y - hOver2) && (y <= spr.y + hOver2);
    }
    export function getAllOverlapping(src: Sprite): Sprite[] {
        const scene = game.currentScene();
        return (game.currentScene().allSprites)
            .filter(value => (value as any)["_kind"] !== undefined) // hack: filter to Sprite type
            .map(value => value as Sprite)
            .filter(value => value && value !== src)
            .filter(value => !(value.flags & SpriteFlag.Invisible))
            .filter(value => value.overlapsWith(src))
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