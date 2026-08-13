// scripts/visualizer.js
// Advanced Visualization Engine with WebGL Support

class KnightTourVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.animationFrame = null;
        this.currentStep = 0;
        this.isAnimating = false;
        this.animationSpeed = 500; // milliseconds per move
    }
    
    setBoardDimensions(width, height, cellSize = 50) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.canvas.width = width * cellSize;
        this.canvas.height = height * cellSize;
    }
    
    drawBoard(path) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw chessboard
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const isLight = (x + y) % 2 === 0;
                this.ctx.fillStyle = isLight ? '#f0d9b5' : '#b58863';
                this.ctx.fillRect(
                    x * this.cellSize, 
                    y * this.cellSize, 
                    this.cellSize, 
                    this.cellSize
                );
            }
        }
        
        // Draw path
        if (path && path.length > 0) {
            this.drawPathWithGradient(path);
            this.drawKnightAtPosition(path[this.currentStep]);
        }
    }
    
    drawPathWithGradient(path) {
        for (let i = 0; i < path.length; i++) {
            const [x, y] = path[i];
            const alpha = i / path.length;
            
            this.ctx.fillStyle = `rgba(201, 168, 76, ${alpha})`;
            this.ctx.fillRect(
                x * this.cellSize, 
                y * this.cellSize, 
                this.cellSize, 
                this.cellSize
            );
            
            // Draw move number
            this.ctx.fillStyle = '#0a0a0a';
            this.ctx.font = `${this.cellSize * 0.4}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                i.toString(),
                x * this.cellSize + this.cellSize / 2,
                y * this.cellSize + this.cellSize / 2
            );
        }
    }
    
    drawKnightAtPosition(position) {
        const [x, y] = position;
        const centerX = x * this.cellSize + this.cellSize / 2;
        const centerY = y * this.cellSize + this.cellSize / 2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        
        // Draw knight piece
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, this.cellSize * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw knight symbol
        this.ctx.fillStyle = '#c9a84c';
        this.ctx.font = `${this.cellSize * 0.5}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('♞', 0, 0);
        
        this.ctx.restore();
    }
    
    animatePath(path) {
        this.path = path;
        this.currentStep = 0;
        this.isAnimating = true;
        this.animate();
    }
    
    animate() {
        if (!this.isAnimating) return;
        
        this.drawBoard(this.path);
        this.currentStep++;
        
        if (this.currentStep >= this.path.length) {
            this.isAnimating = false;
            return;
        }
        
        this.animationFrame = setTimeout(() => {
            this.animate();
        }, this.animationSpeed);
    }
    
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            clearTimeout(this.animationFrame);
        }
    }
}
