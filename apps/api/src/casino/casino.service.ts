import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { CasinoGameSchema, CasinoPlaySchema, CasinoRoundSchema, type CasinoGame, type CasinoRound } from '@feg/contracts';

@Injectable()
export class CasinoService {
  private readonly rounds = new Map<string, number>();
  private readonly commands = new Map<string, CasinoRound>();
  private readonly games: CasinoGame[] = [
    CasinoGameSchema.parse({ id: 'casino-crash-flight', name: 'Sky Crash', type: 'crash', tagline: 'Watch the multiplier climb before the demo flight ends.', volatility: 'high', demoOnly: true }),
    CasinoGameSchema.parse({ id: 'casino-lucky-dice', name: 'Lucky Dice', type: 'dice', tagline: 'Roll two deterministic dice and chase doubles.', volatility: 'low', demoOnly: true }),
    CasinoGameSchema.parse({ id: 'casino-triple-slots', name: 'Triple Pulse', type: 'slots', tagline: 'Spin a fast three-reel neon slot simulation.', volatility: 'medium', demoOnly: true }),
  ];

  list() { return this.games; }

  play(ownerId: string, gameId: string, candidate: unknown): CasinoRound {
    const parsed = CasinoPlaySchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid casino play command.');
    const existing = this.commands.get(`${ownerId}:${parsed.data.idempotencyKey}`);
    if (existing) return existing;
    const game = this.games.find(item => item.id === gameId);
    if (!game) throw new BadRequestException('Unknown demo casino game.');
    const key = `${ownerId}:${gameId}`;
    const round = (this.rounds.get(key) ?? 0) + 1;
    this.rounds.set(key, round);
    const bytes = createHash('sha256').update(`${ownerId}:${gameId}:${round}`).digest();
    const common = { id: `casino-round-${randomUUID()}`, gameId, ownerId, round, createdAt: new Date().toISOString(), demoOnly: true as const };
    let result: CasinoRound;
    if (game.type === 'crash') {
      const multiplier = Number((1.05 + (bytes.readUInt8(0) / 255) * 8.95).toFixed(2));
      result = CasinoRoundSchema.parse({ ...common, multiplier, outcomeLabel: `Flight ended at ${multiplier.toFixed(2)}×` });
    } else if (game.type === 'dice') {
      const dice: [number, number] = [bytes.readUInt8(0) % 6 + 1, bytes.readUInt8(1) % 6 + 1];
      result = CasinoRoundSchema.parse({ ...common, dice, outcomeLabel: dice[0] === dice[1] ? `Doubles ${dice[0]}!` : `Rolled ${dice[0] + dice[1]}` });
    } else {
      const symbols = ['7', '★', '◆', '●', 'BAR'];
      const reels: [string, string, string] = [symbols[bytes.readUInt8(0) % symbols.length]!, symbols[bytes.readUInt8(1) % symbols.length]!, symbols[bytes.readUInt8(2) % symbols.length]!];
      result = CasinoRoundSchema.parse({ ...common, reels, outcomeLabel: reels.every(symbol => symbol === reels[0]) ? 'Triple match!' : reels[0] === reels[1] || reels[1] === reels[2] ? 'Pair match' : 'Spin complete' });
    }
    this.commands.set(`${ownerId}:${parsed.data.idempotencyKey}`, result);
    return result;
  }
}
