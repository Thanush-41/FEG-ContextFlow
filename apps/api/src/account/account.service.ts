import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomUUID } from 'node:crypto';
import type { Model } from 'mongoose';
import { CreateDemoSessionSchema, DemoProfileSchema, DemoSessionSchema, PublicIdSchema, UpdateDemoProfileSchema, type DemoProfile, type DemoSession } from '@feg/contracts';
import { DEMO_PROFILE_MODEL, DEMO_SESSION_MODEL } from '../persistence/models.js';

@Injectable()
export class AccountService {
  private readonly profiles = new Map<string, DemoProfile>();
  private readonly demoSessions = new Map<string, DemoSession>();
  constructor(
    @Optional() @InjectModel(DEMO_PROFILE_MODEL) private readonly profileModel?: Model<DemoProfile>,
    @Optional() @InjectModel(DEMO_SESSION_MODEL) private readonly sessionModel?: Model<DemoSession>,
  ) {}

  async profile(userId: string): Promise<DemoProfile> {
    this.validateUser(userId);
    if (this.profileModel) {
      const value = await this.profileModel.findOneAndUpdate({ userId }, { $setOnInsert: this.initialProfile(userId) }, { upsert: true, new: true }).lean().exec();
      return DemoProfileSchema.parse(this.clean(value));
    }
    const value = this.profiles.get(userId) ?? this.initialProfile(userId);
    this.profiles.set(userId, value);
    return value;
  }

  async updateProfile(userId: string, candidate: unknown): Promise<DemoProfile> {
    const parsed = UpdateDemoProfileSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid profile settings.');
    const current = await this.profile(userId);
    const updated = DemoProfileSchema.parse({ ...current, ...parsed.data, updatedAt: new Date().toISOString() });
    if (this.profileModel) await this.profileModel.updateOne({ userId }, { $set: updated }).exec();
    else this.profiles.set(userId, updated);
    return updated;
  }

  async sessions(userId: string): Promise<DemoSession[]> {
    this.validateUser(userId);
    if (this.sessionModel) return (await this.sessionModel.find({ userId }).sort({ lastSeenAt: -1 }).lean().exec()).map(value => DemoSessionSchema.parse(this.clean(value)));
    return [...this.demoSessions.values()].filter(value => value.userId === userId).sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
  }

  async createSession(userId: string, candidate: unknown): Promise<DemoSession> {
    this.validateUser(userId);
    const parsed = CreateDemoSessionSchema.safeParse(candidate);
    if (!parsed.success) throw new BadRequestException('Invalid device session.');
    const now = new Date().toISOString();
    if (this.sessionModel) {
      await this.sessionModel.updateMany({ userId, current: true }, { $set: { current: false } }).exec();
      const existing = await this.sessionModel.findOne({ userId, deviceName: parsed.data.deviceName, revokedAt: { $exists: false } }).lean().exec();
      const session = DemoSessionSchema.parse(existing ? { ...this.clean(existing), current: true, lastSeenAt: now } : { id: `session-${randomUUID()}`, userId, deviceName: parsed.data.deviceName, current: true, createdAt: now, lastSeenAt: now });
      await this.sessionModel.updateOne({ id: session.id }, { $set: session }, { upsert: true }).exec();
      return session;
    }
    for (const [id, value] of this.demoSessions) if (value.userId === userId && value.current) this.demoSessions.set(id, { ...value, current: false });
    const existing = [...this.demoSessions.values()].find(value => value.userId === userId && value.deviceName === parsed.data.deviceName && !value.revokedAt);
    const session = DemoSessionSchema.parse(existing ? { ...existing, current: true, lastSeenAt: now } : { id: `session-${randomUUID()}`, userId, deviceName: parsed.data.deviceName, current: true, createdAt: now, lastSeenAt: now });
    this.demoSessions.set(session.id, session);
    return session;
  }

  async revokeSession(userId: string, sessionId: string): Promise<DemoSession> {
    const session = (await this.sessions(userId)).find(value => value.id === sessionId);
    if (!session) throw new NotFoundException('Session not found.');
    if (session.current) throw new BadRequestException({ code: 'CURRENT_SESSION', message: 'The current session cannot be revoked from itself.' });
    if (session.revokedAt) return session;
    const updated = DemoSessionSchema.parse({ ...session, revokedAt: new Date().toISOString() });
    if (this.sessionModel) await this.sessionModel.updateOne({ id: sessionId, userId }, { $set: updated }).exec();
    else this.demoSessions.set(sessionId, updated);
    return updated;
  }

  private initialProfile(userId: string): DemoProfile {
    const now = new Date().toISOString();
    return { userId, displayName: 'Demo Player', locale: 'en', oddsFormat: 'decimal', theme: 'dark', notificationsEnabled: true, transcriptStorageEnabled: false, sessionReminderMinutes: 60, maxDemoStakeMinorUnits: 10_000, createdAt: now, updatedAt: now };
  }
  private validateUser(userId: string) { if (!PublicIdSchema.safeParse(userId).success) throw new BadRequestException('Invalid account user.'); }
  private clean(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object') return {}; const { _id: _id, ...rest } = value as Record<string, unknown>; return rest; }
}
