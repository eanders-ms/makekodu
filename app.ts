namespace kodu {
    export class App {
        stageManager: StageManager;

        public cursorSpeed = 3;

        constructor() {
            // One interval delay to ensure all static constructors have executed.
            setTimeout(() => {
                icons.init();

                this.stageManager = new StageManager();
                this.stageManager.add(new WorldStage(this));
                this.stageManager.add(new KodeStage(this));

                this.switchTo(WorldStage.ID);

                forever(() => this.update());
            }, 1);
        }

        public switchTo(name: string, args?: any) {
            this.stageManager.activate(name, args);
        }

        update() {
            this.stageManager.update();
        }
    }
}
