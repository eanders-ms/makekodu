namespace kodu {

    export type TileType = "sensor" | "filter" | "actuator" | "modifier";

    export interface Constraints {
        provides?: string[];
        requires?: string[];
        allow?: {
            ids?: string[];
            categories?: string[];
        };
        disallow?: {
            ids?: string[];
            categories?: string[];
        };
        handling?: { [id: string]: string | number | boolean };
    }

    export interface TileDefn {
        type: TileType;
        id: string;
        name: string;
        weight?: number; // Influences sort order
        hidden?: boolean;   // Hide from UI?
        category?: string;
        constraints?: Constraints;
    }

    export type SensorDefn = TileDefn & { type: "sensor"; };
    export type FilterDefn = TileDefn & {
        type: "filter";
        category: string;
        priority: number;  // runtime priority
    };
    export type ActuatorDefn = TileDefn & { type: "actuator"; };
    export type ModifierDefn = TileDefn & {
        type: "modifier";
        category: string;
        priority: number;  // runtime priority
    };

    export class RuleDefn {
        sensor: SensorDefn;
        filters: FilterDefn[];
        actuator: ActuatorDefn;
        modifiers: ModifierDefn[];

        constructor() {
            this.filters = [];
            this.modifiers = [];
        }

        public clone(): RuleDefn {
            const rule = new RuleDefn();
            rule.sensor = this.sensor;
            rule.actuator = this.actuator;
            rule.filters = this.filters.slice(0);
            rule.modifiers = this.modifiers.slice(0);
            return rule;
        }

        public isEmpty(): boolean {
            return !this.sensor && !this.actuator;
        }

        public toObj(): any {
            const obj = {
                sensor: this.sensor ? this.sensor.id : undefined,
                actuator: this.actuator ? this.actuator.id : undefined,
                filters: this.filters.map(elem => elem.id),
                modifiers: this.modifiers.map(elem => elem.id)
            };
            if (!obj.sensor) {
                delete obj.sensor;
            }
            if (!obj.actuator) {
                delete obj.actuator;
            }
            if (!obj.filters.length) {
                delete obj.filters;
            }
            if (!obj.modifiers.length) {
                delete obj.modifiers;
            }
            return obj;
        }

        public static FromObj(obj: any): RuleDefn {
            if (typeof obj === 'string') {
                obj = JSON.parse(obj);
            }
            const rdefn = new RuleDefn;
            if (typeof obj["sensor"] === 'string') {
                rdefn.sensor = tiles.sensors[obj["sensor"]];
            }
            if (typeof obj["actuator"] === 'string') {
                rdefn.actuator = tiles.actuators[obj["actuator"]];
            }
            if (Array.isArray(obj["filters"])) {
                const filters: any[] = obj["filters"];
                rdefn.filters = filters.map((elem: string) => tiles.filters[elem]);
            }
            if (Array.isArray(obj["modifiers"])) {
                const modifiers: any[] = obj["modifiers"];
                rdefn.modifiers = modifiers.map((elem: string) => tiles.modifiers[elem]);
            }
            return rdefn;
        }
    }
    
    export class PageDefn {
        rules: RuleDefn[];

        constructor() {
            this.rules = [];
        }

        public clone(): PageDefn {
            const page = new PageDefn();
            page.rules = this.rules.map(rule => rule.clone());
            return page;
        }

        public trim() {
            while (this.rules.length && this.rules[this.rules.length - 1].isEmpty()) {
                this.rules.pop();
            }
        }

        public toObj(): any {
            const obj = {
                rules: this.rules.map(elem => elem.toObj())
            };
            if (!obj.rules.length) {
                delete obj.rules;
            }
            return obj;
        }

        public static FromObj(obj: any): PageDefn {
            if (typeof obj === 'string') {
                obj = JSON.parse(obj);
            }
            const pdefn = new PageDefn;
            if (Array.isArray(obj["rules"])) {
                const rules: any[] = obj["rules"];
                pdefn.rules = rules.map((elem: any) => RuleDefn.FromObj(elem));
            }
            return pdefn;
        }
    }

    export class BrainDefn {
        pages: PageDefn[];

        constructor() {
            this.pages = [0, 1, 2, 3, 4].map(n => new PageDefn());
        }

        public clone(): BrainDefn {
            const brain = new BrainDefn();
            brain.pages = this.pages.map(page => page.clone());
            return brain;
        }

        public trim() {
            this.pages.map(page => page.trim());
        }

        public toObj(): any {
            return {
                pages: this.pages.map(elem => elem.toObj())
            };
        }

        public static FromObj(obj: any): BrainDefn {
            if (typeof obj === 'string') {
                obj = JSON.parse(obj);
            }
            const bdefn = new BrainDefn();
            if (obj && obj["pages"] && Array.isArray(obj["pages"])) {
                const pages: any[] = obj["pages"];
                bdefn.pages = pages.map((elem: any) => PageDefn.FromObj(elem));
            }
            return bdefn;
        }
    }

    export class Language {
        public static getSensorSuggestions(rule: RuleDefn): SensorDefn[] {
            let sensors = Object.keys(tiles.sensors)
                .map(id => tiles.sensors[id])
                .filter(tile => !tile.hidden)
                .sort((a, b) => {
                    const wa = a.weight || 100;
                    const wb = b.weight || 100;
                    return wa - wb;
                });
            return sensors;
        }

        public static getFilterSuggestions(rule: RuleDefn, index: number): FilterDefn[] {
            let all = Object.keys(tiles.filters)
                .map(id => tiles.filters[id])
                .filter(tile => !tile.hidden)
                .sort((a, b) => {
                    const wa = a.weight || 100;
                    const wb = b.weight || 100;
                    return wa - wb;
                });

            // Collect existing tiles up to index.
            let existing: TileDefn[] = [];
            for (let i = 0; i < index; ++i) {
                existing.push(rule.filters[i]);
            }

            // Return empty set if the last existing tile is a "terminal".
            if (existing.length) {
                const last = existing[existing.length - 1];
                if (last.constraints && last.constraints.handling && last.constraints.handling["terminal"]) { return []; }
            }

            // Collect the built-up constraints.
            const constraints = mkConstraints();
            mergeConstraints(constraints, rule.sensor ? rule.sensor.constraints : null)
            for (let i = 0; i < existing.length; ++i) {
                mergeConstraints(constraints, existing[i].constraints);
            }
            const compatible = this.getCompatibleSet(all, constraints);
            return compatible;
        }

        public static getActuatorSuggestions(rule: RuleDefn): ActuatorDefn[] {
            let actuators = Object.keys(tiles.actuators)
                .map(id => tiles.actuators[id])
                .filter(tile => !tile.hidden)
                .sort((a, b) => {
                    const wa = a.weight || 100;
                    const wb = b.weight || 100;
                    return wa - wb;
                });
            return actuators;
        }

        public static getModifierSuggestions(rule: RuleDefn, index: number): ModifierDefn[] {
            const all = Object.keys(tiles.modifiers)
                .map(id => tiles.modifiers[id])
                .filter(tile => !tile.hidden)
                .sort((a, b) => {
                    const wa = a.weight || 100;
                    const wb = b.weight || 100;
                    return wa - wb;
                });

            // Collect existing tiles up to index.
            let existing: TileDefn[] = [];
            for (let i = 0; i < index; ++i) {
                existing.push(rule.modifiers[i]);
            }

            // Return empty set if the last existing tile is a "terminal".
            if (existing.length) {
                const last = existing[existing.length - 1];
                if (last.constraints && last.constraints.handling && last.constraints.handling["terminal"]) { return []; }
            }

            // Collect the built-up constraints.
            const constraints = mkConstraints();
            mergeConstraints(constraints, rule.actuator ? rule.actuator.constraints : null);
            mergeConstraints(constraints, rule.sensor ? rule.sensor.constraints : null)
            for (let i = 0; i < existing.length; ++i) {
                mergeConstraints(constraints, existing[i].constraints);
            }
            const compatible = this.getCompatibleSet(all, constraints);
            return compatible;
        }

        private static getCompatibleSet<T extends TileDefn>(all: T[], c: Constraints): T[] {
            let compat = all
                // Filter "requires" to matching "provides".
                .filter(tile => {
                    if (!tile.constraints) return true;
                    if (!tile.constraints.requires) return true;
                    let met = false;
                    tile.constraints.requires.forEach(req => met = met || c.provides.some(pro => pro === req));
                    return met;
                })
                // Filter "allows".
                .filter(tile => c.allow.categories.some(cat => cat === tile.category) || c.allow.ids.some(id => id === tile.id))
                // Filter "disallows".
                .filter(tile => !c.disallow.categories.some(cat => cat === tile.category) && !c.disallow.ids.some(id => id === tile.id));
        
            // TODO: c.handling

            return compat;
        }

        public static ensureValid(rule: RuleDefn) {
            if (!rule.sensor) {
                rule.filters = [];
            }
            if (!rule.actuator) {
                rule.modifiers = [];
            }
        }
    }

    function mkConstraints(): Constraints {
        const c: Constraints = {
            provides: [],
            requires: [],
            allow: {
                ids: [],
                categories: []
            },
            disallow: {
                ids: [],
                categories: []
            },
            handling: { }
        };
        return c;
    }

    function mergeConstraints(dst: Constraints, src?: Constraints) {
        if (!src) { return; }
        if (src.provides) {
            src.provides.forEach(item => dst.provides.push(item));
        }
        if (src.requires) {
            src.requires.forEach(item => dst.requires.push(item));
        }
        if (src.allow) {
            (src.allow.ids || []).forEach(item => dst.allow.ids.push(item));
            (src.allow.categories || []).forEach(item => dst.allow.categories.push(item));
        }
        if (src.disallow) {
            (src.disallow.ids || []).forEach(item => dst.disallow.ids.push(item));
            (src.disallow.categories || []).forEach(item => dst.disallow.categories.push(item));
        }
        if (src.handling) {
            const keys = Object.keys(src.handling);
            for (const key of keys) {
                dst.handling[key] = src.handling[key];
            }
        }
    }

    type SensorMap = { [id: string]: SensorDefn; };
    type FilterMap = { [id: string]: FilterDefn; };
    type ActuatorMap = { [id: string]: ActuatorDefn; };
    type ModifierMap = { [id: string]: ModifierDefn; };

    export type TileDatabase = {
        sensors: SensorMap;
        filters: FilterMap;
        actuators: ActuatorMap;
        modifiers: ModifierMap;
    };

    export const tiles: TileDatabase = {
        sensors: {
		    "sensor.always": {
                type: "sensor",
                id: "sensor.always",
                name: "Always",
                hidden: true
            },
            "sensor.see": {
                type: "sensor",
                id: "sensor.see",
                name: "See",
                weight: 1,
                constraints: {
                    provides: ["target"],
                    allow: {
                        categories: ["subject", "direct-subject", "distance"]
                    },
                    disallow: {
                        ids: ["filter.me"]
                    }
                }
            },
            "sensor.bump": {
                type: "sensor",
                id: "sensor.bump",
                name: "Bump",
                weight: 2,
                constraints: {
                    provides: ["target"],
                    allow: {
                        categories: ["subject", "direct-subject"]
                    },
                    disallow: {
                        ids: ["filter.me"]
                    }
                }
            },
            "sensor.dpad": {
                type: "sensor",
                id: "sensor.dpad",
                name: "DPad",
                constraints: {
                    provides: ["input", "direction"],
                    allow: {
                        categories: ["dpad-direction", "button-event"]
                    }
                }
            },
            "sensor.button.a": {
                type: "sensor",
                id: "sensor.button.a",
                name: "A",
                constraints: {
                    provides: ["input"],
                    allow: {
                        categories: ["button-event"]
                    }
                }
            },
            "sensor.button.b": {
                type: "sensor",
                id: "sensor.button.b",
                name: "B",
                constraints: {
                    provides: ["input"],
                    allow: {
                        categories: ["button-event"]
                    }
                }
            }
        },
        filters: {
            "filter.kodu": {
                type: "filter",
                id: "filter.kodu",
                name: "Kodu",
                category: "subject",
                priority: 2,
                constraints: {
                    provides: ["target"],
                    disallow: {
                        categories: ["subject", "direct-subject"]
                    }
                }
            },
            "filter.tree": {
                type: "filter",
                id: "filter.tree",
                name: "Tree",
                category: "subject",
                priority: 2,
                constraints: {
                    provides: ["target"],
                    disallow: {
                        categories: ["subject", "direct-subject"]
                    }
                }            },
            "filter.apple": {
                type: "filter",
                id: "filter.apple",
                name: "Apple",
                category: "subject",
                priority: 2,
                constraints: {
                    provides: ["target"],
                    disallow: {
                        categories: ["subject", "direct-subject"]
                    }
                }
            },
            "filter.nearby": {
                type: "filter",
                id: "filter.nearby",
                name: "nearby",
                category: "distance",
                priority: 2,
                constraints: {
                    provides: ["target"],
                    disallow: {
                        categories: ["distance"]
                    }
                }
            },
            "filter.faraway": {
                type: "filter",
                id: "filter.faraway",
                name: "far away",
                category: "distance",
                priority: 2,
                constraints: {
                    provides: ["target"],
                    disallow: {
                        categories: ["distance"]
                    }
                }
            }
        },
        actuators: {
            "actuator.move": {
                type: "actuator",
                id: "actuator.move",
                name: "Move",
                constraints: {
                    allow: {
                        categories: ["speed", "direction", "direct-object"]
                    }
                }
            },
            "actuator.switch-page": {
                type: "actuator",
                id: "actuator.switch-page",
                name: "Switch page",
                constraints: {
                    allow: {
                        categories: ["page"]
                    }
                }
            },
            "actuator.express": {
                type: "actuator",
                id: "actuator.express",
                name: "Express",
                constraints: {
                    allow: {
                        categories: ["express", "direct-object"]
                    }
                }
            },
            "actuator.boom": {
                type: "actuator",
                id: "actuator.boom",
                name: "Boom",
                constraints: {
                    allow: {
                        categories: ["direct-object"]
                    }
                }
            },
            "actuator.vanish": {
                type: "actuator",
                id: "actuator.vanish",
                name: "Vanish",
                constraints: {
                    allow: {
                        categories: ["direct-object"]
                    }
                }
            },
            "actuator.camera.follow": {
                type: "actuator",
                id: "actuator.camera.follow",
                name: "Follow",
                constraints: {
                    allow: {
                        categories: ["direct-object"]
                    }
                }
            }
        },
        modifiers: {
            "modifier.me": {
                type: "modifier",
                id: "modifier.me",
                name: "me",
                category: "direct-object",
                priority: 1,
                constraints: {
                    produces: ["direct-target"],
                    requires: ["target"],
                    disallow: {
                        categories: ["object", "direct-object"]
                    }
                }
            },
            "modifier.it": {
                type: "modifier",
                id: "modifier.it",
                name: "it",
                category: "direct-object",
                priority: 1,
                constraints: {
                    produces: ["direct-target"],
                    requires: ["target"],
                    disallow: {
                        categories: ["object", "direct-object"]
                    }
                }
            },
            "modifier.kodu": {
                type: "modifier",
                id: "modifier.kodu",
                name: "Kodu",
                category: "object",
                priority: 2,
                constraints: {
                    disallow: {
                        categories: ["object", "direct-object"]
                    }
                }
            },
            "modifier.tree": {
                type: "modifier",
                id: "modifier.tree",
                name: "Tree",
                category: "object",
                priority: 2,
                constraints: {
                    disallow: {
                        categories: ["object", "direct-object"]
                    }
                }
            },
            "modifier.apple": {
                type: "modifier",
                id: "modifier.apple",
                name: "Apple",
                category: "object",
                priority: 2,
                constraints: {
                    disallow: {
                        categories: ["object", "direct-object"]
                    }
                }
            },
            "modifier.quickly": {
                type: "modifier",
                id: "modifier.quickly",
                name: "quickly",
                category: "speed",
                priority: 2,
                constraints: {
                    disallow: {
                        ids: ["modifier.slowly"]
                    },
                    handling: {
                        "max-count": 3
                    }
                }
            },
            "modifier.slowly": {
                type: "modifier",
                id: "modifier.slowly",
                name: "slowly",
                category: "speed",
                priority: 2,
                constraints: {
                    disallow: {
                        ids: ["modifier.quickly"]
                    },
                    handling: {
                        "max-count": 3
                    }
                }
            },
            "modifier.toward": {
                type: "modifier",
                id: "modifier.toward",
                name: "toward",
                category: "direction",
                priority: 2,
                constraints: {
                    requires: ["target"],
                    disallow: {
                        ids: ["modifier.me"],
                        categories: ["direction"]
                    }
                }
            },
            "modifier.away": {
                type: "modifier",
                id: "modifier.away",
                name: "away",
                category: "direction",
                priority: 2,
                constraints: {
                    requires: ["target"],
                    disallow: {
                        ids: ["modifier.me"],
                        categories: ["direction"]
                    }
                }
            },
            "modifier.circle" : {
                type: "modifier",
                id: "modifier.circle",
                name: "around",
                category: "direction",
                priority: 2,
                constraints: {
                    requires: ["target"],
                    disallow: {
                        ids: ["modifier.me"],
                        categories: ["direction"]
                    }
                }
            },
            "modifier.page-1": {
                type: "modifier",
                id: "modifier.page-1",
                name: "page 1",
                category: "page",
                priority: 2,
                constraints: {
                    handling: {
                        "terminal": true
                    }
                }
            },
            "modifier.page-2": {
                type: "modifier",
                id: "modifier.page-2",
                name: "page 2",
                category: "page",
                priority: 2,
                constraints: {
                    handling: {
                        "terminal": true
                    }
                }
            },
            "modifier.page-3": {
                type: "modifier",
                id: "modifier.page-3",
                name: "page 3",
                category: "page",
                priority: 2,
                constraints: {
                    handling: {
                        "terminal": true
                    }
                }
            },
            "modifier.page-4": {
                type: "modifier",
                id: "modifier.page-4",
                name: "page 4",
                category: "page",
                priority: 2,
                constraints: {
                    handling: {
                        "terminal": true
                    }
                }
            },
            "modifier.page-5": {
                type: "modifier",
                id: "modifier.page-5",
                name: "page 5",
                category: "page",
                priority: 2,
                constraints: {
                    handling: {
                        "terminal": true
                    }
                }
            }
        }
    }
}
