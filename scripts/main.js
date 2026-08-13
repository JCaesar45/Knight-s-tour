// scripts/main.js
// Main Application Controller with State Management

class KnightTourApp {
    constructor() {
        this.solver = null;
        this.visualizer = null;
        this.state = {
            width: 6,
            height: 6,
            isComputing: false,
            currentSolution: null,
            allSolutions: []
        };
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        document.getElementById('computeBtn').addEventListener('click', () => {
            this.computeTour();
        });
        
        document.getElementById('widthInput').addEventListener('change', (e) => {
            this.state.width = parseInt(e.target.value);
        });
        
        document.getElementById('heightInput').addEventListener('change', (e) => {
            this.state.height = parseInt(e.target.value);
        });
        
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportResults();
        });
    }
    
    async computeTour() {
        if (this.state.isComputing) return;
        
        this.state.isComputing = true;
        this.showLoadingIndicator();
        
        try {
            // Use Web Worker for parallel computation
            const worker = new Worker('scripts/worker.js');
            
            worker.postMessage({
                width: this.state.width,
                height: this.state.height
            });
            
            worker.onmessage = (e) => {
                const result = e.data;
                this.state.allSolutions = result.solutions;
                this.state.currentSolution = result.solutions[0];
                
                this.updateResultsDisplay(result);
                this.visualizeFirstSolution();
                
                this.state.isComputing = false;
                this.hideLoadingIndicator();
                worker.terminate();
            };
            
        } catch (error) {
            console.error('Computation failed:', error);
            this.state.isComputing = false;
            this.hideLoadingIndicator();
        }
    }
    
    showLoadingIndicator() {
        document.getElementById('loadingIndicator').style.display = 'block';
    }
    
    hideLoadingIndicator() {
        document.getElementById('loadingIndicator').style.display = 'none';
    }
    
    updateResultsDisplay(result) {
        document.getElementById('totalStarts').textContent = result.totalStarts;
        document.getElementById('successfulStarts').textContent = result.successfulStarts;
        document.getElementById('completionRate').textContent = 
            `${result.completionRate.toFixed(1)}%`;
    }
    
    visualizeFirstSolution() {
        if (this.state.currentSolution) {
            this.visualizer.setBoardDimensions(
                this.state.width, 
                this.state.height
            );
            this.visualizer.animatePath(this.state.currentSolution.path);
        }
    }
    
    exportResults() {
        const data = {
            width: this.state.width,
            height: this.state.height,
            results: this.state.allSolutions,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `knight-tour-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const app = new KnightTourApp();
    window.knightTourApp = app;
});
