export class Spring {
    constructor(initialValue = 0, stiffness = 0.1, damping = 0.8) {
        this.value = initialValue;
        this.target = initialValue;
        this.velocity = 0;
        this.stiffness = stiffness;
        this.damping = damping;
    }

    update() {
        const force = (this.target - this.value) * this.stiffness;
        this.velocity += force;
        this.velocity *= this.damping;
        this.value += this.velocity;

        if (Math.abs(this.value - this.target) < 0.001 && Math.abs(this.velocity) < 0.001) {
            this.value = this.target;
            this.velocity = 0;
        }
    }

    setTarget(newTarget) {
        this.target = newTarget;
    }

    getValue() {
        return this.value;
    }

        isAtRest() {
        return Math.abs(this.value - this.target) < 0.001 && Math.abs(this.velocity) < 0.001;
    }
} 