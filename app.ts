namespace kodu {
    export class App {
        stageManager: StageManager;
        worldStage: WorldStage;

        public cursorSpeed = 3;

        constructor() {
            // One interval delay to ensure all static constructors have executed.
            setTimeout(() => {
                icons.init();
                initEffects();
                this.stageManager = new StageManager();
                this.worldStage = new WorldStage(this);
                this.pushStage(this.worldStage);
            }, 1);
        }

        public saveProject() {
            this.worldStage.save();
        }

        public pushStage(stage: Stage) {
            this.stageManager.push(stage);
        }

        public popStage() {
            this.stageManager.pop();
        }
    }
}
