import { BadRequestException, ConflictException, Inject, Injectable } from '@nestjs/common';
import { CommunityPostSchema, CopyTicketSchema, type BetSlip, type CommunityPost } from '@feg/contracts';
import { SlipsService } from '../slips/slips.service.js';

@Injectable()
export class CommunityService {
  private readonly reactions = new Map<string, Set<string>>();
  private readonly posts = [
    { id: 'community-live-derby', authorName: 'Mara', message: 'Watching the derby live. This two-pick demo ticket keeps the story simple.', createdAt: '2026-09-09T00:30:00.000Z', reactionCount: 18, sharedSelections: [
      { eventId: 'event-chelsea-liverpool', marketId: 'event-chelsea-liverpool-market-0', selectionId: 'event-chelsea-liverpool-outcome-0-0', acceptedOdds: 1.55 },
      { eventId: 'event-chelsea-liverpool', marketId: 'event-chelsea-liverpool-market-1', selectionId: 'event-chelsea-liverpool-outcome-1-0', acceptedOdds: 1.72 },
    ] },
    { id: 'community-casino-tour', authorName: 'Luka', message: 'Completed the three-game simulation tour. Triple Pulse had the best reveal.', createdAt: '2026-09-08T22:00:00.000Z', reactionCount: 9, sharedSelections: [] },
    { id: 'community-voice-tip', authorName: 'Nina', message: 'Voice is fastest when the request names the event and market clearly.', createdAt: '2026-09-08T19:00:00.000Z', reactionCount: 12, sharedSelections: [] },
  ];

  constructor(@Inject(SlipsService) private readonly slips: SlipsService) {}

  feed(ownerId?: string): CommunityPost[] {
    const mine = ownerId ? this.reactions.get(ownerId) : undefined;
    return this.posts.map(post => CommunityPostSchema.parse({ ...post, reactionCount: post.reactionCount + (mine?.has(post.id) ? 1 : 0), reactedByMe: mine?.has(post.id) ?? false, demoOnly: true }));
  }

  react(ownerId: string, postId: string): CommunityPost {
    if (!this.posts.some(post => post.id === postId)) throw new BadRequestException('Unknown community post.');
    const mine = this.reactions.get(ownerId) ?? new Set<string>();
    mine.has(postId) ? mine.delete(postId) : mine.add(postId); this.reactions.set(ownerId, mine);
    return this.feed(ownerId).find(post => post.id === postId)!;
  }

  async copy(ownerId: string, postId: string, candidate: unknown): Promise<{ slip: BetSlip; unavailableSelectionIds: string[] }> {
    const input = CopyTicketSchema.safeParse(candidate);
    if (!input.success) throw new BadRequestException('Invalid shared-ticket copy command.');
    const post = this.posts.find(item => item.id === postId);
    if (!post || !post.sharedSelections.length) throw new BadRequestException('This post has no shared demo ticket.');
    let slip = await this.slips.get(ownerId, input.data.tab);
    if (slip.version !== input.data.expectedVersion) throw new ConflictException('The slip changed on another client.');
    const unavailableSelectionIds: string[] = [];
    for (const selection of post.sharedSelections) {
      try { slip = await this.slips.add(ownerId, input.data.tab, { ...selection, expectedVersion: slip.version }); }
      catch { unavailableSelectionIds.push(selection.selectionId); }
    }
    return { slip, unavailableSelectionIds };
  }
}
