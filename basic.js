function knightTour(width, height) {
    let successfulStarts = 0;
    
    // All possible knight moves
    const moves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    
    function isValid(x, y, board) {
        return x >= 0 && x < width && y >= 0 && y < height && board[y][x] === -1;
    }
    
    function getDegree(x, y, board) {
        let count = 0;
        for (let [dx, dy] of moves) {
            const nx = x + dx, ny = y + dy;
            if (isValid(nx, ny, board)) count++;
        }
        return count;
    }
    
    function solve(x, y, moveCount, board) {
        if (moveCount === width * height) {
            return true;
        }
        
        // Get all possible next moves
        let nextMoves = [];
        for (let [dx, dy] of moves) {
            const nx = x + dx, ny = y + dy;
            if (isValid(nx, ny, board)) {
                nextMoves.push([nx, ny, getDegree(nx, ny, board)]);
            }
        }
        
        // Warnsdorff's heuristic: sort by degree (fewest onward moves first)
        nextMoves.sort((a, b) => a[2] - b[2]);
        
        for (let [nx, ny] of nextMoves) {
            board[ny][nx] = moveCount;
            if (solve(nx, ny, moveCount + 1, board)) {
                return true;
            }
            board[ny][nx] = -1; // Backtrack
        }
        
        return false;
    }
    
    // Try each starting position
    for (let startY = 0; startY < height; startY++) {
        for (let startX = 0; startX < width; startX++) {
            // Initialize board with -1 (unvisited)
            let board = Array.from({length: height}, () => Array(width).fill(-1));
            board[startY][startX] = 0; // Mark starting position
            
            if (solve(startX, startY, 1, board)) {
                successfulStarts++;
            }
        }
    }
    
    return successfulStarts;
}
