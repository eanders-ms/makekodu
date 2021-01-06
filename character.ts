namespace kodu {
    export type CharacterState = {
        x: number;
        y: number;
        id: string;
        bdefn: string;
    };

    export enum ImpulseType {
        Exclusive,      // Doesn't blend with any other movement.
        Ambient,        // Can be blended with other movement.
        Default         // Default movement if no other impulses present.
    }

    interface Impulse {
        type: ImpulseType;
        direction: Vec2;
        magnitude: number;
    }

    export class Character extends ActorComponent {
        sprite: Sprite;
        body: Body;
        bdefn: BrainDefn;
        brain: Brain;
        destroyed: boolean;
        impulseQueue: Impulse[];
        bumps: Character[];

        public get x() { return this.sprite.x; }
        public set x(v: number) { this.sprite.x = v; }
        public get y() { return this.sprite.y; }
        public set y(v: number) { this.sprite.y = v; }
        public get pos(): Vec2 { return mkVec2(this.x, this.y); }
        public set pos(v: Vec2) { this.x = v.x; this.y = v.y; }
        
        constructor(stage: Stage, x: number, y: number, public defn: CharacterDefn, bdefn: BrainDefn) {
            super(stage, "character");
            let icon = icons.get(defn.id);
            this.sprite = sprites.create(icon, 0);
            this.sprite.setFlag(SpriteFlag.Ghost, true);
            this.sprite.x = x;
            this.sprite.y = y;
            this.sprite.z = 0;
            this.sprite.data["kind"] = "character";
            this.sprite.data["component"] = this;
            this.bdefn = bdefn.clone();
            this.destroyed = false;
            this.impulseQueue = [];
            this.bumps = [];

            const physics = this.stage.get<Physics>("physics");
            if (physics) {
                this.body = new Body(this.sprite);
                this.body.mass = this.defn.defaults.mass;
                this.body.friction = this.defn.defaults.friction;
                this.body.restitution = this.defn.defaults.restitution;
                this.body.bumpCanMove = this.defn.defaults.bumpCanMove;
                physics.addBody(this.body);
            }
        }

        public destroy() {
            this.destroyed = true;
            if (this.brain) {
                this.brain.done = true;
            }
            this.stage.notify("character:destroying", this);
            const physics = this.getPhysics();
            if (physics) {
                physics.removeBody(this.body);
                this.body = null;
            }
            this.sprite.destroy();
            this.sprite = null;
            this.stage.remove(this);
        }

        public showFeeling(feeling: Feeling) {
            effects.clearParticles(this.sprite);
            const effect = getEffect(feeling);
            if (effect) {
                this.sprite.startEffect(effect);
            }
        }

        public moveBy(x: number, y: number) {
            this.x += x;
            this.y += y;
        }

        public queueImpulse(direction: Vec2, magnitude: number, type: ImpulseType) {
            this.impulseQueue.push({
                direction,
                magnitude,
                type
            });
        }

        public addBump(char: Character) {
            this.bumps.push(char);
        }

        public nextDirection(): Vec2 | null {
            const v = this.computeImpulses();
            if (!v) { return null; }
            return Vec2.Normal(v);
        }

        getGameMode(): GameMode { return this.stage.get<GameMode>("gameMode"); }
        getPhysics(): Physics { return this.stage.get<Physics>("physics"); }

        update() {
        }

        think() {
            if (!this.destroyed && this.brain) {
                this.brain.execute();
            }
            if (!this.destroyed) {
                this.applyImpulses();
                this.bumps = [];
            }
        }

        computeImpulses(): Vec2 {
            if (!this.impulseQueue.length) { return null; }
            let finalDir = mkVec2();
            const exclusiveOnly = this.impulseQueue.some(elem => elem.type === ImpulseType.Exclusive);
            const allowDefault = this.impulseQueue.length === 1;
            let impulseCount = 0;
            for (const impulse of this.impulseQueue) {
                if (exclusiveOnly && impulse.type !== ImpulseType.Exclusive) { continue; }
                if (!allowDefault && impulse.type === ImpulseType.Default) { continue; }
                const direction = impulse.direction;
                const magnitude = impulse.magnitude;
                finalDir = Vec2.Add(finalDir, Vec2.Scale(direction, magnitude));
                impulseCount += 1;
                if (exclusiveOnly) { break; }
            }
            if (impulseCount) {
                return Vec2.Scale(finalDir, 1 / impulseCount);
            }
            return null;
        }

        applyImpulses() {
            const v = this.computeImpulses();
            if (v) {
                this.body.vx += v.x;
                this.body.vy += v.y;
            }
            this.impulseQueue = [];
        }

        notify(event: string, parm: any) {
            if (event === "save") {
                const savedGame = parm as SavedGame;
                const state: CharacterState = {
                    x: this.x,
                    y: this.y,
                    id: this.defn.id,
                    bdefn: this.bdefn.toObj()
                };
                savedGame.chars.push(state);
            } else if (event === "gameModeChanged") {
                if (parm === GameMode.Edit) {
                    if (this.brain) {
                        this.brain.destroy();
                        this.brain = undefined;
                    }
                } else if (parm === GameMode.Play) {
                    this.brain = new Brain(this);
                }
            }
        }
    }
}
