export class Map2D {
    private container: HTMLElement;
    private map: string[][];
    private cells: HTMLElement[][] = [];
    private collectedLettersDisplay: HTMLElement = document.createElement('div');
    private redArrow: HTMLElement = document.createElement('div');
    private greenArrow: HTMLElement = document.createElement('div');

    constructor(containerId: string, map: string[][]) {
        this.container = document.getElementById(containerId)!;
        this.map = map;
        this.initialize();
    }

    private initialize() {
        // Create collected letters display
        this.collectedLettersDisplay.style.marginBottom = '15px';
        this.collectedLettersDisplay.style.color = '#00ff00';
        this.collectedLettersDisplay.style.fontSize = '20px';
        this.collectedLettersDisplay.style.fontWeight = 'bold';
        this.collectedLettersDisplay.style.textAlign = 'center';
        this.collectedLettersDisplay.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.5)';
        this.collectedLettersDisplay.textContent = 'Collected Letters: ';
        this.container.appendChild(this.collectedLettersDisplay);

        // Create map container
        const mapContainer = document.createElement('div');
        mapContainer.style.display = 'grid';
        mapContainer.style.gridTemplateColumns = `repeat(${this.map[0].length}, 40px)`;
        mapContainer.style.gap = '2px';
        mapContainer.style.backgroundColor = '#1a1a1a';
        mapContainer.style.padding = '15px';
        mapContainer.style.borderRadius = '12px';
        mapContainer.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        this.container.appendChild(mapContainer);

        // Create cells
        for (let y = 0; y < this.map.length; y++) {
            this.cells[y] = [];
            for (let x = 0; x < this.map[y].length; x++) {
                const cell = document.createElement('div');
                cell.style.width = '40px';
                cell.style.height = '40px';
                cell.style.display = 'flex';
                cell.style.alignItems = 'center';
                cell.style.justifyContent = 'center';
                cell.style.fontSize = '20px';
                cell.style.fontWeight = 'bold';
                cell.style.color = '#ffffff';
                cell.style.backgroundColor = '#000000';
                cell.style.border = '1px solid #333333';
                cell.style.borderRadius = '6px';
                cell.style.position = 'relative';
                cell.style.transition = 'all 0.3s ease';
                cell.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.5)';
                cell.textContent = this.map[y][x];
                
                // Style specific characters
                if (this.map[y][x] === '@') {
                    cell.style.color = '#00ff00';
                    cell.style.backgroundColor = '#1a1a1a';
                    cell.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.5)';
                } else if (this.map[y][x] === 'x') {
                    cell.style.color = '#FF9800';
                    cell.style.backgroundColor = '#1a1a1a';
                    cell.style.textShadow = '0 0 5px rgba(255, 152, 0, 0.5)';
                    cell.style.animation = 'pulse 2s infinite';
                } else if (/[A-Z]/.test(this.map[y][x])) {
                    cell.style.color = '#ff0000';
                    cell.style.backgroundColor = '#1a1a1a';
                    cell.style.textShadow = '0 0 5px rgba(255, 0, 0, 0.5)';
                } else if (this.map[y][x] === '-' || this.map[y][x] === '|' || this.map[y][x] === '+') {
                    cell.style.color = '#666666';
                    cell.style.backgroundColor = '#1a1a1a';
                }

                this.cells[y][x] = cell;
                mapContainer.appendChild(cell);
            }
        }

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
            @keyframes glow {
                0% { box-shadow: 0 0 5px rgba(0, 255, 0, 0.5); }
                50% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.8); }
                100% { box-shadow: 0 0 5px rgba(0, 255, 0, 0.5); }
            }
        `;
        document.head.appendChild(style);

        // Create arrows
        this.redArrow = document.createElement('div');
        this.redArrow.style.position = 'absolute';
        this.redArrow.style.width = '0';
        this.redArrow.style.height = '0';
        this.redArrow.style.borderLeft = '10px solid transparent';
        this.redArrow.style.borderRight = '10px solid transparent';
        this.redArrow.style.borderBottom = '20px solid #ff0000';
        this.redArrow.style.transform = 'translate(-50%, -50%)';
        this.redArrow.style.transition = 'transform 0.2s';

        this.greenArrow = document.createElement('div');
        this.greenArrow.style.position = 'absolute';
        this.greenArrow.style.width = '0';
        this.greenArrow.style.height = '0';
        this.greenArrow.style.borderLeft = '10px solid transparent';
        this.greenArrow.style.borderRight = '10px solid transparent';
        this.greenArrow.style.borderBottom = '20px solid #00ff00';
        this.greenArrow.style.transform = 'translate(-50%, -50%)';
        this.greenArrow.style.transition = 'transform 0.2s';

        this.container.appendChild(mapContainer);
    }

    public update(position: { x: number, y: number }, letters: string, path: string, direction: string) {

        // Update collected letters display
        this.collectedLettersDisplay.textContent = `Collected Letters: ${letters.split('').join(' → ')}`;

        // Update cell colors based on path
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const cell = this.cells[y][x];
                const char = this.map[y][x];
                
                // Reset cell style
                cell.style.backgroundColor = '#1a1a1a';
                cell.style.color = '#ffffff';
                cell.style.textShadow = 'none';
                
                // Style based on character type
                if (char === '@') {
                    cell.style.color = '#00ff00';
                    cell.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.5)';
                } else if (char === 'x') {
                    cell.style.color = '#FF9800';
                    cell.style.textShadow = '0 0 5px rgba(255, 152, 0, 0.5)';
                } else if (/[A-Z]/.test(char)) {
                    cell.style.color = '#ff0000';
                    cell.style.textShadow = '0 0 5px rgba(255, 0, 0, 0.5)';
                    if (letters.includes(char)) {
                        cell.style.color = '#00ff00';
                        cell.style.textShadow = '0 0 5px rgba(0, 255, 0, 0.5)';
                    }
                } else if (char === '-' || char === '|' || char === '+') {
                    cell.style.color = '#666666';
                }

                // Highlight current path
                if (path.includes(`${x},${y}`)) {
                    cell.style.backgroundColor = '#333333';
                    cell.style.boxShadow = 'inset 0 0 15px rgba(0, 255, 0, 0.3)';
                }
            }
        }

        // Update arrows
        const currentCell = this.cells[position.y][position.x];
        const arrowRotation = {
            'up': 'rotate(0deg)',
            'right': 'rotate(90deg)',
            'down': 'rotate(180deg)',
            'left': 'rotate(270deg)'
        };

        // Remove old arrows
        this.redArrow.remove();
        this.greenArrow.remove();

        // Add new arrows
        currentCell.appendChild(this.redArrow);
        currentCell.appendChild(this.greenArrow);
        this.redArrow.style.transform = `${arrowRotation[direction as keyof typeof arrowRotation]} translate(-50%, -50%)`;
        this.greenArrow.style.transform = `${arrowRotation[direction as keyof typeof arrowRotation]} translate(-50%, -50%)`;
        this.greenArrow.style.top = '-10px';
    }
} 