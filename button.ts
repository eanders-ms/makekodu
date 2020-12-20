namespace kodu {
    export class Button extends Component {
        icon: Sprite;
        background: Sprite;
        text: TextSprite;
        data: any;

        get id() { return this.iconId; }

        get width() { return Math.max(this.icon.width, this.background ? this.background.width : 0); }
        get height() { return Math.max(this.icon.height, this.background ? this.background.height : 0); }
        get z() { return this.icon.z; }
        set z(n: number) {
            this.icon.z = n;
            if (this.background) {
                this.background.z = n - 1;
            }
            if (this.text) {
                this.text.z = n;
            }
        }

        constructor(
            stage: Stage,
            style: ButtonStyle,
            private iconId: string,
            private label:
            string,
            public x: number,
            public y: number,
            private hud: boolean,
            private onClick?: (button: Button) => void
        ) {
            super(stage, "button");
            this.data = {};
            this.icon = sprites.create(icons.get(iconId), 0);
            this.icon.x = x;
            this.icon.y = y;
            this.icon.z = 900;
            this.icon.data["kind"] = "button";
            this.icon.data["component"] = this;
            if (style) {
                this.background = sprites.create(icons.get(`button_${style}`), 0);
                this.background.x = x;
                this.background.y = y;
                this.background.z = this.icon.z - 1;
                this.background.data["kind"] = "button";
                this.background.data["component"] = this;
            }
        }

        destroy() {
            if (this.icon) { this.icon.destroy(); }
            if (this.background) { this.background.destroy(); }
            if (this.text) { this.text.destroy(); }
            this.icon = null;
            this.background = null;
            this.text = null;
            this.data = null;
            super.destroy();
        }

        public setVisible(visible: boolean) {
            this.icon.setFlag(SpriteFlag.Invisible, !visible);
            if (this.background) {
                this.background.setFlag(SpriteFlag.Invisible, !visible);
            }
            if (this.text) {
                this.text.setFlag(SpriteFlag.Invisible, !visible);
            }
            if (!visible) {
                this.hover(false);
            }
        }

        public clickable() { return this.onClick != null; }

        public click() {
            if (this.icon.flags & SpriteFlag.Invisible) { return; }
            if (this.onClick) {
                this.onClick(this);
            }
        }

        public moveTo(x: number, y: number) {
            this.x = x;
            this.y = y;
        }

        hover(hov: boolean) {
            if (hov && this.text) { return; }
            if (!hov && !this.text) { return; }
            if (!this.label) { return; }
            if (hov) {
                this.text = textsprite.create(this.label, 1, 15);
                this.text.setBorder(1, 15);
                this.text.x = this.x;
                this.text.y = this.y - this.height;
                this.text.z = this.icon.z;
            } else {
                this.text.destroy();
                this.text = null;
            }
        }

        update() {
            if (this.hud) {
                this.updateScreenRelative();
            } else {
                this.updateAbsolute();
            }
        }

        updateAbsolute() {
            this.icon.x = this.x;
            this.icon.y = this.y;
            if (this.background) {
                this.background.x = this.x;
                this.background.y = this.y;
            }
            if (this.text) {
                this.text.x = this.x;
                this.text.y = this.y - this.height;
            }
        }

        updateScreenRelative() {
            const camera = this.stage.camera;
            camera.setScreenRelativePosition(this.icon, this.x, this.y);
            if (this.background) {
                camera.setScreenRelativePosition(this.background, this.x, this.y);
            }
            if (this.text) {
                camera.setScreenRelativePosition(this.text, this.x, this.y - this.height);
            }
        }

        /*
        sleep() {
            const visible = !(this.icon.flags & SpriteFlag.Invisible);
            this.icon.data["sleep:was_visible"] = visible;
            this.setVisible(false);
            super.sleep();
        }

        wake() {
            this.setVisible(this.icon.data["sleep:was_visible"]);
            super.wake();
        }
        */
    }
}