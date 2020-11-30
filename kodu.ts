namespace app {
    export class Kodu {
        stageManager: StageManager;

        public cursorSpeed = 3;
        public cameraStep = 3;

        constructor() {
            // One interval delay to ensure all static constructors have executed.
            setTimeout(() => {
                this.stageManager = new StageManager();
                this.stageManager.add(new WorldStage(this));
                this.stageManager.add(new KodeStage(this));

                this.stageManager.activate("world");

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
