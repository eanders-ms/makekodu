namespace kodu {
    export type CharacterState = {
        x: number;
        y: number;
        id: string;
        bdefn: string;
    };

    export type ImpulseType
        = "exclusive"   // Doesn't blend with any other movement.
        | "ambient"     // Can be blended with other movement.
        | "default"     // Default movement if no other impulses present.
        ;

    interface Impulse {
        direction: Vec2;
        magnitude: number;
        type: ImpulseType;
    }

    export class Character extends Component {
        sprite: Sprite;
        body: Body;
        bdefn: BrainDefn;
        brain: Brain;
        destroyed: boolean;
        impulseQueue: Impulse[];

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
            this.sprite.x = x;
            this.sprite.y = y;
            this.sprite.z = 0;
            this.sprite.data["kind"] = "character";
            this.sprite.data["component"] = this;
            this.bdefn = bdefn.clone();
            this.destroyed = false;
            this.impulseQueue = [];

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

        public nextDirection(): Vec2 | null {
            const v = this.computeImpulses();
            if (!v) { return null; }
            return Vec2.Normal(v);
        }

        private handleCollision(other: Sprite) {

        }

        getGameMode(): GameMode { return this.stage.get<GameMode>("gameMode"); }
        getPhysics(): Physics { return this.stage.get<Physics>("physics"); }

        update() {
        }

        think() {
            if (!this.destroyed && this.brain) {
                this.brain.execute();
                this.applyImpulses();
            }
        }

        computeImpulses(): Vec2 | null {
            if (!this.impulseQueue.length) { return null; }
            let finalDir = mkVec2();
            const exclusiveOnly = this.impulseQueue.some(elem => elem.type === "exclusive");
            const allowDefault = this.impulseQueue.length === 1;
            let impulseCount = 0;
            for (const impulse of this.impulseQueue) {
                if (exclusiveOnly && impulse.type !== "exclusive") { continue; }
                if (!allowDefault && impulse.type === "default") { continue; }
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

        sleep() {
            const visible = !(this.sprite.flags & SpriteFlag.Invisible);
            this.sprite.data["sleep:was_visible"] = visible;
            this.sprite.setFlag(SpriteFlag.Invisible, true);
            super.sleep();
        }

        wake() {
            this.sprite.setFlag(SpriteFlag.Invisible, !this.sprite.data["sleep:was_visible"]);
            super.wake();
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
                if (parm === "edit") {
                    this.brain = null;
                } else if (parm === "play") {
                    this.brain = new Brain(this);
                }
            }
        }
    }
}
