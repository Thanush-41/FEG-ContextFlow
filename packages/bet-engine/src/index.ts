export type BetLeg = { odds: number; status?: 'active' | 'void' };
export type BetMode = 'single' | 'accumulator' | 'system';
export type BetCalculationInput = {
  legs: BetLeg[];
  stakeMinorUnits: number;
  mode: BetMode;
  systemSize?: number;
  boostPercent?: number;
  feeBasisPoints?: number;
  taxBasisPoints?: number;
};
export type BetCalculation = {
  lines: number;
  totalOdds: number;
  stakeMinorUnits: number;
  grossReturnMinorUnits: number;
  bonusMinorUnits: number;
  feeMinorUnits: number;
  taxMinorUnits: number;
  potentialReturnMinorUnits: number;
};

const roundOdds = (value: number) => Number(value.toFixed(4));
const product = (legs: BetLeg[]) => legs.reduce((total, leg) => total * (leg.status === 'void' ? 1 : leg.odds), 1);

function combinations<T>(values: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (values.length < size) return [];
  return values.flatMap((value, index) => combinations(values.slice(index + 1), size - 1).map(rest => [value, ...rest]));
}

export function calculateBet(input: BetCalculationInput): BetCalculation {
  if (!Number.isSafeInteger(input.stakeMinorUnits) || input.stakeMinorUnits < 0) throw new Error('INVALID_STAKE');
  if (!input.legs.length || input.legs.some(leg => !Number.isFinite(leg.odds) || leg.odds < 1.01)) throw new Error('INVALID_ODDS');
  const mode = input.mode;
  const active = input.legs.filter(leg => leg.status !== 'void');
  let lineOdds: number[];
  if (mode === 'single') lineOdds = input.legs.map(leg => product([leg]));
  else if (mode === 'accumulator') lineOdds = [product(input.legs)];
  else {
    const size = input.systemSize ?? Math.max(1, active.length - 1);
    if (!Number.isInteger(size) || size < 1 || size > input.legs.length) throw new Error('INVALID_SYSTEM_SIZE');
    lineOdds = combinations(input.legs, size).map(product);
  }
  const lines = lineOdds.length;
  const baseLineStake = Math.floor(input.stakeMinorUnits / lines);
  const remainder = input.stakeMinorUnits - baseLineStake * lines;
  const grossReturnMinorUnits = lineOdds.reduce((sum, odds, index) => sum + Math.round((baseLineStake + (index < remainder ? 1 : 0)) * odds), 0);
  const profit = Math.max(0, grossReturnMinorUnits - input.stakeMinorUnits);
  const bonusMinorUnits = Math.round(profit * (input.boostPercent ?? 0) / 100);
  const feeMinorUnits = Math.round(input.stakeMinorUnits * (input.feeBasisPoints ?? 0) / 10_000);
  const taxable = Math.max(0, grossReturnMinorUnits + bonusMinorUnits - input.stakeMinorUnits - feeMinorUnits);
  const taxMinorUnits = Math.round(taxable * (input.taxBasisPoints ?? 0) / 10_000);
  return {
    lines,
    totalOdds: roundOdds(mode === 'single' ? lineOdds.reduce((sum, odds) => sum + odds, 0) : product(input.legs)),
    stakeMinorUnits: input.stakeMinorUnits,
    grossReturnMinorUnits,
    bonusMinorUnits,
    feeMinorUnits,
    taxMinorUnits,
    potentialReturnMinorUnits: Math.max(0, grossReturnMinorUnits + bonusMinorUnits - feeMinorUnits - taxMinorUnits),
  };
}
