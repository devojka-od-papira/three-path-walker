import { Position, Direction, Map } from './pathWalker';

export class VisualPathWalker {
    private map: Map;
    private currentPosition: Position = { x: 0, y: 0 };
    private currentDirection: Direction = 'right';
    private collectedLetters: string = '';
    private path: string = '';
    private visitedPositions: Set<string> = new Set();
    private onUpdate: (position: Position, letters: string, path: string, direction: Direction) => void;
    private onWrongMove: () => void;

    constructor(
        map: Map, 
        onUpdate: (position: Position, letters: string, path: string, direction: Direction) => void,
        onWrongMove: () => void
    ) {
        this.map = map;
        this.onUpdate = onUpdate;
        this.onWrongMove = onWrongMove;
        this.initialize();
    }

    private initialize() {
        // Find start position
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === '@') {
                    this.currentPosition = { x, y };
                    this.path = '@';
                    break;
                }
            }
        }

        // Set initial direction
        this.currentDirection = this.getInitialDirection();
        this.onUpdate(this.currentPosition, this.collectedLetters, this.path, this.currentDirection);
    }

    private getInitialDirection(): Direction {
        const directions: Direction[] = ['up', 'down', 'left', 'right'];
        for (const direction of directions) {
            const nextPos = this.getNextPosition(direction);
            const nextChar = this.getCharAtPosition(nextPos);
            if (nextChar && (nextChar === '-' || nextChar === '|' || nextChar === '+' || /^[A-Z]$/.test(nextChar))) {
                return direction;
            }
        }
        throw new Error('No valid path found from start position');
    }

    private getNextPosition(direction: Direction): Position {
        switch (direction) {
            case 'up': return { x: this.currentPosition.x, y: this.currentPosition.y - 1 };
            case 'down': return { x: this.currentPosition.x, y: this.currentPosition.y + 1 };
            case 'left': return { x: this.currentPosition.x - 1, y: this.currentPosition.y };
            case 'right': return { x: this.currentPosition.x + 1, y: this.currentPosition.y };
        }
    }

    private getCharAtPosition(pos: Position): string | null {
        if (pos.y < 0 || pos.y >= this.map.length || 
            pos.x < 0 || pos.x >= this.map[pos.y].length) {
            return null;
        }
        return this.map[pos.y][pos.x];
    }

    private isValidPathChar(char: string | null, direction: Direction): boolean {
        if (!char) return false;
        if (/^[A-Z]$/.test(char)) return true;
        if (char === '+' || char === 'x') return true;
        if (direction === 'left' || direction === 'right') {
            return char === '-' || char === '+' || /^[A-Z]$/.test(char);
        }
        if (direction === 'up' || direction === 'down') {
            return char === '|' || char === '+' || /^[A-Z]$/.test(char);
        }
        return false;
    }

    private canMoveInDirection(direction: Direction): boolean {
        const nextPos = this.getNextPosition(direction);
        const nextChar = this.getCharAtPosition(nextPos);
        return this.isValidPathChar(nextChar, direction);
    }

    public move(direction: Direction): boolean {
        // Check if the move is valid before attempting it
        if (!this.canMoveInDirection(direction)) {
            this.onWrongMove();
            return false;
        }

        const nextPos = this.getNextPosition(direction);
        const nextChar = this.getCharAtPosition(nextPos);

        this.currentPosition = nextPos;
        this.currentDirection = direction;
        this.path += nextChar!;

        if (/^[A-Z]$/.test(nextChar!)) {
            const posKey = `${this.currentPosition.x},${this.currentPosition.y}`;
            if (!this.visitedPositions.has(posKey)) {
                this.collectedLetters += nextChar;
                this.visitedPositions.add(posKey);
            }
        }

        this.onUpdate(this.currentPosition, this.collectedLetters, this.path, this.currentDirection);
        return nextChar !== 'x';
    }

    public getCurrentState() {
        return {
            position: this.currentPosition,
            letters: this.collectedLetters,
            path: this.path,
            direction: this.currentDirection
        };
    }
} 