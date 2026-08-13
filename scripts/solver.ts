// scripts/solver.ts
// Enterprise TypeScript Implementation with Full Type Safety

interface Position {
    x: number;
    y: number;
}

interface TourSolution {
    start: Position;
    path: Position[];
    moveCount: number;
    executionTime: number;
}

interface SolverConfig {
    width: number;
    height: number;
    maxWorkers?: number;
    enableMemoization?: boolean;
    useWarnsdorffHeuristic?: boolean;
}

class KnightTourSolverTS {
    private readonly width: number;
    private readonly height: number;
    private readonly totalSquares: number;
    private readonly moves: ReadonlyArray<readonly [number, number]>;
    private readonly memoizationCache: Map<string, boolean>;
    private readonly enableMemoization: boolean;
    private readonly useWarnsdorffHeuristic: boolean;
    
    constructor(config: SolverConfig) {
        this.width = config.width;
        this.height = config.height;
        this.totalSquares = config.width * config.height;
        this.moves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ] as const;
        this.memoizationCache = new Map<string, boolean>();
        this.enableMemoization = config.enableMemoization ?? true;
        this.useWarnsdorffHeuristic = config.useWarnsdorffHeuristic ?? true;
    }
    
    private isValidMove(x: number, y: number, board: number[][]): boolean {
        return x >= 0 && x < this.width && 
               y >= 0 && y < this.height && 
               board[y][x] === -1;
    }
    
    private getDegree(x: number, y: number, board: number[][]): number {
        return this.moves.reduce((count, [dx, dy]) => {
            return count + (this.isValidMove(x + dx, y + dy, board) ? 1 : 0);
        }, 0);
    }
    
    private createCacheKey(x: number, y: number, moveCount: number, board: number[][]): string {
        return `${x},${y},${moveCount},${JSON.stringify(board)}`;
    }
    
    private solveRecursive(
        x: number, 
        y: number, 
        moveCount: number, 
        board: number[][], 
        path: Position[]
    ): boolean {
        if (moveCount === this.totalSquares) {
            return true;
        }
        
        const cacheKey = this.createCacheKey(x, y, moveCount, board);
        if (this.enableMemoization && this.memoizationCache.has(cacheKey)) {
            return this.memoizationCache.get(cacheKey)!;
        }
        
        const possibleMoves: Array<[number, Position]> = [];
        
        for (const [dx, dy] of this.moves) {
            const nx = x + dx;
            const ny = y + dy;
            if (this.isValidMove(nx, ny, board)) {
                const degree = this.useWarnsdorffHeuristic ? 
                    this.getDegree(nx, ny, board) : 0;
                possibleMoves.push([degree, { x: nx, y: ny }]);
            }
        }
        
        if (this.useWarnsdorffHeuristic) {
            possibleMoves.sort((a, b) => a[0] - b[0]);
        }
        
        for (const [, nextPos] of possibleMoves) {
            const { x: nx, y: ny } = nextPos;
            board[ny][nx] = moveCount;
            path.push(nextPos);
            
            if (this.solveRecursive(nx, ny, moveCount + 1, board, path)) {
                if (this.enableMemoization) {
                    this.memoizationCache.set(cacheKey, true);
                }
                return true;
            }
            
            path.pop();
            board[ny][nx] = -1;
        }
        
        if (this.enableMemoization) {
            this.memoizationCache.set(cacheKey, false);
        }
        return false;
    }
    
    public solve(startX: number, startY: number): TourSolution | null {
        const board: number[][] = Array.from(
            { length: this.height }, 
            () => Array(this.width).fill(-1)
        );
        const path: Position[] = [{ x: startX, y: startY }];
        board[startY][startX] = 0;
        
        const startTime = performance.now();
        const success = this.solveRecursive(startX, startY, 1, board, path);
        const executionTime = performance.now() - startTime;
        
        if (success) {
            return {
                start: { x: startX, y: startY },
                path,
                moveCount: path.length,
                executionTime
            };
        }
        
        return null;
    }
    
    public findAllSolutions(): {
        solutions: TourSolution[];
        totalStarts: number;
        successfulStarts: number;
        completionRate: number;
    } {
        const solutions: TourSolution[] = [];
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const solution = this.solve(x, y);
                if (solution) {
                    solutions.push(solution);
                }
            }
        }
        
        const totalStarts = this.width * this.height;
        const successfulStarts = solutions.length;
        
        return {
            solutions,
            totalStarts,
            successfulStarts,
            completionRate: (successfulStarts / totalStarts) * 100
        };
    }
}

// Export for use in main application
export { KnightTourSolverTS, TourSolution, Position, SolverConfig };
