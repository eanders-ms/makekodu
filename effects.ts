namespace kodu {
    class ShapeFactory extends particles.AreaFactory {
        protected sources: Image[];
        protected ox: Fx8;
        protected oy: Fx8;

        constructor(xRange: number, yRange: number, source: Image) {
            super(xRange, yRange);
            this.sources = [source];

            // Base offsets off of initial shape
            this.ox = Fx8(source.width >> 1);
            this.oy = Fx8(source.height >> 1);
        }

        /**
         * Add another possible shape for a particle to display as
         * @param shape 
         */
        addShape(shape: Image) {
            if (shape) this.sources.push(shape);
        }

        drawParticle(p: particles.Particle, x: Fx8, y: Fx8) {
            const pImage = this.galois.pickRandom(this.sources).clone();

            screen.drawTransparentImage(pImage,
                //Fx.toInt(x), Fx.toInt(y)
                Fx.toInt(Fx.add(x, this.ox)),
                Fx.toInt(Fx.add(y, this.oy))
            );
        }

        createParticle(anchor: particles.ParticleAnchor) {
            const p = super.createParticle(anchor);
            p._x = Fx8(anchor.x);
            p._y = Fx8(anchor.y - anchor.height);
            p.vy = Fx.neg(Fx.abs(p.vy));
            return p;
        }
    }

    const emojis: {[id: number]: effects.ScreenEffect } = { };
    export function getEffect(feeling: Feeling): effects.ScreenEffect {
        // TODO: Return null effect if missing.
        // TODO: Merge emojis and other effects into one list.
        return emojis[feeling];
    }
    export function initEffects() {
        emojis[Feeling.Happy] = new effects.ScreenEffect(5, 25, 1500, function (anchor: particles.ParticleAnchor, particlesPerSecond: number) {
            const factory = new ShapeFactory(anchor.width ? anchor.width : 16, 16, img`
                . . f f f f f . .
                . f 9 9 9 9 9 f .
                f 6 1 1 9 1 1 9 f
                f 6 1 f 9 f 1 9 f
                f 6 9 9 9 9 9 9 f
                f 6 f 9 9 9 f 9 f
                f 6 6 f f f 9 9 f
                . f 6 6 6 9 9 f .
                . . f f f f f . .
            `);
            // if large anchor, increase lifespan
            if (factory.xRange > 50) {
                factory.minLifespan = 1250;
                factory.maxLifespan = 2500;
            }

            factory.setSpeed(20);
            factory.setDirection(270, 45);
            return new particles.ParticleSource(anchor, particlesPerSecond, factory);
        });

        emojis[Feeling.Angry] = new effects.ScreenEffect(5, 25, 1500, function (anchor: particles.ParticleAnchor, particlesPerSecond: number) {
            const factory = new ShapeFactory(anchor.width ? anchor.width : 16, 16, img`
                . . f f f f f . .
                . f 4 4 4 4 4 f .
                f 2 1 4 4 4 1 4 f
                f 2 1 f 4 f 1 4 f
                f 2 4 4 4 4 4 4 f
                f 2 4 4 4 4 4 4 f
                f 2 f f f f f 4 f
                . f 2 2 2 4 4 f .
                . . f f f f f . .
            `);
            // if large anchor, increase lifespan
            if (factory.xRange > 50) {
                factory.minLifespan = 1250;
                factory.maxLifespan = 2500;
            }

            factory.setSpeed(20);
            factory.setDirection(270, 45);
            return new particles.ParticleSource(anchor, particlesPerSecond, factory);
        });

        emojis[Feeling.Heart] = new effects.ScreenEffect(5, 25, 1500, function (anchor: particles.ParticleAnchor, particlesPerSecond: number) {
            const factory = new ShapeFactory(anchor.width ? anchor.width : 16, 16, img`
                . . f f . f f . .
                . f 4 4 f 4 4 f .
                f 2 2 2 4 2 2 4 f
                f 2 2 2 2 2 2 4 f
                f 2 2 2 2 2 2 4 f
                . f 2 2 2 2 4 f .
                . . f 2 2 2 f . .
                . . . f 2 f . . .
                . . . . f . . . .
            `);
            // if large anchor, increase lifespan
            if (factory.xRange > 50) {
                factory.minLifespan = 1250;
                factory.maxLifespan = 2500;
            }

            factory.setSpeed(20);
            factory.setDirection(270, 45);
            return new particles.ParticleSource(anchor, particlesPerSecond, factory);
        });

        emojis[Feeling.Sad] = new effects.ScreenEffect(5, 25, 1500, function (anchor: particles.ParticleAnchor, particlesPerSecond: number) {
            const factory = new ShapeFactory(anchor.width ? anchor.width : 16, 16, img`
                . . f f f f f . .
                . f b b b b b f .
                f c 1 1 b 1 1 b f
                f c 1 f b f 1 b f
                f c 9 9 b 9 9 b f
                f c b b b b b b f
                f c c f f f b b f
                . f c c c b b f .
                . . f f f f f . .
            `);
            // if large anchor, increase lifespan
            if (factory.xRange > 50) {
                factory.minLifespan = 1250;
                factory.maxLifespan = 2500;
            }

            factory.setSpeed(20);
            factory.setDirection(270, 45);
            return new particles.ParticleSource(anchor, particlesPerSecond, factory);
        });

    }
}
