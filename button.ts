namespace kodu {
    export class Button extends Component {
        spr: Sprite;
        text: TextSprite;
        data: any;

        get id() { return this.iconId; }

        get width() { return this.spr.width; }
        get height() { return this.spr.height; }
        get z() { return this.spr.z; }
        set z(n: number) {
            this.spr.z = n;
            if (this.text) {
                this.text.z = n;
            }
        }

        constructor(
            stage: Stage,
            private style: ButtonStyle,
            private iconId: string,
            private label: string,
            public x: number,
            public y: number,
            private hud: boolean,
            private onClick?: (button: Button) => void
        ) {
            super(stage, "button");
            this.data = {};
            this.buildSprite(900);
        }

        destroy() {
            if (this.spr) { this.spr.destroy(); }
            if (this.text) { this.text.destroy(); }
            this.spr = null;
            this.text = null;
            this.data = null;
            super.destroy();
        }

        public setIcon(iconId: string) {
            this.iconId = iconId;
            this.buildSprite(this.z);
        }

        private buildSprite(z_: number) {
            if (this.spr) {
                this.spr.destroy();
            }
            let img: Image;
            if (this.style) {
                img = icons.get(`button_${this.style}`).clone();
                img.drawTransparentImage(icons.get(this.iconId), 0, 0);
            } else {
                img = icons.get(this.iconId).clone();
            }
            this.spr = sprites.create(img, 0);
            this.spr.setFlag(SpriteFlag.Ghost, true);
            this.spr.x = this.x;
            this.spr.y = this.y;
            this.spr.z = z_;
            this.spr.data["kind"] = "button";
            this.spr.data["component"] = this;
        }

        public setVisible(visible: boolean) {
            this.spr.setFlag(SpriteFlag.Invisible, !visible);
            if (this.text) {
                this.text.setFlag(SpriteFlag.Invisible, !visible);
            }
            if (!visible) {
                this.hover(false);
            }
        }

        public clickable() { return this.onClick != null; }

        public click() {
            if (this.spr.flags & SpriteFlag.Invisible) { return; }
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
                this.text.z = this.spr.z;
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
            this.spr.x = this.x;
            this.spr.y = this.y;
            if (this.text) {
                this.text.x = this.x;
                this.text.y = this.y - this.height;
            }
        }

        updateScreenRelative() {
            const camera = this.stage.camera;
            camera.setScreenRelativePosition(this.spr, this.x, this.y);
            if (this.text) {
                camera.setScreenRelativePosition(this.text, this.x, this.y - this.height);
            }
        }
    }
}