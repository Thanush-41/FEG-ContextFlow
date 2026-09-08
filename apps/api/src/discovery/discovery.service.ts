import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentArticleSchema, ContentKindSchema, PromotionSchema, type ContentArticle, type ContentKind, type Promotion } from '@feg/contracts';

@Injectable()
export class DiscoveryService {
  private readonly optIns = new Map<string, Set<string>>();
  private readonly promotions = [
    { id: 'promo-live-boost', title: 'Live Match Boost', summary: 'Explore one featured live market with a highlighted demo price.', rewardLabel: 'DEMO BOOST', terms: ['Demo coins only.', 'One highlighted market per session.'], expiresAt: '2027-01-31T23:59:59.000Z' },
    { id: 'promo-weekend-builder', title: 'Weekend Builder', summary: 'Try a three-selection BetBuilder journey from the featured offer.', rewardLabel: 'BUILDER CHALLENGE', terms: ['No cash value.', 'Selections remain subject to market availability.'], expiresAt: '2027-02-28T23:59:59.000Z' },
    { id: 'promo-casino-tour', title: 'Three Game Tour', summary: 'Play one round of each deterministic casino simulation.', rewardLabel: 'CASINO TOUR', terms: ['Simulation only.', 'Rounds never affect the demo wallet.'], expiresAt: '2027-03-31T23:59:59.000Z' },
  ];
  private readonly articles: ContentArticle[] = [
    ContentArticleSchema.parse({ id: 'news-live-flow', kind: 'news', title: 'Live centre now tracks every demo ticket', summary: 'Follow scores, suspensions and ticket state from one native flow.', body: ['Live event snapshots update the scoreboard and available markets.', 'Open tickets reconcile against the same authoritative simulation.'], publishedAt: '2026-09-09T00:00:00.000Z' }),
    ContentArticleSchema.parse({ id: 'guide-betbuilder', kind: 'guide', title: 'Build a clearer demo ticket', summary: 'Review compatibility, price changes and potential returns before confirming.', body: ['Choose compatible outcomes from one event.', 'The server recalculates totals and requires explicit acceptance when prices move.'], publishedAt: '2026-09-08T00:00:00.000Z' }),
    ContentArticleSchema.parse({ id: 'help-demo-coins', kind: 'help', title: 'What are demo coins?', summary: 'Demo coins are fictional test units with no cash value.', body: ['They cannot be purchased, withdrawn as money or transferred.', 'Use the demo wallet to rehearse product flows safely.'], publishedAt: '2026-09-07T00:00:00.000Z' }),
    ContentArticleSchema.parse({ id: 'help-voice-privacy', kind: 'help', title: 'Voice and transcript privacy', summary: 'Speech permissions stay under device control.', body: ['Voice controls require microphone and speech permission.', 'Transcript storage remains off by default and can be changed in Profile & Settings.'], publishedAt: '2026-09-07T00:00:00.000Z' }),
    ContentArticleSchema.parse({ id: 'responsible-pause', kind: 'responsible_play', title: 'Pause and reset', summary: 'Set a demo stake ceiling and take regular session breaks.', body: ['Use the maximum demo stake and reminder controls in Profile & Settings.', 'Stop whenever play no longer feels entertaining. This app never offers real-money wagering.'], publishedAt: '2026-09-06T00:00:00.000Z' }),
    ContentArticleSchema.parse({ id: 'responsible-control', kind: 'responsible_play', title: 'Keep every action in context', summary: 'Review selections and confirmations before acting.', body: ['Voice actions never bypass validation or confirmation.', 'Casino rounds are deterministic simulations and never alter wallet funds.'], publishedAt: '2026-09-06T00:00:00.000Z' }),
  ];

  listPromotions(ownerId?: string): Promotion[] {
    const optedIn = ownerId ? this.optIns.get(ownerId) : undefined;
    return this.promotions.map(item => PromotionSchema.parse({ ...item, eligible: Boolean(ownerId), optedIn: optedIn?.has(item.id) ?? false, demoOnly: true }));
  }

  optIn(ownerId: string, promotionId: string): Promotion {
    if (!this.promotions.some(item => item.id === promotionId)) throw new BadRequestException('Unknown demo promotion.');
    const current = this.optIns.get(ownerId) ?? new Set<string>(); current.add(promotionId); this.optIns.set(ownerId, current);
    return this.listPromotions(ownerId).find(item => item.id === promotionId)!;
  }

  listContent(candidate?: string): ContentArticle[] {
    if (!candidate) return this.articles;
    const parsed = ContentKindSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Unknown content kind.');
    return this.articles.filter(item => item.kind === parsed.data);
  }

  article(id: string): ContentArticle {
    const result = this.articles.find(item => item.id === id);
    if (!result) throw new BadRequestException('Unknown content article.');
    return result;
  }
}
