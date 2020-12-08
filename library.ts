namespace kodu {
    export type LibraryFn = (rule: Rule) => void;
 
    export type LibraryFnMap = {
        [id: string]: LibraryFn;
    };

    export class Library {
        public static getFunction(id: string): LibraryFn {
            id = id || "noop";
            return librarydb[id] || librarydb["noop"];
        }
    }

    type Target = {
        char: Character;
        distSq: number;
    };

    const DIST_CUTOFF_SQ = 3000;

    const librarydb: LibraryFnMap = {
        "noop": (rule: Rule) => { },

        ///
        /// SENSORS
        ///
        "sensor.always": (rule: Rule) => {
            rule.state["exec"] = true;
        },

        "sensor.see": (rule: Rule) => {
            // Select characters except the one executing this.
            let chars = rule.brain.char.stage.components
                .filter(comp => comp.kind === "character" && comp !== rule.brain.char) as Character[];
            // Sort by distance, near to far.
            const targets = chars
                .map(char => {
                    return <Target>{
                        char: char,
                        distSq: util.distSqBetweenSprites(char.sprite, rule.brain.char.sprite)
                    }
                })
                .sort((a, b) => a.distSq - b.distSq);
            rule.state["targets"] = targets;
            rule.state["exec"] = targets.length > 0;
        },

        "sensor.bump": (rule: Rule) => {
        },

        "sensor.dpad": (rule: Rule) => {
            const direction = mkVec2();
            if (controller.up.isPressed()) { direction.y -= 1; }
            if (controller.down.isPressed()) { direction.y += 1; }
            if (controller.left.isPressed()) { direction.x -= 1; }
            if (controller.right.isPressed()) { direction.x += 1; }
            if (direction.x || direction.y) {
                rule.state["exec"] = true;
                rule.state["direction"] = direction;
            }
        },

        "sensor.button.a": (rule: Rule) => {
            if (controller.A.isPressed()) {
                rule.state["exec"] = true;
            }
        },

        "sensor.button.b": (rule: Rule) => {
            if (controller.B.isPressed()) {
                rule.state["exec"] = true;
            }
        },

        ///
        /// FILTERS
        ///
        "filter.me": (rule: Rule) => {
            rule.state["targets"] = [{
                char: rule.brain.char,
                distSq: 0
            }] as Target[];
            rule.state["exec"] = true;
        },

        "filter.it": (rule: Rule) => {
            let targets: Target[] = rule.state["targets"];
            if (!targets || !targets.length) { return; }
            targets = targets.slice(0, 1);
            rule.state["targets"] = targets;
            rule.state["exec"] = targets.length > 0;
        },

        "filter.nearby": (rule: Rule) => {
            let targets: Target[] = rule.state["targets"];
            if (!targets) { return; }
            if (!rule.state["dist_cutoff_sq"]) {
                rule.state["dist_cutoff_sq"] = DIST_CUTOFF_SQ;
            } else {
                rule.state["dist_cutoff_sq"] *= 0.5;
            }
            const distCutoffSq: number = rule.state["dist_cutoff_sq"];
            targets = targets.filter(targ => targ.distSq < distCutoffSq);
            rule.state["targets"] = targets;
            rule.state["exec"] = targets.length > 0;
        },

        "filter.faraway": (rule: Rule) => {
            let targets: Target[] = rule.state["targets"];
            if (!targets) { return; }
            if (!rule.state["dist_cutoff_sq"]) {
                rule.state["dist_cutoff_sq"] = DIST_CUTOFF_SQ;
            } else {
                rule.state["dist_cutoff_sq"] *= 1.5;
            }
            const distCutoffSq: number = rule.state["dist_cutoff_sq"];
            targets = targets.filter(targ => targ.distSq >= distCutoffSq);
            rule.state["targets"] = targets;
            rule.state["exec"] = targets.length > 0;
        },

        "filter.kodu":  (rule: Rule) => {
            let targets: Target[] = rule.state["targets"];
            if (!targets) { return; }
            targets = targets.filter(targ => targ.char.defn.id === "kodu");
            rule.state["targets"] = targets;
            rule.state["exec"] = targets.length > 0;
        },

        "filter.apple":  (rule: Rule) => {
            let targets: Target[] = rule.state["targets"];
            if (!targets) { return; }
            targets = targets.filter(targ => targ.char.defn.id === "apple");
            rule.state["targets"] = targets;
            rule.state["exec"] = targets.length > 0;
        },

        "filter.tree":  (rule: Rule) => {
            let targets: Target[] = rule.state["targets"];
            if (!targets) { return; }
            targets = targets.filter(targ => targ.char.defn.id === "tree");
            rule.state["targets"] = targets;
            rule.state["exec"] = targets.length > 0;
        },

        ///
        /// ACTUATORS
        ///
        "actuator.move": (rule: Rule) => {
            // TODO: wander if no direction
            const dir = rule.state["direction"] || rule.brain.wander.direction();
            if (!dir) { return; }
            const speed = rule.state["speed"] || rule.brain.char.defn.defaults.speed;
            let movee: Character = rule.brain.char;
            const directTarget: Target = rule.state["direct-target"];
            if (directTarget) {
                movee = directTarget.char;
            }
            if (movee) {
                movee.queueImpulse(dir, speed);
            }
        },

        "actuator.switch-page": (rule: Rule) => {
            const page: number = rule.state["page"];
            if (page !== undefined) {
                rule.brain.switchPage(page);
            }
        },

        "actuator.vanish": (rule: Rule) => {
            const targets: Target[] = rule.state["targets"];
            let vanishee: Character = rule.brain.char;
            if (targets && targets.length) {
                vanishee = targets[0].char;
            }
            if (vanishee) {
                vanishee.destroy();
            }
        },

        "actuator.camera.follow": (rule: Rule) => {
            const targets: Target[] = rule.state["targets"];
            let target: Character = rule.brain.char;
            if (targets && targets.length) {
                target = targets[0].char;
            }
            if (target) {
                rule.brain.cameraFollow(target);
            }
        },
        
        ///
        /// MODIFIERS
        ///
        "modifier.me": (rule: Rule) => {
            const targets: Target[] = [{
                char: rule.brain.char,
                distSq: 0
            }];
            rule.state["targets"] = targets;
            rule.state["direct-target"] = targets[0];
        },

        "modifier.it": (rule: Rule) => {
            let targets = rule.state["targets"] as Target[];
            rule.state["targets"] = undefined;
            if (!targets || !targets.length) { return; }
            targets = targets.slice(0, 1);
            rule.state["targets"] = targets;
            rule.state["direct-target"] = targets[0];
        },

        "modifier.quickly": (rule: Rule) => {
            const speed = rule.state["speed"] || rule.brain.char.defn.defaults.speed;
            rule.state["speed"] = speed + rule.brain.char.defn.defaults.speed * 0.5;
        },

        "modifier.slowly": (rule: Rule) => {
            const speed = rule.state["speed"] || rule.brain.char.defn.defaults.speed;
            rule.state["speed"] = speed * 0.75;
        },

        "modifier.toward": (rule: Rule) => {
            const targets = rule.state["targets"] as Target[];
            if (!targets || !targets.length) { return; }
            const target = targets[0];
            let dx = target.char.x - rule.brain.char.x;
            let dy = target.char.y - rule.brain.char.y;
            const dist = util.distBetweenSprites(target.char.sprite, rule.brain.char.sprite);
            if (!dist) { return; }
            dx /= dist;
            dy /= dist;
            rule.state["direction"] = mkVec2(dx, dy);
        },

        "modifier.away": (rule: Rule) => {
            const targets = rule.state["targets"] as Target[];
            if (!targets || !targets.length) { return; }
            const target = targets[0];
            let dx = target.char.x - rule.brain.char.x;
            let dy = target.char.y - rule.brain.char.y;
            const dist = util.distBetweenSprites(target.char.sprite, rule.brain.char.sprite);
            if (!dist) { return; }
            dx /= dist;
            dy /= dist;
            rule.state["direction"] = mkVec2(-dx, -dy);
        },

        "modifier.circle": (rule: Rule) => {
            const targets = rule.state["targets"] as Target[];
            if (!targets || !targets.length) { return; }
            const target = targets[0];
            let dx = target.char.x - rule.brain.char.x;
            let dy = target.char.y - rule.brain.char.y;
            const dist = util.distBetweenSprites(target.char.sprite, rule.brain.char.sprite);
            if (!dist) { return; }
            dx /= dist;
            dy /= dist;
            if (dist < target.char.body.radius + rule.brain.char.body.radius * 2) {
                // too close. move away from it
                dx = -dx;
                dy = -dy;
            } else {
                // move around it
                const tmp = dx;
                dx = -dy;
                dy = tmp;
            }
            rule.state["direction"] = mkVec2(dx, dy);
        },

        "modifier.page-1": (rule: Rule) => {
            rule.state["page"] = 0;
        },

        "modifier.page-2": (rule: Rule) => {
            rule.state["page"] = 1;
        },
        
        "modifier.page-3": (rule: Rule) => {
            rule.state["page"] = 2;
        },
        
        "modifier.page-4": (rule: Rule) => {
            rule.state["page"] = 3;
        },
        
        "modifier.page-5": (rule: Rule) => {
            rule.state["page"] = 4;
        },
        
    }
}