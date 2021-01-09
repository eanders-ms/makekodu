namespace kodu {
    export class Button extends Component {
        kel: Kelpie;
        text: TextSprite;

        get id() { return this.iconId; }
        get width() { return this.kel.width; }
        get height() { return this.kel.height; }
        get z() { return this.kel.z; }
        set z(n: number) {
            this.kel.z = n;
            if (this.text) {
                this.text.z = n;
            }
        }
        get data() { return this.kel.data; }

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
            this.buildSprite(900);
        }

        destroy() {
            if (this.kel) { this.kel.destroy(); }
            if (this.text) { this.text.destroy(); }
            this.kel = null;
            this.text = null;
            super.destroy();
        }

        public setIcon(iconId: string) {
            this.iconId = iconId;
            this.buildSprite(this.z);
        }

        private buildSprite(z_: number) {
            if (this.kel) {
                this.kel.destroy();
            }
            let img: Image;
            if (this.style) {
                img = icons.get(`button_${this.style}`).clone();
                img.drawTransparentImage(icons.get(this.iconId), 0, 0);
            } else {
                img = icons.get(this.iconId).clone();
            }
            this.kel = new Kelpie(img);
            this.kel.x = this.x;
            this.kel.y = this.y;
            this.kel.z = z_;
            this.kel.data["kind"] = "button";
            this.kel.data["component"] = this;
        }

        public setVisible(visible: boolean) {
            this.kel.invisible = !visible;
            if (this.text) {
                this.text.setFlag(SpriteFlag.Invisible, !visible);
            }
            if (!visible) {
                this.hover(false);
            }
        }

        public clickable() { return this.onClick != null; }

        public click() {
            if (this.kel.invisible) { return; }
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
                this.text.z = this.kel.z;
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
            this.kel.x = this.x;
            this.kel.y = this.y;
            if (this.text) {
                this.text.x = this.x;
                this.text.y = this.y - this.height;
            }
        }

        updateScreenRelative() {
            const camera = this.stage.camera;
            camera.setScreenRelativePosition(this.kel, this.x, this.y);
            if (this.text) {
                camera.setScreenRelativePosition(this.text, this.x, this.y - this.height);
            }
        }
    }
}