namespace kodu {
    export class Component {
        asleep: boolean;
        constructor(public stage: Stage, public kind: string) {
            this.asleep = false;
            this.stage.add(this);
        }
        update() {}
        sleep() {
            this.asleep = true;
        }
        wake() {
            this.asleep = false;
        }
        notify(event: string, parm: any) {}
    }
}
