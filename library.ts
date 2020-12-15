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
            const chars = rule.brain.char.stage.components
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
            const chars: Character[] = rule.brain.char.bumps || [];
            // Map to targets.
            const targets = chars
                .map(char => {
                    return <Target>{
                        char: char,
                        distSq: 0
                    }
                });
            rule.state["targets"] = targets;
            rule.state["exec"] = targets.length > 0;
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
            const dir = rule.state["direction"];
            if (!dir) { return; }
            const actor = rule.brain.char;
            const speed = rule.state["speed"] || actor.defn.defaults.speed;
            const impulseType: ImpulseType = rule.state["exclusive-move"] ? "exclusive" : "ambient";
            actor.queueImpulse(dir, speed, impulseType);
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
            const actor = rule.brain.char;
            const speed = rule.state["speed"] || actor.defn.defaults.speed;
            rule.state["speed"] = speed + actor.defn.defaults.speed * 0.5;
        },

        "modifier.slowly": (rule: Rule) => {
            const actor = rule.brain.char;
            const speed = rule.state["speed"] || actor.defn.defaults.speed;
            rule.state["speed"] = speed * 0.75;
        },

        "modifier.toward": (rule: Rule) => {
            const targets = rule.state["targets"] as Target[];
            if (!targets || !targets.length) { return; }
            const target = targets[0];
            const actor = rule.brain.char;
            let dx = target.char.x - actor.x;
            let dy = target.char.y - actor.y;
            const dist = util.distBetweenSprites(target.char.sprite, actor.sprite);
            if (!dist) { return; }
            dx /= dist;
            dy /= dist;
            rule.state["direction"] = mkVec2(dx, dy);
        },

        "modifier.away": (rule: Rule) => {
            const targets = rule.state["targets"] as Target[];
            if (!targets || !targets.length) { return; }
            const target = targets[0];
            const actor = rule.brain.char;
            let dx = target.char.x - actor.x;
            let dy = target.char.y - actor.y;
            const dist = util.distBetweenSprites(target.char.sprite, actor.sprite);
            if (!dist) { return; }
            dx /= dist;
            dy /= dist;
            rule.state["direction"] = mkVec2(-dx, -dy);
        },

        "modifier.avoid": (rule: Rule) => {
            const targets = rule.state["targets"] as Target[];
            if (!targets || !targets.length) { return; }
            const target = targets[0];
            const actor = rule.brain.char;
            const vToTarget = Vec2.Sub(target.char.pos, actor.pos);
            const vToTargetN = Vec2.Normal(vToTarget);
            // Evaluate's the actor's queued impulses and returns a normalized direction.
            const direction = actor.nextDirection();
            const dot = Vec2.Dot(direction, vToTargetN);
            // Already moving away?
            if (dot < 0) { return; }
            let vSignDir = mkVec2(-1, 1);
            const vTranspose = Vec2.Transpose(vToTargetN);
            if (direction) {
                if (Math.abs(direction.x) > Math.abs(direction.y)) {
                    vSignDir.y = (actor.y > target.char.y) ? 1 : -1;
                    vTranspose.y = Math.abs(vTranspose.y);
                } else {
                    vSignDir.x = (actor.x > target.char.x) ? 1 : -1;
                    vTranspose.x = Math.abs(vTranspose.x);
                }
            }
            rule.state["direction"] = Vec2.Mul(vTranspose, vSignDir);
            rule.state["exclusive-move"] = true;
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