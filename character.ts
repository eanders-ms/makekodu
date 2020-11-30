namespace kodu {
    export type CharacterState = {
        x: number;
        y: number;
        id: string;
        bdefn: string;
    };

    interface Impulse {
        direction: Vec2;
        magnitude: number;
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

        public queueImpulse(direction: Vec2, magnitude: number) {
            this.impulseQueue.push({
                direction,
                magnitude
            });
        }

        private handleCollision(other: Sprite) {

        }

        getGameMode(): GameMode { return this.stage.get<GameMode>("gameMode"); }
        getPhysics(): Physics { return this.stage.get<Physics>("physics"); }

        update() {
        }

        think() {
            if (!this.destroyed && this.brain) {
                this.impulseQueue = [];
                this.brain.execute();
                this.applyImpluses();
            }
        }

        applyImpluses() {
            let finalDir = mkVec2();
            let finalMag = 0;
            const impulseCount = this.impulseQueue.length;
            if (!impulseCount) { return; }
            for (const impulse of this.impulseQueue) {
                const direction: Vec2 = impulse.direction;
                const magnitude = impulse.magnitude;
                finalDir = Vec2.Add(finalDir, direction);
                finalMag += magnitude;
            }
            finalMag /= impulseCount;
            finalDir = Vec2.Scale(finalDir, finalMag / impulseCount);
            this.body.vx += finalDir.x;
            this.body.vy += finalDir.y;
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
