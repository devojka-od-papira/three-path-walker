// Types for the path walker
export type Position = {
    x: number;
    y: number;
};

export type Direction = 'up' | 'down' | 'left' | 'right';

export type Map = string[][];

export type PathResult = {
    letters: string;
    path: string;
};

// Constants
export const START_CHAR = '@';
export const END_CHAR = 'x';
export const VALID_CHARS = /^[A-Z+\-|]$/;
export const LETTERS = /^[A-Z]$/;

// Helper functions
export function isValidChar(char: string): boolean {
    return VALID_CHARS.test(char) || char === START_CHAR || char === END_CHAR;
}

export function isLetter(char: string): boolean {
    return LETTERS.test(char);
}

function isPositionValid(map: Map, pos: Position): boolean {
    return pos.y >= 0 && pos.y < map.length && 
           pos.x >= 0 && pos.x < map[pos.y].length;
}

function getCharAtPosition(map: Map, pos: Position): string | null {
    if (!isPositionValid(map, pos)) {
        return null;
    }
    return map[pos.y][pos.x];
}

function findStartPosition(map: Map): Position {
    let startPos: Position | null = null;
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === START_CHAR) {
                if (startPos) {
                    throw new Error('Multiple start positions found');
                }
                startPos = { x, y };
            }
        }
    }
    if (!startPos) {
        throw new Error('Start position (@) not found');
    }
    return startPos;
}

function getNextPosition(pos: Position, direction: Direction): Position {
    switch (direction) {
        case 'up': return { x: pos.x, y: pos.y - 1 };
        case 'down': return { x: pos.x, y: pos.y + 1 };
        case 'left': return { x: pos.x - 1, y: pos.y };
        case 'right': return { x: pos.x + 1, y: pos.y };
    }
}

function getInitialDirection(map: Map, startPos: Position): Direction {
    const directions: Direction[] = ['up', 'down', 'left', 'right'];
    for (const direction of directions) {
        const nextPos = getNextPosition(startPos, direction);
        const nextChar = getCharAtPosition(map, nextPos);
        if (nextChar && (nextChar === '-' || nextChar === '|' || nextChar === '+' || LETTERS.test(nextChar))) {
            return direction;
        }
    }
    throw new Error('No valid path found from start position');
}

function isValidPathChar(char: string | null, direction: Direction): boolean {
    if (!char) return false;
    if (LETTERS.test(char)) return true;
    if (char === '+' || char === END_CHAR) return true;
    if (direction === 'left' || direction === 'right') return char === '-';
    if (direction === 'up' || direction === 'down') return char === '|';
    return false;
}

function canContinueInDirection(map: Map, pos: Position, direction: Direction): boolean {
    const nextPos = getNextPosition(pos, direction);
    const nextChar = getCharAtPosition(map, nextPos);
    return isValidPathChar(nextChar, direction);
}

function getNextDirection(map: Map, currentPos: Position, currentDirection: Direction): Direction {
    const currentChar = getCharAtPosition(map, currentPos);
    if (!currentChar) {
        throw new Error('Invalid position');
    }
    
    // If we're at a turn (+), we need to find the new direction
    if (currentChar === '+') {
        // First, try to continue in the same direction if possible
        if (canContinueInDirection(map, currentPos, currentDirection)) {
            return currentDirection;
        }

        // If we can't continue in the same direction, try other valid directions
        const possibleDirections: Direction[] = ['up', 'down', 'left', 'right'];
        for (const direction of possibleDirections) {
            // Skip the opposite direction
            if ((direction === 'up' && currentDirection === 'down') ||
                (direction === 'down' && currentDirection === 'up') ||
                (direction === 'left' && currentDirection === 'right') ||
                (direction === 'right' && currentDirection === 'left')) {
                continue;
            }
            
            if (canContinueInDirection(map, currentPos, direction)) {
                return direction;
            }
        }
        throw new Error('No valid turn found at +');
    }
    
    return currentDirection;
}

function validateMap(map: Map): void {
    let startCount = 0;
    let endCount = 0;
    
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const char = map[y][x];
            if (char === START_CHAR) startCount++;
            if (char === END_CHAR) endCount++;
            if (char !== ' ' && !isValidChar(char)) {
                throw new Error(`Invalid character '${char}' found at position (${x}, ${y})`);
            }
        }
    }
    
    if (startCount === 0) throw new Error('Start position (@) not found');
    if (startCount > 1) throw new Error('Multiple start positions found');
    if (endCount === 0) throw new Error('End position (x) not found');
}

// Main path walker function
export function walkPath(map: Map): PathResult {
    validateMap(map);
    
    const startPos = findStartPosition(map);
    let currentPos = startPos;
    let currentDirection = getInitialDirection(map, startPos);
    let letters = '';
    let path = START_CHAR;
    let visitedPositions = new Set<string>();
    let steps = 0;
    const maxSteps = 1000; // Prevent infinite loops
    
    while (steps < maxSteps) {
        steps++;
        const nextPos = getNextPosition(currentPos, currentDirection);
        const nextChar = getCharAtPosition(map, nextPos);
        
        // If we hit a wall or invalid character, try to find a turn
        if (!isValidPathChar(nextChar, currentDirection)) {
            throw new Error('Path leads to invalid position');
        }
        
        // At this point, nextChar is guaranteed to be a valid path character
        currentPos = nextPos;
        path += nextChar!; // We can safely assert nextChar is not null here
        
        if (isLetter(nextChar!)) {
            const posKey = `${currentPos.x},${currentPos.y}`;
            if (!visitedPositions.has(posKey)) {
                letters += nextChar;
                visitedPositions.add(posKey);
            }
        }
        
        if (nextChar === END_CHAR) {
            break;
        }
        
        // Get the next direction before moving
        currentDirection = getNextDirection(map, currentPos, currentDirection);
    }
    
    if (steps >= maxSteps) {
        throw new Error('Maximum steps exceeded - possible infinite loop');
    }
    
    return { letters, path };
} 