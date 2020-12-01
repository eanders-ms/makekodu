namespace kodu {

    export type TileType = "sensor" | "filter" | "actuator" | "modifier";

    export type TileDefn = {
        type: TileType;
        id: string;
        name: string;
        weight?: number; // Influences sort order
        hidden?: boolean;   // Hide from UI?
        categories?: string[];
        constraints?: { [name: string]: any };
        allow?: {
            ids?: string[];
            categories?: string[];
        };
        disallow?: {
            ids?: string[];
            categories?: string[];
        };
    };

    export type SensorDefn = TileDefn & { type: "sensor"; };
    export type FilterDefn = TileDefn & { type: "filter"; };
    export type ActuatorDefn = TileDefn & { type: "actuator"; };
    export type ModifierDefn = TileDefn & { type: "modifier"; };

    export type SensorMap = { [id: string]: SensorDefn; };
    export type FilterMap = { [id: string]: FilterDefn; };
    export type ActuatorMap = { [id: string]: ActuatorDefn; };
    export type ModifierMap = { [id: string]: ModifierDefn; };

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
                rdefn.sensor = tiledb.sensors[obj["sensor"]];
            }
            if (typeof obj["actuator"] === 'string') {
                rdefn.actuator = tiledb.actuators[obj["actuator"]];
            }
            if (Array.isArray(obj["filters"])) {
                const filters: any[] = obj["filters"];
                rdefn.filters = filters.map((elem: string) => tiledb.filters[elem]);
            }
            if (Array.isArray(obj["modifiers"])) {
                const modifiers: any[] = obj["modifiers"];
                rdefn.modifiers = modifiers.map((elem: string) => tiledb.modifiers[elem]);
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
            let sensors = Object.keys(tiledb.sensors)
                .map(id => tiledb.sensors[id])
                .filter(tile => !tile.hidden)
                .sort((a, b) => {
                    const wa = a.weight || 100;
                    const wb = b.weight || 100;
                    return wa - wb;
                });
            return sensors;
        }

        public static getFilterSuggestions(rule: RuleDefn, index: number): FilterDefn[] {
            let filters = Object.keys(tiledb.filters)
                .map(id => tiledb.filters[id])
                .filter(tile => !tile.hidden)
                .sort((a, b) => {
                    const wa = a.weight || 100;
                    const wb = b.weight || 100;
                    return wa - wb;
                });
            return filters;
        }

        public static getActuatorSuggestions(rule: RuleDefn): ActuatorDefn[] {
            let actuators = Object.keys(tiledb.actuators)
                .map(id => tiledb.actuators[id])
                .filter(tile => !tile.hidden)
                .sort((a, b) => {
                    const wa = a.weight || 100;
                    const wb = b.weight || 100;
                    return wa - wb;
                });
            return actuators;
        }

        public static getModifierSuggestions(rule: RuleDefn, index: number): ModifierDefn[] {
            let modifiers = Object.keys(tiledb.modifiers)
                .map(id => tiledb.modifiers[id])
                .filter(tile => !tile.hidden)
                .sort((a, b) => {
                    const wa = a.weight || 100;
                    const wb = b.weight || 100;
                    return wa - wb;
                });
            return modifiers;
        }

        public static ensureValid(rule: RuleDefn) {
            if (!rule.sensor) {
                rule.filters = [];
            }
            if (!rule.actuator) {
                rule.modifiers = [];
            }
        }

        public static hasCategory(tileDefn: TileDefn, category: string): boolean {
            if (!tileDefn || !tileDefn.categories) { return false; }
            return tileDefn.categories.some(elem => elem === category);
        }
    }

    export type TileDatabase = {
        sensors: SensorMap;
        filters: FilterMap;
        actuators: ActuatorMap;
        modifiers: ModifierMap;
    };

    export const tiledb: TileDatabase = {
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
                categories: [
                    "object"
                ],
                disallow: {
                    ids: [
                        "filter.me"
                    ]
                }
            },
            "sensor.bump": {
                type: "sensor",
                id: "sensor.bump",
                name: "Bump",
                weight: 2,
                categories: [
                    "object"
                ],
                disallow: {
                    ids: [
                        "filter.me"
                    ]
                }
            },
            "sensor.dpad": {
                type: "sensor",
                id: "sensor.dpad",
                name: "DPad",
                categories: [
                    "input"
                ],
                allow: {
                    categories: [
                        "filter.dpad-button",
                        "filter.button-event"
                    ]
                }
            },
            "sensor.button.a": {
                type: "sensor",
                id: "sensor.button.a",
                name: "A",
                categories: [
                    "input"
                ],
                allow: {
                    categories: [
                        "filter.button-event"
                    ]
                }
            },
            "sensor.button.b": {
                type: "sensor",
                id: "sensor.button.b",
                name: "B",
                categories: [
                    "input"
                ],
                allow: {
                    categories: [
                        "filter.button-event"
                    ]
                }
            }
        },
        filters: {
            /*
            "filter.me": {
                type: "filter",
                id: "filter.me",
                name: "me",
                categories: [
                    "object"
                ],
                disallow: {
                    categories: [
                        "object"
                    ]
                }
            },
            "filter.it": {
                type: "filter",
                id: "filter.it",
                name: "it",
                categories: [
                    "object"
                ],
                disallow: {
                    categories: [
                        "object"
                    ]
                }
            },
            */
            "filter.kodu": {
                type: "filter",
                id: "filter.kodu",
                name: "Kodu",
                categories: [
                    "object"
                ],
                disallow: {
                    categories: [
                        "object"
                    ]
                }
            },
            "filter.tree": {
                type: "filter",
                id: "filter.tree",
                name: "Tree",
                categories: [
                    "object"
                ],
                disallow: {
                    categories: [
                        "object"
                    ]
                }
            },
            "filter.apple": {
                type: "filter",
                id: "filter.apple",
                name: "Apple",
                categories: [
                    "object"
                ],
                disallow: {
                    categories: [
                        "object"
                    ]
                }
            },
            "filter.nearby": {
                type: "filter",
                id: "filter.nearby",
                name: "nearby",
                categories: [
                    "range"
                ],
                disallow: {
                    categories: [
                        "range"
                    ]
                }
            },
            "filter.faraway": {
                type: "filter",
                id: "filter.faraway",
                name: "far away",
                categories: [
                    "range"
                ],
                disallow: {
                    categories: [
                        "range"
                    ]
                }
            }
        },
        actuators: {
            "actuator.move": {
                type: "actuator",
                id: "actuator.move",
                name: "Move",
                categories: [
                    "movement"
                ],
                allow: {
                    categories: [
                        "speed",
                        "direction"
                    ]
                }
            },
            "actuator.switch-page": {
                type: "actuator",
                id: "actuator.switch-page",
                name: "Switch page",
                allow: {
                    categories: [
                        "page"
                    ]
                }
            },
            "actuator.express": {
                type: "actuator",
                id: "actuator.express",
                name: "Express",
                allow: {
                    categories: [
                        "express"
                    ]
                }
            },
            "actuator.boom": {
                type: "actuator",
                id: "actuator.boom",
                name: "Boom",
                allow: {
                    categories: [
                        "object"
                    ]
                }
            },
            "actuator.vanish": {
                type: "actuator",
                id: "actuator.vanish",
                name: "Vanish",
                allow: {
                    categories: [
                        "object"
                    ]
                }
            },
            "actuator.camera.follow": {
                type: "actuator",
                id: "actuator.camera.follow",
                name: "Follow"
            }
        },
        modifiers: {
            "modifier.me": {
                type: "modifier",
                id: "modifier.me",
                name: "me",
                categories: [
                    "object"
                ],
                disallow: {
                    categories: [
                        "object"
                    ]
                }
            },
            "modifier.it": {
                type: "modifier",
                id: "modifier.it",
                name: "it",
                categories: [
                    "object"
                ],
                disallow: {
                    categories: [
                        "object"
                    ]
                }
            },
            "modifier.kodu": {
                type: "modifier",
                id: "modifier.kodu",
                name: "Kodu",
                categories: [
                    "object"
                ],
                disallow: {
                    categories: [
                        "object"
                    ]
                }
            },
            "modifier.tree": {
                type: "modifier",
                id: "modifier.tree",
                name: "Tree",
                categories: [
                    "object"
                ],
                disallow: {
                    categories: [
                        "object"
                    ]
                }
            },
            "modifier.apple": {
                type: "modifier",
                id: "modifier.apple",
                name: "Apple",
                categories: [
                    "object"
                ],
                disallow: {
                    categories: [
                        "object"
                    ]
                }
            },
            "modifier.quickly": {
                type: "modifier",
                id: "modifier.quickly",
                name: "quickly",
                categories: [
                    "speed"
                ],
                constraints: {
                    "max-count": 3
                },
                disallow: {
                    ids: [
                        "modifier.slowly"
                    ]
                }
            },
            "modifier.slowly": {
                type: "modifier",
                id: "modifier.slowly",
                name: "slowly",
                categories: [
                    "speed"
                ],
                constraints: {
                    "max-count": 3
                },
                disallow: {
                    ids: [
                        "modifier.quickly"
                    ]
                }
            },
            "modifier.toward": {
                type: "modifier",
                id: "modifier.toward",
                name: "toward",
                categories: [
                    "direction"
                ],
                disallow: {
                    categories: [
                        "direction"
                    ]
                }
            },
            "modifier.away": {
                type: "modifier",
                id: "modifier.away",
                name: "away",
                categories: [
                    "direction"
                ],
                disallow: {
                    categories: [
                        "direction"
                    ]
                }
            },
            "modifier.circle" : {
                type: "modifier",
                id: "modifier.circle",
                name: "around",
                categories: [
                    "direction"
                ],
                disallow: {
                    categories: [
                        "direction"
                    ]
                }
            },
            "modifier.page-1": {
                type: "modifier",
                id: "modifier.page-1",
                name: "page 1",
                categories: [
                    "page"
                ],
                constraints: {
                    "line-terminator": true
                }
            },
            "modifier.page-2": {
                type: "modifier",
                id: "modifier.page-2",
                name: "page 2",
                categories: [
                    "page"
                ],
                constraints: {
                    "line-terminator": true
                }
            },
            "modifier.page-3": {
                type: "modifier",
                id: "modifier.page-3",
                name: "page 3",
                categories: [
                    "page"
                ],
                constraints: {
                    "line-terminator": true
                }
            },
            "modifier.page-4": {
                type: "modifier",
                id: "modifier.page-4",
                name: "page 4",
                categories: [
                    "page"
                ],
                constraints: {
                    "line-terminator": true
                }
            },
            "modifier.page-5": {
                type: "modifier",
                id: "modifier.page-5",
                name: "page 5",
                categories: [
                    "page"
                ],
                constraints: {
                    "line-terminator": true
                }
            }
        }
    }
}
