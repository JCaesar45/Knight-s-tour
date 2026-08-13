// scripts/worker.js
// Web Worker for Parallel Computation

self.onmessage = function(e) {
    const { width, height } = e.data;
    
    const solver = new KnightTourSolver(width, height);
    const result = solver.computeAllStarts();
    
    self.postMessage(result);
};

class KnightTourSolver {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.totalSquares = width * height;
        this.moves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
    }
    
    computeAllStarts() {
        const solutions = [];
        const startTime = performance.now();
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const board = Array.from(
                    { length: this.height }, 
                    () => Array(this.width).fill(-1)
                );
                const path = [[x, y]];
                board[y][x] = 0;
                
                if (this.solve(x, y, 1, board, path)) {
                    solutions.push({
                        start: [x, y],
                        path: path,
                        moves: path.length
                    });
                }
            }
        }
        
        const executionTime = performance.now() - startTime;
        
        return {
            solutions,
            totalStarts: this.width * this.height,
            successfulStarts: solutions.length,
            completionRate: (solutions.length / (this.width * this.height)) * 100,
            executionTime
        };
    }
    
    solve(x, y, moveCount, board, path) {
        if (moveCount === this.totalSquares) {
            return true;
        }
        
        const possibleMoves = [];
        for (const [dx, dy] of this.moves) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (this.isValid(nx, ny, board)) {
                const degree = this.getDegree(nx, ny, board);
                possibleMoves.push([degree, nx, ny]);
            }
        }
        
        possibleMoves.sort((a, b) => a[0] - b[0]);
        
        for (const [_, nx, ny] of possibleMoves) {
            board[ny][nx] = moveCount;
            path.push([nx, ny]);
            
            if (this.solve(nx, ny, moveCount + 1, board, path)) {
                return true;
            }
            
            path.pop();
            board[ny][nx] = -1;
        }
        
        return false;
    }
    
    isValid(x, y, board) {
        return x >= 0 && x < this.width && 
               y >= 0 && y < this.height && 
               board[y][x] === -1;
    }
    
    getDegree(x, y, board) {
        let count = 0;
        for (const [dx, dy] of this.moves) {
            if (this.isValid(x + dx, y + dy, board)) {
                count++;
            }
        }
        return count;
    }
}
