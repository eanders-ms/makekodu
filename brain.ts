namespace kodu {
    export enum Feeling {
        None,
        Happy,
        Angry,
        Heart,
        Sad
    }

    export class Brain {
        currPage: number;
        pages: Page[];
        done: boolean;
        wander: Wander;
        prevFeeling: Feeling;
        feeling: Feeling;
        executing: boolean;

        constructor(public char: Character) {
            this.prevFeeling = this.feeling = Feeling.None;
            this.currPage = 0;
            this.wander = new Wander(this);
            if (char.bdefn) {
                this.pages = char.bdefn.pages.map((elem, index) => new Page(this, elem, index));
            } else {
                this.pages = [];
            }
        }

        public destroy() {
            for (const page of this.pages) {
                page.destroy();
            }
            this.pages = undefined;
            this.char = undefined;
        }

        public execute() {
            if (this.executing) { return; } // Disallow recursion from [call page] actuator.
            this.executing = true;
            this.done = false;
            this.prevFeeling = this.feeling;
            const page = this.pages[this.currPage];
            if (page) {
                this.wander.prepare();
                page.execute();
                this.wander.update();
            }
            this.executing = false;
            this.updateExpression();
        }

        public switchPage(n: number) {
            this.currPage = n;
            const page = this.pages[this.currPage];
            if (page) {
                page.reset();
            }
            this.done = true;
        }

        public cameraFollow(char: Character) {
            this.char.stage.notify("camera:follow", char);
        }

        public feel(feeling: Feeling) {
            this.feeling = feeling;
        }

        private updateExpression() {
            if (this.feeling !== this.prevFeeling) {
                this.char.showFeeling(this.feeling);
            }
        }
    }

    class Page {
        rules: Rule[];

        constructor(public brain: Brain, public defn: PageDefn, public index: number) {
            this.rules = this.defn.rules.map(elem => new Rule(this, elem));
        }

        public destroy() {
            for (const rule of this.rules) {
                rule.destroy();
            }
            this.rules = undefined;
            this.defn = undefined;
            this.brain = undefined;
        }

        public execute() {
            for (const rule of this.rules) {
                rule.execute();
                if (this.brain.done) { break; }
            }
        }

        public reset() {
            for (const rule of this.rules) {
                rule.reset();
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
        hasMovement: boolean;

        get brain(): Brain { return this.page.brain; }

        constructor(public page: Page, public defn: RuleDefn) {
            this.prevState = {};
            this.state = {};
            this.sensorFn = Library.getFunction((this.defn.sensor || tiles.sensors[tid.sensor.always]).tid);
            this.filterFns = (this.defn.filters || [])
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map(elem => Library.getFunction(elem.tid));
            this.actuatorFn = Library.getFunction((this.defn.actuator || <any>{}).tid);
            this.modifierFns = (this.defn.modifiers || [])
                .slice()
                .sort((a, b) => a.priority - b.priority)
                .map(elem => Library.getFunction(elem.tid));
            this.hasInput =
                this.defn.sensor &&
                this.defn.sensor.constraints &&
                (this.defn.sensor.constraints.provides || []).some(item => item === "input");
            this.hasMovement =
                this.defn.actuator &&
                this.defn.actuator.category &&
                this.defn.actuator.category === "movement";
        }

        public destroy() {
            this.state = this.prevState = undefined;
            this.sensorFn = undefined;
            this.filterFns = undefined;
            this.actuatorFn = undefined;
            this.modifierFns = undefined;
            this.page = undefined;
            this.defn = undefined;
        }

        public execute() {
            if (this.hasInput) {
                this.page.brain.char.stage.notify("char:has-input", this.page.brain.char);
            }
            this.prevState = this.state;
            this.state = {};
            if (!this.defn.sensor || this.defn.sensor.phase === "pre") {
                this.sensorFn(this);
            }
            this.filterFns.forEach(fn => fn(this));
            if (this.defn.sensor && this.defn.sensor.phase === "post") {
                this.sensorFn(this);
            }
            if (this.evalRuleCondition()) {
                if (this.hasMovement) {
                    this.queueDefaultMovement();
                }
                this.modifierFns.forEach(fn => fn(this));
                this.actuatorFn(this);
           }
        }

        public reset() {
            this.prevState = {};
            this.state = {};
        }

        private evalRuleCondition(): boolean {
            switch (this.defn.condition) {
                case RuleCondition.LOW:
                    return !this.state["exec"];
                case RuleCondition.LOW_TO_HIGH:
                    // Strong false check against prev state to ensure it was evaluated, and resulted in "no exec".
                    return this.prevState["exec"] === false && this.state["exec"];
                case RuleCondition.HIGH_TO_LOW:
                    return this.prevState["exec"] && !this.state["exec"];
                default:
                    return this.state["exec"];
            }
        }

        private queueDefaultMovement() {
            // Don't enqueue a movement if moves are already queued.
            if (!this.state["direction"] && !this.brain.char.impulseQueue.length) {
                const dir = this.brain.wander.direction();
                const speed = this.brain.char.defn.defaults.speed;
                this.brain.char.queueImpulse(dir, speed, ImpulseType.Default);
                this.state["direction"] = dir;
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
