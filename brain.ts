namespace kodu {
    export class Brain {
        currPage: number;
        pages: Page[];
        done: boolean;
        wander: Wander;

        constructor(public char: Character) {
            this.currPage = 0;
            this.wander = new Wander(this);
            if (char.bdefn) {
                this.pages = char.bdefn.pages.map((elem, index) => new Page(this, elem, index));
            } else {
                this.pages = [];
            }
        }

        public execute() {
            this.done = false;
            const page = this.pages[this.currPage];
            if (page) {
                this.wander.prepare();
                page.execute();
                this.wander.update();
            }
        }

        public switchPage(n: number) {
            this.currPage = n;
            this.done = true;
        }

        public cameraFollow(char: Character) {
            this.char.stage.notify("camera:follow", char);
        }
    }

    class Page {
        rules: Rule[];

        constructor(public brain: Brain, public defn: PageDefn, public index: number) {
            this.rules = this.defn.rules.map(elem => new Rule(this, elem));
        }

        public execute() {
            for (const rule of this.rules) {
                rule.execute();
                if (this.brain.done) { break; }
            }
        }
    }

    export class Rule {
        prevState: any;
        state: any;
        sensorFn: LibraryFn;
        filterFns: LibraryFn[];
        actuatorFn: LibraryFn;
        modifierFns: LibraryFn[];
        hasInput: boolean;

        get brain(): Brain { return this.page.brain; }

        constructor(public page: Page, public defn: RuleDefn) {
            this.prevState = {};
            this.state = {};
            this.sensorFn = Library.getFunction((this.defn.sensor || tiles.sensors["sensor.always"]).id);
            this.filterFns = (this.defn.filters || [])
                .sort((a, b) => a.priority - b.priority)
                .map(elem => Library.getFunction(elem.id));
            this.actuatorFn = Library.getFunction((this.defn.actuator || <any>{}).id);
            this.modifierFns = (this.defn.modifiers || [])
                .sort((a, b) => a.priority - b.priority)
                .map(elem => Library.getFunction(elem.id));
            this.hasInput =
                this.defn.sensor &&
                this.defn.sensor.constraints &&
                (this.defn.sensor.constraints.provides || []).some(item => item === "input");
        }

        public execute() {
            if (this.hasInput) {
                this.page.brain.char.stage.notify("char:has-input", this.page.brain.char);
            }
            this.prevState = this.state;
            this.state = {};
            this.sensorFn(this);
            this.filterFns.forEach(fn => fn(this));
            if (this.state["exec"]) {
                this.modifierFns.forEach(fn => fn(this));
                this.actuatorFn(this);
           }
        }
    }

    class Wander {
        dest: Vec2;
        poked: boolean;
        timer: any;

        constructor(public brain: Brain) {}

        public prepare() {
            this.poked = false;
            if (!this.dest) { this.pickDest(); }
        }

        public update() {
            if (this.poked) {
                if (this.timer) { return; }
                this.setTimer();
            } else {
                if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                    this.dest = null; // maybe keep this?
                }
            }
        }

        public direction(): Vec2 {
            this.poked = true;
            if (!this.dest) {
                this.pickDest();
            }
            const dx = (this.dest.x - this.brain.char.x);
            const dy = (this.dest.y - this.brain.char.y);
            const distSq = (dx * dx) + (dy * dy);

            if (!distSq) {
                return undefined;
            }

            const dist = Math.sqrt(distSq);
            return mkVec2(dx / dist, dy / dist);
        }

        private timerCallback() {
            this.pickDest();
            this.timer = null;
        }

        private setTimer() {
            this.timer = setTimeout(() => this.timerCallback(), 1000 * Math.floor(2 + Math.random() * 3));
        }

        margin = 30;

        private pickDest() {
            if (!this.brain.char.sprite) { return; }
            const camx = this.brain.char.stage.camera.x;
            const camy = this.brain.char.stage.camera.y;
            const x = -(80 + this.margin) + camx + Math.random() * (160 + this.margin * 2);
            const y = -(60 + this.margin) + camy + Math.random() * (120 + this.margin * 2);
            this.dest = mkVec2(x, y);
        }

    }
}
