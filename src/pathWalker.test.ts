import { describe, it, expect } from 'vitest';
import { walkPath, isValidChar, isLetter } from './pathWalker';

describe('Path Walker', () => {
    it('should validate characters correctly', () => {
        expect(isValidChar('@')).toBe(true);
        expect(isValidChar('x')).toBe(true);
        expect(isValidChar('A')).toBe(true);
        expect(isValidChar('+')).toBe(true);
        expect(isValidChar('-')).toBe(true);
        expect(isValidChar('|')).toBe(true);
        expect(isValidChar('a')).toBe(false);
        expect(isValidChar(' ')).toBe(false);
    });

    it('should identify letters correctly', () => {
        expect(isLetter('A')).toBe(true);
        expect(isLetter('Z')).toBe(true);
        expect(isLetter('@')).toBe(false);
        expect(isLetter('+')).toBe(false);
    });

    describe('Example Maps', () => {
        it('should solve the basic example', () => {
            const map = [
                '  @---A---+',
                '          |',
                '  x-B-+   C',
                '      |   |',
                '      +---+'
            ].map(line => line.split(''));

            const result = walkPath(map);
            expect(result.letters).toBe('ACB');
            expect(result.path).toBe('@---A---+|C|+---+|+-B-x');
        });

        it('should go straight through intersections', () => {
            const map = [
                '  @',
                '  | +-C--+',
                '  A |    |',
                '  +---B--+',
                '    |      x',
                '    |      |',
                '    +---D--+'
            ].map(line => line.split(''));

            const result = walkPath(map);
            expect(result.letters).toBe('ABCD');
            expect(result.path).toBe('@|A+---B--+||+--C-+|||+---D--+|x');
        });

        it('should collect letters on turns', () => {
            const map = [
                '  @---A---+',
                '          |',
                '  x-B-+   |',
                '      |   |',
                '      +---C'
            ].map(line => line.split(''));

            const result = walkPath(map);
            expect(result.letters).toBe('ACB');
            expect(result.path).toBe('@---A---+|||C---+|+-B-x');
        });

        it('should not collect letters from same location twice', () => {
            const map = [
                '     +-O-N-+',
                '     |     |',
                '     |   +-I-+',
                ' @-G-O-+ | | |',
                '     | | +-+ E',
                '     +-+     S',
                '             |',
                '             x'
            ].map(line => line.split(''));

            const result = walkPath(map);
            expect(result.letters).toBe('GOONIES');
            expect(result.path).toBe('@-G-O-+|+-+|O||+-O-N-+|I|+-+|+-I-+|ES|x');
        });

        it('should keep direction in compact space', () => {
            const map = [
                ' +-L-+',
                ' |  +A-+',
                '@B+ ++ H',
                ' ++    x'
            ].map(line => line.split(''));

            const result = walkPath(map);
            expect(result.letters).toBe('BLAH');
            expect(result.path).toBe('@B+++B|+-L-+A+++A-+Hx');
        });

        it('should ignore stuff after end of path', () => {
            const map = [
                '  @-A--+',
                '       |',
                '       +-B--x-C--D'
            ].map(line => line.split(''));

            const result = walkPath(map);
            expect(result.letters).toBe('AB');
            expect(result.path).toBe('@-A--+|+-B--x');
        });
    });

    describe('Invalid Maps', () => {
        it('should throw error for missing start character', () => {
            const map = [
                '     -A---+',
                '          |',
                '  x-B-+   C',
                '      |   |',
                '      +---+'
            ].map(line => line.split(''));

            expect(() => walkPath(map)).toThrow('Start position (@) not found');
        });

        it('should throw error for missing end character', () => {
            const map = [
                '   @--A---+',
                '          |',
                '    B-+   C',
                '      |   |',
                '      +---+'
            ].map(line => line.split(''));

            expect(() => walkPath(map)).toThrow();
        });

        it('should throw error for multiple starts', () => {
            const map = [
                '   @--A-@-+',
                '          |',
                '  x-B-+   C',
                '      |   |',
                '      +---+'
            ].map(line => line.split(''));

            expect(() => walkPath(map)).toThrow();
        });

        it('should throw error for fork in path', () => {
            const map = [
                '        x-B',
                '          |',
                '   @--A---+',
                '          |',
                '     x+   C',
                '      |   |',
                '      +---+'
            ].map(line => line.split(''));

            expect(() => walkPath(map)).toThrow();
        });
    });
}); 