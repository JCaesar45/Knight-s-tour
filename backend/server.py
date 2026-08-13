# backend/server.py
# Knight's Tour Premium Backend Service
# Production-grade API with enterprise-level optimization

from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import List, Tuple, Optional, Dict
import numpy as np
import time
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor
import redis
import json

app = Flask(__name__)
CORS(app)

@dataclass
class TourResult:
    start_position: Tuple[int, int]
    path: List[Tuple[int, int]]
    moves_count: int
    execution_time: float

class KnightTourEngine:
    def __init__(self, width: int, height: int):
        self.width = width
        self.height = height
        self.total_squares = width * height
        self.moves = [
            (-2, -1), (-2, 1), (-1, -2), (-1, 2),
            (1, -2), (1, 2), (2, -1), (2, 1)
        ]
        self.memoization_cache = {}
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
        
    def is_valid_move(self, x: int, y: int, board: np.ndarray) -> bool:
        return (0 <= x < self.width and 
                0 <= y < self.height and 
                board[y][x] == -1)
    
    def get_degree(self, x: int, y: int, board: np.ndarray) -> int:
        return sum(1 for dx, dy in self.moves 
                  if self.is_valid_move(x + dx, y + dy, board))
    
    def solve_tour(self, start_x: int, start_y: int) -> Optional[List[Tuple[int, int]]]:
        board = np.full((self.height, self.width), -1)
        board[start_y][start_x] = 0
        path = [(start_x, start_y)]
        
        def backtrack(x: int, y: int, move_count: int) -> bool:
            if move_count == self.total_squares:
                return True
            
            # Cache key for memoization
            cache_key = f"{x},{y},{move_count},{board.tobytes().hex()}"
            if cache_key in self.memoization_cache:
                return self.memoization_cache[cache_key]
            
            # Generate and sort moves by Warnsdorff's heuristic
            possible_moves = []
            for dx, dy in self.moves:
                nx, ny = x + dx, y + dy
                if self.is_valid_move(nx, ny, board):
                    degree = self.get_degree(nx, ny, board)
                    possible_moves.append((degree, nx, ny))
            
            possible_moves.sort(key=lambda m: m[0])  # Sort by degree
            
            for _, nx, ny in possible_moves:
                board[ny][nx] = move_count
                path.append((nx, ny))
                
                if backtrack(nx, ny, move_count + 1):
                    self.memoization_cache[cache_key] = True
                    return True
                
                path.pop()
                board[ny][nx] = -1
            
            self.memoization_cache[cache_key] = False
            return False
        
        start_time = time.time()
        success = backtrack(start_x, start_y, 1)
        execution_time = time.time() - start_time
        
        if success:
            return path
        return None
    
    def find_all_solutions_parallel(self) -> Dict:
        start_positions = [(x, y) for y in range(self.height) 
                          for x in range(self.width)]
        results = []
        
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = []
            for start_x, start_y in start_positions:
                future = executor.submit(self.solve_tour, start_x, start_y)
                futures.append((future, (start_x, start_y)))
            
            for future, (start_x, start_y) in futures:
                path = future.result()
                if path:
                    results.append({
                        'start': [start_x, start_y],
                        'path': path,
                        'moves': len(path)
                    })
        
        return {
            'total_starts': len(start_positions),
            'successful_starts': len(results),
            'solutions': results,
            'completion_rate': (len(results) / len(start_positions)) * 100
        }

@app.route('/api/tour', methods=['POST'])
def compute_tour():
    data = request.json
    width = data.get('width', 6)
    height = data.get('height', 6)
    
    engine = KnightTourEngine(width, height)
    results = engine.find_all_solutions_parallel()
    
    return jsonify(results)

@app.route('/api/tour/stream', methods=['POST'])
def stream_tour():
    """Stream results as they're computed for real-time visualization"""
    from flask import Response
    
    data = request.json
    width = data.get('width', 6)
    height = data.get('height', 6)
    
    engine = KnightTourEngine(width, height)
    
    def generate():
        start_positions = [(x, y) for y in range(height) 
                          for x in range(width)]
        
        for start_x, start_y in start_positions:
            path = engine.solve_tour(start_x, start_y)
            if path:
                yield f"data: {json.dumps({'start': [start_x, start_y], 'path': path})}\n\n"
            yield f"data: {json.dumps({'progress': True})}\n\n"
        
        yield f"data: {json.dumps({'complete': True})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
