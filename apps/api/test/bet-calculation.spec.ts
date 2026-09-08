import { calculateBet } from '@feg/bet-engine';

describe('Sprint 7 golden bet calculations', () => {
  it.each([
    ['single split', { legs: [{ odds: 2 }, { odds: 3 }], stakeMinorUnits: 100, mode: 'single' as const }, { lines: 2, grossReturnMinorUnits: 250, potentialReturnMinorUnits: 250 }],
    ['accumulator boost', { legs: [{ odds: 2 }, { odds: 3 }], stakeMinorUnits: 100, mode: 'accumulator' as const, boostPercent: 5 }, { lines: 1, grossReturnMinorUnits: 600, bonusMinorUnits: 25, potentialReturnMinorUnits: 625 }],
    ['void accumulator leg', { legs: [{ odds: 2 }, { odds: 3, status: 'void' as const }], stakeMinorUnits: 101, mode: 'accumulator' as const }, { totalOdds: 2, grossReturnMinorUnits: 202 }],
    ['three-line system', { legs: [{ odds: 2 }, { odds: 3 }, { odds: 4 }], stakeMinorUnits: 300, mode: 'system' as const, systemSize: 2 }, { lines: 3, grossReturnMinorUnits: 2600 }],
    ['fees tax rounding', { legs: [{ odds: 2 }], stakeMinorUnits: 1000, mode: 'accumulator' as const, feeBasisPoints: 100, taxBasisPoints: 1000 }, { feeMinorUnits: 10, taxMinorUnits: 99, potentialReturnMinorUnits: 1891 }],
    ['minor-unit rounding', { legs: [{ odds: 1.5 }], stakeMinorUnits: 1, mode: 'accumulator' as const }, { grossReturnMinorUnits: 2 }],
  ])('%s', (_name, input, expected) => expect(calculateBet(input)).toEqual(expect.objectContaining(expected)));

  it('rejects invalid odds, stakes, and system boundaries', () => {
    expect(() => calculateBet({ legs: [{ odds: 1 }], stakeMinorUnits: 100, mode: 'single' })).toThrow('INVALID_ODDS');
    expect(() => calculateBet({ legs: [{ odds: 2 }], stakeMinorUnits: -1, mode: 'single' })).toThrow('INVALID_STAKE');
    expect(() => calculateBet({ legs: [{ odds: 2 }], stakeMinorUnits: 100, mode: 'system', systemSize: 2 })).toThrow('INVALID_SYSTEM_SIZE');
  });
});
