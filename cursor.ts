namespace kodu {
    export type CursorMode = "free" | "burdened";

    export class Cursor extends Component {
        cursorMode: CursorMode;
        sprite0: Sprite;
        sprite1: Sprite;
        disabled: boolean;

        public get x() { return this.sprite0.x; }
        public get y() { return this.sprite0.y; }
        public set x(v: number) {
            this.sprite0.x = v;
            this.sprite1.x = v;
        }
        public set y(v: number) {
            this.sprite0.y = v;
            this.sprite1.y = v;
        }

        constructor(stage: Stage) {
            super(stage, "cursor");
            this.sprite0 = sprites.create(icons.get("cursor"), 0);
            this.sprite0.setFlag(SpriteFlag.Ghost, true);
            this.sprite1 = sprites.create(icons.get("carry"), 0);
            this.sprite1.setFlag(SpriteFlag.Ghost, true);
            this.sprite0.setFlag(SpriteFlag.Invisible, true);
            this.sprite1.setFlag(SpriteFlag.Invisible, true);
            this.sprite0.z = 1000;
            this.sprite1.z = 1000;
            this.sprite0.data["kind"] = "cursor";
            this.sprite0.data["component"] = this;
            this.setCursorMode("free");
        }

        public setCursorMode(mode: CursorMode) {
            this.cursorMode = mode;
            this.sprite0.setFlag(SpriteFlag.Invisible, mode !== "free");
            this.sprite1.setFlag(SpriteFlag.Invisible, mode !== "burdened");
        }

        public moveTo(x: number, y: number) {
            if (this.disabled) { return; }
            this.x = x;
            this.y = y;
        }

        public disable() {
            this.disabled = true;
            this.sprite0.setFlag(SpriteFlag.Invisible, true);
            this.sprite1.setFlag(SpriteFlag.Invisible, true);
        }

        public enable() {
            this.disabled = false;
            this.setCursorMode(this.cursorMode);
        }

        getAllOverlapping() {
            return util.getAllOverlapping(this.sprite0)
                .filter(spr => util.pointInSprite(spr, this.x, this.y))
                .sort((a, b) => b.z - a.z);
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

        update() {
            if (this.disabled) { return; }
            let moved = false;
            const cursorSpeed = this.stage.app.cursorSpeed;
            if (controller.up.isPressed()) {
                this.y -= cursorSpeed;
                moved = true;
            }
            if (controller.down.isPressed()) {
                this.y += cursorSpeed;
                moved = true;
            }
            if (controller.left.isPressed()) {
                this.x -= cursorSpeed;
                moved = true;
            }
            if (controller.right.isPressed()) {
                this.x += cursorSpeed;
                moved = true;
            }
            if (moved) {
                this.stage.notify("cursor:moved", { x: this.x, y: this.y });
            }
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
                this.setCursorMode(this.cursorMode);
            }
        }
    }
}
