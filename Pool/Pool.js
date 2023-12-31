import Ball from "./Models/Ball.js";

const ballRadius = 0.035;
const tableLength = 2.14;
const distanceToVelocity = 30;
const maximumShotRadius = 50;

class Pool {
    constructor() {
        this.canvas = document.getElementById("poolPlayArea");
        this.context = this.canvas.getContext("2d");
        this.width = this.context.canvas.width;
        this.height = this.context.canvas.height;

        this.createEventListeners();

        this.cueBall = new Ball(this.width / 5, this.height / 2);

        this.isMouseDown = false;
        this.isGamePlaying = false;

        this.mousePosition = {
            'x': 0,
            'y': 0,
        };

        this.render();
    }

    getConversionFactor() {
        return this.width / tableLength;
    }

    createEventListeners() {
        this.canvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.canvas.addEventListener('mousedown', (event) => this.handleMouseDown(event));
        this.canvas.addEventListener('mouseup', (event) => this.handleMouseUp(event));
    }

    handleMouseMove(event) {
        if (this.isGamePlaying) return;

        this.mousePosition = this.getMousePosition(event);

        if (this.isMouseInsideCueBall()) {
            this.cueBall.fillStyle = 'grey';
        }
        else {
            this.cueBall.fillStyle = 'white';
        }

        this.render();
    }

    handleMouseDown(event) {
        if (this.isGamePlaying) return;
        if (this.isMouseDown) return;

        this.isMouseDown = this.isMouseInsideCueBall();
    }

    handleMouseUp(event) {
        if (this.isGamePlaying) return;

        if (!this.isMouseDown) return;

        this.isMouseDown = false;
        this.isGamePlaying = true;

        const playerStrokePosition = this.getPlayerStrokePosition();
        const distanceX = playerStrokePosition.x - this.cueBall.x;
        const distanceY = playerStrokePosition.y - this.cueBall.y;

        this.cueBall.u = -distanceX * distanceToVelocity;
        this.cueBall.v = -distanceY * distanceToVelocity;
        
        this.startGamePlay();
    }

    isMouseInsideCueBall() {
        return this.getMouseToBallDistance() < this.getConversionFactor() * ballRadius;
    }

    getMouseToBallDistance() {
        const distanceX = this.mousePosition.x - this.cueBall.x;
        const distanceY = this.mousePosition.y - this.cueBall.y;
        return Math.sqrt(distanceX * distanceX + distanceY * distanceY);
    }

    getMousePosition(event) {
        const target = event.target;
        const rect = target.getBoundingClientRect();

        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const mouseX = (event.clientX - rect.left) * scaleX;
        const mouseY = (event.clientY - rect.top) * scaleY;

        return {
            'x': mouseX,
            'y': mouseY,
        };
    }

    startGamePlay() {
        const dt = 50; // ms
        let a = this;
        let timer = setInterval(() => {
            this.updateGameState(dt / 1000);
            this.render();
            if (!this.isGamePlaying) clearInterval(timer);
        }, dt);
    }

    updateGameState(dt) {
        const canvasRadius = ballRadius * this.getConversionFactor();

        this.cueBall.x += this.cueBall.u * dt;
        this.cueBall.y += this.cueBall.v * dt;

        if (this.cueBall.x - canvasRadius < 0) {
            this.cueBall.x = canvasRadius;
            this.cueBall.u = -this.cueBall.u;
        }
        else if (this.cueBall.x + canvasRadius > this.canvas.width) {
            this.cueBall.x = this.canvas.width - canvasRadius;
            this.cueBall.u = -this.cueBall.u;
        }

        if (this.cueBall.y - canvasRadius < 0) {
            this.cueBall.y = canvasRadius;
            this.cueBall.v = -this.cueBall.v;
        }
        else if (this.cueBall.y + canvasRadius > this.canvas.height) {
            this.cueBall.y = this.canvas.height - canvasRadius;
            this.cueBall.v = -this.cueBall.v;
        }

        const totalVelocity = Math.sqrt(this.cueBall.u * this.cueBall.u + this.cueBall.v * this.cueBall.v);
        if (totalVelocity < 1) {
            this.cueBall.u = 0;
            this.cueBall.v = 0;

            this.isGamePlaying = false;
            return;
        }
        this.cueBall.includeDrag();
    }

    render() {
        this.context.clearRect(0, 0, this.width, this.height);

        const renderRadius = ballRadius * this.getConversionFactor();

        this.cueBall.render(this.context, renderRadius);

        if (this.isMouseDown) {
            this.renderAimingLine();
            this.renderAimingRadius();
        }
    }

    renderAimingLine() {
        const playerStrokePosition = this.getPlayerStrokePosition();

        this.context.beginPath();

        this.context.strokeStyle = "black";
        this.context.lineWidth = 1;
        this.context.moveTo(this.cueBall.x, this.cueBall.y);
        this.context.lineTo(playerStrokePosition.x, playerStrokePosition.y);
        this.context.stroke();

        this.context.closePath();
    }

    getPlayerStrokePosition() {
        const distance = this.getMouseToBallDistance();

        if (distance < maximumShotRadius) {
            return {
                'x': this.mousePosition.x,
                'y': this.mousePosition.y,
            };
        }

        const dx = this.mousePosition.x - this.cueBall.x;
        const dy = this.mousePosition.y - this.cueBall.y;
        const magnitude = Math.sqrt(dx*dx + dy*dy);

        const normalisedX = this.cueBall.x + dx / magnitude * maximumShotRadius;
        const normalisedY = this.cueBall.y + dy / magnitude * maximumShotRadius;

        return {
            'x': normalisedX,
            'y': normalisedY,
        };
    }

    renderAimingRadius() {
        this.context.beginPath();

        this.context.lineWidth = 0.3;
        this.context.strokStyle = "black";
        this.context.arc(this.cueBall.x, this.cueBall.y, maximumShotRadius, 0, 2 * Math.PI, true);
        this.context.stroke();

        this.context.closePath();
    }
}

let pool = new Pool();