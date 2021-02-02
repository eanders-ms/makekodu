namespace kodu {
    export type VisualState = "free" | "burdened";

    export class Cursor extends Component {
        kel: Kelpie;
        disabled: boolean;
        visualState: VisualState;

        public get x() { return this.kel.x; }
        public get y() { return this.kel.y; }
        public set x(v: number) { this.kel.x = v; }
        public set y(v: number) { this.kel.y = v; }
        public get pos(): Vec2 { return this.kel.pos; }

        constructor(stage: Stage, private baseCursor: string) {
            super(stage, "cursor");
            this.kel = new Kelpie(icons.get(`cursor_free_${baseCursor}`));
            this.kel.z = 1000;
            this.kel.data["kind"] = "cursor";
            this.kel.data["component"] = this;
            this.setVisualState("free");
        }

        public moveTo(x: number, y: number) {
            if (this.disabled) { return; }
            this.x = x;
            this.y = y;
        }

        public disable() {
            this.disabled = true;
            this.kel.invisible = true;
        }

        public enable() {
            this.disabled = false;
            this.kel.invisible = false;
            this.setVisualState(this.visualState);
        }

        public setVisualState(state: VisualState) {
            this.visualState = state;
            this.kel.image = icons.get(`cursor_${state}_${this.baseCursor}`);
        }

        getAllOverlapping(): Kelpie[] {
            return this.stage.radar.getOverlapping(this.kel);
        }

        handleAPressed() {
            if (this.disabled) { return; }
            const overlaps = this.getAllOverlapping();
            if (!overlaps.length) {
                // Click the canvas.
                this.stage.notify("cursor:canvasClick", { x: this.x, y: this.y });
                return;
            }
            {   // Click a button?
                const buttons = (overlaps
                    .filter(value => value.data["kind"] === "button")
                    .map(value => value.data["component"]) as Button[])
                    .filter(value => value.clickable());
                const button = buttons.shift();
                if (button) {
                    this.stage.notify("cursor:buttonClick", { button, x: this.x, y: this.y });
                    return;
                }
            }
            {
                // Click a character?
                const chars = overlaps
                    .filter(value => value.data["kind"] === "character")
                    .map(value => value.data["component"]) as Character[];
                const char = chars.shift();
                if (char) {
                    this.stage.notify("cursor:characterClick", { char, x: this.x, y: this.y });
                    return;
                }
            }
        }

        handleBPressed() {
            if (this.disabled) { return; }
            this.stage.notify("cursor:cancel", { x: this.x, y: this.y });
        }

        notify(event: string, parm: any) {
            if (event === "save") {
                const savedGame = parm as SavedGame;
                savedGame.cursor = { x: this.x, y: this.y };
            } else if (event === "load") {
                const savedGame = parm as SavedGame;
                if (savedGame.cursor) {
                    this.x = savedGame.cursor.x;
                    this.y = savedGame.cursor.y;
                }
                this.disabled = false;
                this.setVisualState(this.visualState);
            }
        }
    }

    const maxCursorSpeed = 140 / 1000;      // pixels/milli
    const startCursorSpeed = 40 / 1000;     //
    const cursorSpeedInc = 20 / 1000;       // 
    const shiftGearsAt = 50;                // millis

    export class WorldCursor extends Cursor {
        moveStartMs: number;    // millis at move start
        cursorSpeed: number;    // pixels/milli

        constructor(stage: Stage, baseCursor: string) {
            super(stage, baseCursor);
            this.moveStartMs = 0;
            this.cursorSpeed = 0;
        }

        update(dt: number) {
            if (this.disabled) { return; }
            let x = (controller.right.isPressed() ? 1 : 0) - (controller.left.isPressed() ? 1 : 0);
            let y = (controller.down.isPressed() ? 1 : 0) - (controller.up.isPressed() ? 1 : 0);
            if (x || y) {
                const t = control.millis();
                if (t > this.moveStartMs + shiftGearsAt) {
                    this.moveStartMs = t;
                    this.cursorSpeed += cursorSpeedInc;
                    this.cursorSpeed = Math.min(this.cursorSpeed, maxCursorSpeed);
                }
                this.x += x * this.cursorSpeed * dt;
                this.y += y * this.cursorSpeed * dt;
                this.stage.notify("cursor:moved", { x: this.x, y: this.y });
            } else {
                this.moveStartMs = control.millis();
                this.cursorSpeed = startCursorSpeed;
            }
        }
    }

    export class StickyCursor extends Cursor {
        pressed: boolean;
        nextMs: number;

        constructor(stage: Stage, baseCursor: string) {
            super(stage, baseCursor);
        }

        update(dt: number) {
            if (this.disabled) { return; }
            const wasPressed = this.pressed;
            let x = (controller.right.isPressed() ? 1 : 0) - (controller.left.isPressed() ? 1 : 0);
            let y = (controller.down.isPressed() ? 1 : 0) - (controller.up.isPressed() ? 1 : 0);
            let dir: CardinalDirection = 0;
            if (x > 0) dir |= CardinalDirection.East;
            if (x < 0) dir |= CardinalDirection.West;
            if (y > 0) dir |= CardinalDirection.South;
            if (y < 0) dir |= CardinalDirection.North;
            this.pressed = !!dir;
            if (!this.pressed) { return; }
            // TODO make a debouncer for this
            const t = control.millis();
            let exec = false;
            if (!wasPressed) {
                this.nextMs = t + INPUT_INITIAL_DELAY;
                exec = true;
            } else if (t >= this.nextMs) {
                this.nextMs = t + INPUT_REPEAT_DELAY;
                exec = true;
            }
            if (exec) {
                const kel = this.stage.radar.getNearestInDirection(this.kel, dir, 0, 200);
                if (kel) {
                    this.x = kel.x;
                    this.y = kel.y;
                } else {
                    this.pressed = false;
                }
            }
        }
    }
}
