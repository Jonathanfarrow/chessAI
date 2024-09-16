class AIVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        // Use the existing canvas instead of creating a new one
        this.canvas = this.container.querySelector('canvas');
        if (!this.canvas) {
            console.error('No canvas found in the container');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        
        this.treeData = null;
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.setupEventListeners();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupEventListeners() {
        this.canvas.addEventListener('wheel', this.handleZoom.bind(this));
        this.canvas.addEventListener('mousedown', this.handlePanStart.bind(this));
        this.canvas.addEventListener('mousemove', this.handlePanMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handlePanEnd.bind(this));
    }

    resizeCanvas() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.render();
    }

    handleZoom(event) {
        event.preventDefault();
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        this.zoom *= zoomFactor;
        this.zoom = Math.max(0.1, Math.min(this.zoom, 5)); // Limit zoom range
        this.render();
    }

    handlePanStart(event) {
        this.isDragging = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    handlePanMove(event) {
        if (!this.isDragging) return;
        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;
        this.offsetX += deltaX / this.zoom;
        this.offsetY += deltaY / this.zoom;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        this.render();
    }

    handlePanEnd(event) {
        this.isDragging = false;
    }

    updateTree(treeData) {
        this.treeData = treeData;
        this.render();
    }

    render() {
        if (!this.ctx || !this.treeData) return;

        // Set black background
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const nodeSpacing = 80 * this.zoom;
        const levelHeight = 100 * this.zoom;
        const startX = this.canvas.width / 2 + this.offsetX;
        const startY = 50 + this.offsetY;

        this.renderNode(this.treeData, startX, startY, nodeSpacing, levelHeight);
    }

    renderNode(node, x, y, spacing, levelHeight) {
        const nodeRadius = 30 * this.zoom;

        // Apply zoom and offset
        const drawX = x * this.zoom + this.offsetX;
        const drawY = y * this.zoom + this.offsetY;

        // Draw node
        this.ctx.beginPath();
        this.ctx.arc(drawX, drawY, nodeRadius, 0, 2 * Math.PI);
        this.ctx.fillStyle = node.isBest ? 'red' : '#4CAF50';  // Highlight best move in red
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';  // White border for contrast
        this.ctx.lineWidth = 2 * this.zoom;
        this.ctx.stroke();

        // Draw label
        this.ctx.fillStyle = 'white';  // White text for visibility on dark background
        this.ctx.font = `${12 * this.zoom}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        if (node.move) {
            const [from, to] = node.move.split('-');
            this.ctx.fillText(`${from} → ${to}`, drawX, drawY - 10 * this.zoom);
            this.ctx.fillText(node.score.toFixed(2), drawX, drawY + 10 * this.zoom);
        } else {
            this.ctx.fillText(node.label || '', drawX, drawY);
        }

        // Draw children
        if (node.children && node.children.length > 0) {
            const childrenWidth = (node.children.length - 1) * spacing;
            let startX = x - childrenWidth / 2;

            node.children.forEach((child, index) => {
                const childX = startX + index * spacing;
                const childY = y + levelHeight;

                // Draw line to child
                this.ctx.beginPath();
                this.ctx.moveTo(drawX, drawY + nodeRadius);
                this.ctx.lineTo(childX * this.zoom + this.offsetX, childY * this.zoom + this.offsetY - nodeRadius);
                this.ctx.strokeStyle = 'white';  // White lines for visibility
                this.ctx.stroke();

                // Render child node
                this.renderNode(child, childX, childY, spacing / 2, levelHeight);
            });
        }
    }
}