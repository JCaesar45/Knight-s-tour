// backend/KnightTour.java
// Enterprise Java Implementation with Spring Boot Integration

package com.premium.knighttour;

import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Service
public class KnightTourService {
    
    private static final int[][] KNIGHT_MOVES = {
        {-2, -1}, {-2, 1}, {-1, -2}, {-1, 2},
        {1, -2}, {1, 2}, {2, -1}, {2, 1}
    };
    
    private final ExecutorService executorService;
    private final TourCache tourCache;
    
    public KnightTourService() {
        this.executorService = Executors.newFixedThreadPool(
            Runtime.getRuntime().availableProcessors()
        );
        this.tourCache = new TourCache();
    }
    
    @Cacheable("knightTours")
    public TourResult computeTour(int width, int height) {
        List<Position> startPositions = generateStartPositions(width, height);
        List<CompletableFuture<Optional<TourPath>>> futures = new ArrayList<>();
        
        for (Position start : startPositions) {
            CompletableFuture<Optional<TourPath>> future = 
                CompletableFuture.supplyAsync(() -> 
                    solveFromStart(start, width, height), 
                    executorService
                );
            futures.add(future);
        }
        
        List<TourPath> successfulTours = futures.stream()
            .map(CompletableFuture::join)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toList());
        
        return new TourResult.Builder()
            .totalStarts(startPositions.size())
            .successfulStarts(successfulTours.size())
            .tours(successfulTours)
            .build();
    }
    
    private Optional<TourPath> solveFromStart(Position start, int width, int height) {
        int[][] board = new int[height][width];
        for (int[] row : board) {
            Arrays.fill(row, -1);
        }
        
        List<Position> path = new ArrayList<>();
        board[start.y][start.x] = 0;
        path.add(start);
        
        long startTime = System.nanoTime();
        boolean success = backtrack(start.x, start.y, 1, board, path, width, height);
        long executionTime = (System.nanoTime() - startTime) / 1_000_000;
        
        if (success) {
            return Optional.of(new TourPath(start, path, executionTime));
        }
        return Optional.empty();
    }
    
    private boolean backtrack(
        int x, int y, int moveCount, 
        int[][] board, List<Position> path, 
        int width, int height
    ) {
        if (moveCount == width * height) {
            return true;
        }
        
        List<MoveOption> possibleMoves = getPossibleMoves(x, y, board, width, height);
        possibleMoves.sort(Comparator.comparingInt(m -> m.degree));
        
        for (MoveOption move : possibleMoves) {
            board[move.position.y][move.position.x] = moveCount;
            path.add(move.position);
            
            if (backtrack(
                move.position.x, move.position.y, 
                moveCount + 1, board, path, width, height
            )) {
                return true;
            }
            
            path.remove(path.size() - 1);
            board[move.position.y][move.position.x] = -1;
        }
        
        return false;
    }
    
    private List<MoveOption> getPossibleMoves(
        int x, int y, int[][] board, int width, int height
    ) {
        List<MoveOption> moves = new ArrayList<>();
        
        for (int[] move : KNIGHT_MOVES) {
            int nx = x + move[0];
            int ny = y + move[1];
            
            if (isValidMove(nx, ny, board, width, height)) {
                int degree = getDegree(nx, ny, board, width, height);
                moves.add(new MoveOption(new Position(nx, ny), degree));
            }
        }
        
        return moves;
    }
    
    private boolean isValidMove(int x, int y, int[][] board, int width, int height) {
        return x >= 0 && x < width && y >= 0 && y < height && board[y][x] == -1;
    }
    
    private int getDegree(int x, int y, int[][] board, int width, int height) {
        int count = 0;
        for (int[] move : KNIGHT_MOVES) {
            if (isValidMove(x + move[0], y + move[1], board, width, height)) {
                count++;
            }
        }
        return count;
    }
    
    private List<Position> generateStartPositions(int width, int height) {
        List<Position> positions = new ArrayList<>();
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                positions.add(new Position(x, y));
            }
        }
        return positions;
    }
    
    // Data classes
    private static class Position {
        final int x;
        final int y;
        
        Position(int x, int y) {
            this.x = x;
            this.y = y;
        }
    }
    
    private static class MoveOption {
        final Position position;
        final int degree;
        
        MoveOption(Position position, int degree) {
            this.position = position;
            this.degree = degree;
        }
    }
    
    public static class TourPath {
        final Position start;
        final List<Position> path;
        final long executionTime;
        
        TourPath(Position start, List<Position> path, long executionTime) {
            this.start = start;
            this.path = path;
            this.executionTime = executionTime;
        }
    }
    
    public static class TourResult {
        final int totalStarts;
        final int successfulStarts;
        final List<TourPath> tours;
        
        private TourResult(Builder builder) {
            this.totalStarts = builder.totalStarts;
            this.successfulStarts = builder.successfulStarts;
            this.tours = builder.tours;
        }
        
        static class Builder {
            int totalStarts;
            int successfulStarts;
            List<TourPath> tours;
            
            Builder totalStarts(int totalStarts) {
                this.totalStarts = totalStarts;
                return this;
            }
            
            Builder successfulStarts(int successfulStarts) {
                this.successfulStarts = successfulStarts;
                return this;
            }
            
            Builder tours(List<TourPath> tours) {
                this.tours = tours;
                return this;
            }
            
            TourResult build() {
                return new TourResult(this);
            }
        }
    }
}

class TourCache {
    private final Map<String, TourResult> cache;
    private final int MAX_CACHE_SIZE = 100;
    
    TourCache() {
        this.cache = new LinkedHashMap<String, TourResult>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, TourResult> eldest) {
                return size() > MAX_CACHE_SIZE;
            }
        };
    }
    
    public synchronized TourResult get(String key) {
        return cache.get(key);
    }
    
    public synchronized void put(String key, TourResult result) {
        cache.put(key, result);
    }
}
