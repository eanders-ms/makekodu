namespace kodu {

    class BrainUI extends Component {
        pages: PageUI[];

        constructor(public kstage: KodeStage, brain: BrainDefn, public left: number, public top: number) {
            super(kstage, "brainui");
            this.pages = brain.pages.map((elem, index) => new PageUI(kstage, this, elem, index));
        }

        public layout() {
            let top = this.top;
            for (const page of this.pages) {
                page.layout(this.left, top);
                top += page.height;
            }
        }

        public destroy() {
            this.pages.forEach(page => page.destroy());
            this.pages = [];
        }

        public toDefn(): BrainDefn {
            const brain = new BrainDefn();
            brain.pages = this.pages.map(page => page.toDefn());
            return brain;
        }
    }

    class PageUI extends Component {
        rules: RuleUI[];
        pageBtn: Button;

        height = 0;
        left = 0;
        top = 0;

        constructor(public kstage: KodeStage, brainui: BrainUI, defn: PageDefn, index: number) {
            super(kstage, "pageui");
            this.rules = defn.rules.map(elem => new RuleUI(kstage, this, elem));
            this.ensureFinalEmptyRule();
            this.pageBtn = new Button(
                kstage,
                "clear",
                `filter.page-${index + 1}`,
                null,
                0, 0, false);
            this.pageBtn.z = 800;
        }

        public layout(left: number, top: number) {
            this.left = left;
            this.top = top;
            this.pageBtn.moveTo(left, top);
            top += this.pageBtn.height + 2;

            for (const rule of this.rules) {
                rule.layout(left, top);
                top += rule.height;
            }
            this.height = (top - this.top) + 2;
        }

        public destroy() {
            this.rules.forEach(rule => rule.destroy());
            this.pageBtn.destroy();
            this.rules = undefined;
            this.pageBtn = undefined;
        }

        public trim() {
            while (this.rules.length && this.rules[this.rules.length - 1].isEmpty()) {
                const rule = this.rules.pop();
                rule.destroy();
            }
        }

        public ensureFinalEmptyRule() {
            this.trim();
            if (!this.rules.length || !this.rules[this.rules.length - 1].isEmpty()) {
                this.rules.push(new RuleUI(this.kstage, this, new RuleDefn()));
            }
        }

        public toDefn(): PageDefn {
            const page = new PageDefn();
            page.rules = this.rules.map(rule => rule.toDefn());
            return page;
        }
    }

    class RuleUI extends Component {
        sensor: Button;
        filters: Button[];
        actuator: Button;
        modifiers: Button[];
        menuBtn: Button;
        whenBtn: Button;
        doBtn: Button;
        whenInsertBtn: Button;
        doInsertBtn: Button;

        top = 0;
        left = 0;
        height = 0;

        constructor(public kstage: KodeStage, public pageui: PageUI, public defn: RuleDefn) {
            super(kstage, "ruleui");
            this.filters = [];
            this.modifiers = [];
            this.menuBtn = new Button(
                kstage,
                null,
                "rule-handle",
                null,
                0, 0, false,
                (button) => this.handleMenuClick(button));
            this.menuBtn.z = 800;
            this.whenBtn = new Button(
                kstage,
                null,
                "when",
                null,
                0, 0, false);
            this.whenBtn.z = 800;
            this.whenInsertBtn = new Button(
                kstage,
                "beige",
                "insertion-point",
                null,
                0, 0, false,
                (button) => this.handleWhenInsertClick(button));
            this.whenInsertBtn.z = 800;
            this.doBtn = new Button(
                kstage,
                null,
                "do",
                null,
                0, 0, false);
            this.doBtn.z = 800;
            this.doInsertBtn = new Button(
                kstage,
                "beige",
                "insertion-point",
                null,
                0, 0, false,
                (button) => this.handleDoInsertClick(button));
            this.doInsertBtn.z = 800;

            this.instantiateTiles(defn);
        }

        public layout(left: number, top: number) {
            this.top = top;
            this.left = left;
            this.menuBtn.moveTo(left, top);
            left += (this.menuBtn.width >> 1) + (this.whenBtn.width >> 1);
            this.whenBtn.moveTo(left, top);
            left += (this.whenBtn.width >> 1) + (this.whenInsertBtn.width >> 1);
            if (this.sensor) {
                this.sensor.moveTo(left, top);
                left += (this.sensor.width);
            }
            this.filters.forEach(filter => {
                filter.moveTo(left, top);
                left += (filter.width);
            });
            this.whenInsertBtn.moveTo(left, top);
            left += 4 + (this.whenInsertBtn.width >> 1) + (this.doBtn.width >> 1);
            this.doBtn.moveTo(left, top);
            left += (this.doBtn.width >> 1) + (this.doInsertBtn.width >> 1);
            if (this.actuator) {
                this.actuator.moveTo(left, top);
                left += (this.actuator.width);
            }
            this.modifiers.forEach(modifier => {
                modifier.moveTo(left, top);
                left += (modifier.width);
            });
            this.doInsertBtn.moveTo(left, top);
            this.height = this.whenBtn.height + 2;
        }

        public destroy() {
            this.destroyTiles();
            this.menuBtn.destroy();
            this.whenBtn.destroy();
            this.whenInsertBtn.destroy();
            this.doBtn.destroy();
            this.doInsertBtn.destroy();
            this.menuBtn = undefined;
            this.whenBtn = undefined;
            this.whenInsertBtn = undefined;
            this.doBtn = undefined;
            this.doInsertBtn = undefined;
        }

        destroyTiles() {
            if (this.sensor) { this.sensor.destroy(); }
            if (this.actuator) { this.actuator.destroy(); }
            this.filters.forEach(elem => elem.destroy());
            this.modifiers.forEach(elem => elem.destroy());
            this.sensor = undefined;
            this.actuator = undefined;
            this.filters = undefined;
            this.modifiers = undefined;
        }

        public isEmpty(): boolean {
            return (
                !this.sensor &&
                !this.actuator &&
                this.filters.length === 0 &&
                this.modifiers.length === 0);
        }

        public toDefn(): RuleDefn {
            return this.defn.clone();
        }

        instantiateTiles(defn: RuleDefn) {
            this.destroyTiles();
            if (defn.sensor) {
                this.sensor = this.createSensorBtn(defn.sensor.id);
            }
            this.filters = defn.filters.map((elem, index) => {
                return this.createFilterBtn(elem.id, index);
            });
            if (defn.actuator) {
                this.actuator = this.createActuatorBtn(defn.actuator.id);
            }
            this.modifiers = defn.modifiers.map((elem, index) => {
                return this.createModifierBtn(elem.id, index);
            });
        }

        handleSensorClick(button: Button) {
            const suggestions = Language.getSensorSuggestions(this.defn);
            const items = suggestions.map(elem => {
                return <MenuItemDefn>{
                    icon: elem.id,
                    label: elem.name
                };
            });
            items.push({
                icon: "delete",
                label: "Delete",
                style: "danger"
            });
            this.kstage.showMenu(button.x + 16, button.y, items, "down", (selection: Button) => {
                if (selection.id !== this.sensor.id) {
                    if (selection.id === "delete") {
                        this.defn.sensor = null;
                    } else {
                        this.defn.sensor = tiledb.sensors[selection.id];
                    }
                    Language.ensureValid(this.defn);
                    this.instantiateTiles(this.defn);
                    this.pageui.ensureFinalEmptyRule();
                }
            });
        }

        handleActuatorClick(button: Button) {
            const suggestions = Language.getActuatorSuggestions(this.defn);
            const items = suggestions.map(elem => {
                return <MenuItemDefn>{
                    icon: elem.id,
                    label: elem.name
                };
            });
            items.push({
                icon: "delete",
                label: "Delete",
                style: "danger"
            });
            this.kstage.showMenu(button.x + 16, button.y, items, "down", (selection: Button) => {
                if (selection.id !== this.actuator.id) {
                    if (selection.id === "delete") {
                        this.defn.actuator = null;
                    } else {
                        this.defn.actuator = tiledb.actuators[selection.id];
                    }
                    Language.ensureValid(this.defn);
                    this.instantiateTiles(this.defn);
                    this.pageui.ensureFinalEmptyRule();
                }
            });
        }

        handleFilterClick(button: Button) {
            const index: number = button.data["index"];
            const suggestions = Language.getFilterSuggestions(this.defn, index);
            const items = suggestions.map(elem => {
                return <MenuItemDefn>{
                    icon: elem.id,
                    label: elem.name
                };
            });
            items.push({
                icon: "delete",
                label: "Delete",
                style: "danger"
            });
            this.kstage.showMenu(button.x + 16, button.y, items, "down", (selection: Button) => {
                if (this.defn.filters[index].id !== selection.id) {
                    if (selection.id === "delete") {
                        this.defn.filters.splice(index, 1);
                    } else {
                        this.defn.filters[index] = tiledb.filters[selection.id];
                    }
                    Language.ensureValid(this.defn);
                    this.instantiateTiles(this.defn);
                    this.pageui.ensureFinalEmptyRule();
                }
            });
        }

        handleModifierClick(button: Button) {
            const index: number = button.data["index"];
            const suggestions = Language.getModifierSuggestions(this.defn, index);
            const items = suggestions.map(elem => {
                return <MenuItemDefn>{
                    icon: elem.id,
                    label: elem.name
                };
            });
            items.push({
                icon: "delete",
                label: "Delete",
                style: "danger"
            });
            this.kstage.showMenu(button.x + 16, button.y, items, "down", (selection: Button) => {
                if (this.defn.modifiers[index].id !== selection.id) {
                    if (selection.id === "delete") {
                        this.defn.modifiers.splice(index, 1);
                    } else {
                        this.defn.modifiers[index] = tiledb.modifiers[selection.id];
                    }
                    Language.ensureValid(this.defn);
                    this.instantiateTiles(this.defn);
                    this.pageui.ensureFinalEmptyRule();
                }
            });
        }
 
        handleWhenInsertClick(button: Button) {
            if (this.sensor) {
                const index = this.defn.filters.length;
                const suggestions = Language.getFilterSuggestions(this.defn, index);
                const items = suggestions.map(elem => {
                    return {
                        icon: elem.id,
                        label: elem.name
                    };
                });
                this.kstage.showMenu(button.x + 16, button.y, items, "down", (selection: Button) => {
                    this.defn.filters.push(tiledb.filters[selection.id]);
                    Language.ensureValid(this.defn);
                    this.instantiateTiles(this.defn);
                    this.pageui.ensureFinalEmptyRule();
                });
            } else {
                const suggestions = Language.getSensorSuggestions(this.defn);
                const items = suggestions.map(elem => {
                    return {
                        icon: elem.id,
                        label: elem.name
                    };
                });
                this.kstage.showMenu(button.x + 16, button.y, items, "down", (selection: Button) => {
                    this.defn.sensor = tiledb.sensors[selection.id];
                    Language.ensureValid(this.defn);
                    this.instantiateTiles(this.defn);
                    this.pageui.ensureFinalEmptyRule();
                });
            }
        }

        handleDoInsertClick(button: Button) {
            if (this.actuator) {
                const index = this.defn.modifiers.length;
                const suggestions = Language.getModifierSuggestions(this.defn, index);
                const items = suggestions.map(elem => {
                    return {
                        icon: elem.id,
                        label: elem.name
                    };
                });
                this.kstage.showMenu(button.x + 16, button.y, items, "down", (selection: Button) => {
                    this.defn.modifiers.push(tiledb.modifiers[selection.id]);
                    Language.ensureValid(this.defn);
                    this.instantiateTiles(this.defn);
                    this.pageui.ensureFinalEmptyRule();
                });
            } else {
                const suggestions = Language.getActuatorSuggestions(this.defn);
                const items = suggestions.map(elem => {
                    return {
                        icon: elem.id,
                        label: elem.name
                    };
                });
                this.kstage.showMenu(button.x + 16, button.y, items, "down", (selection: Button) => {
                    this.defn.actuator = tiledb.actuators[selection.id];
                    Language.ensureValid(this.defn);
                    this.instantiateTiles(this.defn);
                    this.pageui.ensureFinalEmptyRule();
                });
            }
        }

        handleMenuClick(button: Button) {
    
        }

        createSensorBtn(id: string): Button {
            const defn = tiledb.sensors[id];
            if (defn) {
                const button = new Button(
                    this.stage,
                    "beige",
                    defn.id,
                    defn.name,
                    0, 0, false,
                    (button) => this.handleSensorClick(button));
                button.z = 800;
                button.data["defn"] = defn;
                return button;
            }
            return undefined;
        }

        createActuatorBtn(id: string): Button {
            const defn = tiledb.actuators[id];
            if (defn) {
                const button = new Button(
                    this.stage,
                    "beige",
                    defn.id,
                    defn.name,
                    0, 0, false,
                    (button) => this.handleActuatorClick(button));
                button.z = 800;
                button.data["defn"] = defn;
                return button;
            }
            return undefined;
        }

        createFilterBtn(id: string, index: number): Button {
            const defn = tiledb.filters[id];
            if (defn) {
                const button = new Button(
                    this.stage,
                    "beige",
                    defn.id,
                    defn.name,
                    0, 0, false,
                    (button) => this.handleFilterClick(button));
                button.z = 800;
                button.data["defn"] = defn;
                button.data["index"] = index;
                return button;
            }
            return undefined;
        }

        createModifierBtn(id: string, index: number): Button {
            const defn = tiledb.modifiers[id];
            if (defn) {
                const button = new Button(
                    this.stage,
                    "beige",
                    defn.id,
                    defn.name,
                    0, 0, false,
                    (button) => this.handleModifierClick(button));
                button.z = 800;
                button.data["defn"] = defn;
                button.data["index"] = index;
                return button;
            }
            return undefined;
        }
    }

    const STAGE_ID = "kode";

    export class KodeStage extends Stage {
        static ID = STAGE_ID;

        okBtn: Button;
        cancelBtn: Button;
        char: Character;
        charBtn: Button;
        brain: BrainUI;
        menu: Menu;

        constructor(app: App) {
            super(app, STAGE_ID);
            this.cancelBtn = new Button(
                this,
                "white",
                "cancel",
                "Cancel",
                136, 8, true,
                () => this.handleCancelBtnClicked());
            this.okBtn = new Button(
                this,
                "white",
                "ok",
                "OK",
                152, 8, true,
                () => this.handleOkBtnClicked());
        }

        public showMenu(x: number, y: number, items: MenuItemDefn[], direction: MenuDirection, onSelect: (selection: Button) => void) {
            this.hideMenu();
            const curx = this.cursor.x;
            const cury = this.cursor.y;
            const camx = this.camera.x;
            const camy = this.camera.y;
            this.menu = new Menu(this, items, false);
            this.menu.show(x, y, direction, (selection) => {
                this.hideMenu();
                onSelect(selection);
                this.cursor.x = curx;
                this.cursor.y = cury;
                this.camera.x = camx;
                this.camera.y = camy;
                this.brain.layout();
            });
        }

        hideMenu() {
            if (this.menu) {
                this.menu.destroy();
                this.menu = null;
            }
        }

        handleBPressed() {
            this.hideMenu();
        }

        handleMenuPressed() {
            this.app.switchTo(WorldStage.ID);
        }

        handleCancelBtnClicked() {
            this.app.switchTo(WorldStage.ID);
        }

        handleOkBtnClicked() {
            const bdefn = this.brain.toDefn();
            this.char.bdefn = bdefn;
            this.app.switchTo(WorldStage.ID, { "save": true });
        }

        handleCursorCanvasClick(x: number, y: number) {
            this.hideMenu();
        }

        handleCursorButtonClick(button: Button) {
            button.click();
        }

        handleCharBtnClick() {
            this.cursor.moveTo(0, 0);
            this.camera.moveTo(0, 0);            
        }

        updateHover() {
            const buttons = this.components
                .filter(comp => comp.kind === "button") as Button[];
            const overlapping = this.cursor.getAllOverlapping()
                .filter(spr => spr.data["kind"] === "button")
                .sort((a, b) => b.z - a.z)
                .map(spr => spr.data["component"] as Button);
            const button = overlapping.shift();
            buttons.forEach(elem => elem.hover(elem === button));
        }

        wake(args?: any) {
            super.wake();
            scene.setBackgroundColor(11);
            this.cursor.moveTo(0, 0);
            this.camera.moveTo(0, 0);
            this.char = args.char;
            this.charBtn = new Button(this, "clear", this.char.defn.id, "", 8, 8, true, () => this.handleCharBtnClick());
            this.brain = new BrainUI(this, this.char.bdefn.clone(), -72, -32);
            this.brain.layout();
        }

        sleep() {
            super.sleep();
            this.char = null;
            if (this.menu) {
                this.menu.destroy();
                this.menu = null;
            }
            if (this.charBtn) {
                this.charBtn.destroy();
                this.charBtn = null;
            }
            if (this.brain) {
                this.brain.destroy();
                this.brain = null;
            }
        }

        notify(event: string, parm?: any) {
            if (event === "cursor:moved") {
                this.updateHover();
            } else {
                super.notify(event, parm);
            }
        }
    }
}