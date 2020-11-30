namespace kodu {
    export class Stage {
        components: Component[];
        camera: Camera;
        cursor: Cursor;

        constructor(public app: App, public name: string) {
            this.components = [];
            this.camera = new Camera(this);
            this.cursor = new Cursor(this);
        }

        public get<T>(field: string): T { return undefined; }
        public set<T>(field: string, value: T) { }

        public sleep() {
            this.components.forEach(comp => comp.sleep());
        }

        public wake(args?: any) {
            this.components.forEach(comp => comp.wake());
        }

        public update() {
            this.components.forEach(comp => comp.update());
        }

        public remove(comp: Component) {
            this.components = this.components.filter(c => c !== comp);
            comp.stage = null;
        }

        public add(comp: Component) {
            this.remove(comp);
            this.components.push(comp);
            comp.stage = this;
        }

        handleAPressed() {
            this.cursor.handleAPressed();
        }

        handleBPressed() {
            this.cursor.handleBPressed();
        }

        handleMenuPressed() {}

        handleCursorCanvasClick(x: number, y: number) {}
        handleCursorButtonClick(button: Button) {}
        handleCursorCharacterClick(char: Character, x: number, y: number) {}
        handleCursorCancel() {}

        notify(event: string, parm?: any) {
            switch (event) {
                case "cursor:canvasClick": {
                    const { x, y } = parm;
                    this.handleCursorCanvasClick(x, y);
                    break;
                }
                case "cursor:buttonClick": {
                    const { button } = parm;
                    this.handleCursorButtonClick(button);
                    break;
                }
                case "cursor:characterClick": {
                    const { char, x, y } = parm;
                    this.handleCursorCharacterClick(char, x, y);
                    break;
                }
                case "cursor:cancel": {
                    this.handleCursorCancel();
                    break;
                }
            }
        }
    }

    export class StageManager {
        stages: {[name: string]: Stage};
        curr: Stage;

        constructor() {
            this.stages = {};
            controller.A.onEvent(ControllerButtonEvent.Pressed, () => this.handleAPressed());
            controller.B.onEvent(ControllerButtonEvent.Pressed, () => this.handleBPressed());
            controller.menu.onEvent(ControllerButtonEvent.Pressed, () => this.handleMenuPressed());
        }

        public add(stage: Stage) {
            this.stages[stage.name] = stage;
            stage.sleep();
        }

        public activate(name: string, args?: any) {
            if (this.curr) {
                this.curr.sleep();
            }
            this.curr = this.stages[name];
            if (this.curr) {
                this.curr.wake(args)
            }
        }

        public update() {
            if (this.curr) {
                this.curr.update();
            }
        }

        handleAPressed() {
            if (this.curr) {
                this.curr.handleAPressed();
            }
        }

        handleBPressed() {
            if (this.curr) {
                this.curr.handleBPressed();
            }
        }

        handleMenuPressed() {
            if (this.curr) {
                this.curr.handleMenuPressed();
            }
        }
    }
}
