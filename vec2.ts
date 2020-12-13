namespace kodu {
    export class Vec2 {
        constructor(public x: number, public y: number) { }

        public static Add(a: Vec2, b: Vec2): Vec2 {
            return new Vec2(
                a.x + b.x,
                a.y + b.y
            );
        }

        public static Sub(a: Vec2, b: Vec2): Vec2 {
            return new Vec2(
                a.x - b.x,
                a.y - b.y
            );
        }

        public static Normal(v: Vec2, mag?: number): Vec2 {
            if (!mag) {
                const magSq = (v.x * v.x + v.y * v.y);
                if (magSq === 1) { return v; }
                mag = Math.sqrt(magSq);
            }
            return new Vec2(
                v.x / mag,
                v.y / mag
            );
        }

        public static Scale(v: Vec2, scalar: number): Vec2 {
            return new Vec2(
                v.x * scalar,
                v.y * scalar
            );
        }

        public static Magnitude(v: Vec2): number {
            const magSq = (v.x * v.x + v.y * v.y);
            return Math.sqrt(magSq);
        }

        public static MagnitudeSq(v: Vec2): number {
            return (v.x * v.x + v.y * v.y);
        }

        public static Dot(a: Vec2, b: Vec2): number {
            return a.x * b.x + a.y * b.y;
        }
    }

    export function mkVec2(x = 0, y = 0): Vec2 {
        return new Vec2(x, y);
    }

}
