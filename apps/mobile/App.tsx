import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Linking, NativeEventEmitter, NativeModules, Platform, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ContextFlowClient } from '@feg/api-client';
import type { SportsEvent } from '@feg/contracts';

type CounterLiveActivityModule = {
  start: (count: number) => Promise<string>;
  update: (count: number) => Promise<void>;
  end: () => Promise<void>;
  saveCount: (count: number) => void;
  getSavedCount: () => Promise<number>;
  sendNotification: (count: number) => Promise<void>;
  isActive: () => Promise<boolean>;
  startVoiceRecognition: () => Promise<void>;
  stopVoiceRecognition: () => Promise<void>;
};

type VoiceProgress = { transcript: string; wordCount: number; isFinal: boolean; error?: string };
type Event = {
  id: string; label: string; league: string; starts: string;
  home: string; away: string; markets: readonly [string, string, string];
  apiEventId?: string; apiMarketId?: string; apiSelectionIds?: readonly string[];
};
type Tab = 'Live' | 'Sport' | 'Tickets' | 'Casino' | 'Menu';

const fallbackEvents: Event[] = [
  { id: 'chelsea-liverpool', label: 'BET BUILDER', league: 'ENGLAND · PREMIER LEAGUE', starts: 'STARTS IN 2H', home: 'Chelsea', away: 'Liverpool', markets: ['2.25', '3.40', '2.40'] },
  { id: 'betis-madrid', label: 'POPULAR', league: 'SPAIN · LA LIGA', starts: 'TOMORROW 00:30', home: 'Real Betis', away: 'Real Madrid', markets: ['4.60', '3.85', '1.68'] },
  { id: 'inter-milan', label: 'TOP MATCH', league: 'ITALY · SERIE A', starts: 'TOMORROW 02:15', home: 'Inter', away: 'AC Milan', markets: ['2.05', '3.25', '3.10'] },
];

const liveActivity = NativeModules.CounterLiveActivityModule as CounterLiveActivityModule | undefined;

function apiBaseUrl() {
  const scriptUrl = (NativeModules.SourceCode as { scriptURL?: string } | undefined)?.scriptURL;
  const host = scriptUrl?.match(/^https?:\/\/([^/:]+)/)?.[1];
  if (host) return `http://${host}:3000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

const api = new ContextFlowClient(apiBaseUrl(), async () => undefined);

function toUiEvent(event: SportsEvent): Event {
  const market = event.markets[0];
  const odds = market?.selections.map(selection => selection.odds.toFixed(2)) ?? [];
  return {
    id: event.id.replace(/^event-/, ''),
    label: event.status === 'live' ? `● LIVE  ${event.clock ?? ''}` : 'BET BUILDER',
    league: event.league.toUpperCase(),
    starts: event.status === 'live' ? event.score ?? 'LIVE' : 'STARTS SOON',
    home: event.home,
    away: event.away,
    markets: [odds[0] ?? '–', odds[1] ?? '–', odds[2] ?? '–'],
    apiEventId: event.id,
    apiMarketId: market?.id,
    apiSelectionIds: market?.selections.map(selection => selection.id),
  };
}

function App() {
  const [count, setCount] = useState(0);
  const [isCountLoaded, setIsCountLoaded] = useState(Platform.OS !== 'ios');
  const [isLiveActivityActive, setIsLiveActivityActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [activePeriod, setActivePeriod] = useState('TODAY');
  const [selectedOdd, setSelectedOdd] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Sport');
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [offerEvents, setOfferEvents] = useState(fallbackEvents);
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const countRef = useRef(count);
  const voiceBaseCountRef = useRef(count);

  useEffect(() => { countRef.current = count; }, [count]);

  useEffect(() => {
    Promise.all([api.getEvents('scheduled'), api.getEvents('live')])
      .then(([scheduled, live]) => {
        if (scheduled.length) setOfferEvents(scheduled.map(toUiEvent));
        setLiveEvents(live.map(toUiEvent));
      })
      .catch(() => {
        // Deterministic fixtures keep the demo usable while the local API starts.
      });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !liveActivity) { setIsCountLoaded(true); return; }
    liveActivity.getSavedCount().then(savedCount => {
      countRef.current = savedCount;
      setCount(savedCount);
      setIsCountLoaded(true);
    }).catch(() => setIsCountLoaded(true));
  }, []);

  const startVoiceInput = useCallback(async () => {
    if (!liveActivity) return;
    voiceBaseCountRef.current = countRef.current;
    setTranscript('');
    try {
      await liveActivity.startVoiceRecognition();
      setIsListening(true);
    } catch (error) {
      setIsListening(false);
      Alert.alert('Voice Input', error instanceof Error ? error.message : 'Unable to start voice input.');
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'ios' || !liveActivity) return;
    const emitter = new NativeEventEmitter(NativeModules.CounterLiveActivityModule);
    const voiceSubscription = emitter.addListener('CounterVoiceProgress', (event: Object) => {
      const progress = event as VoiceProgress;
      setTranscript(progress.transcript);
      setCount(voiceBaseCountRef.current + progress.wordCount);
      setIsListening(!progress.isFinal);
      setShowVoice(true);
      if (progress.error) Alert.alert('Voice Input', progress.error);
    });
    const handleVoiceURL = async (url?: string | null) => {
      if (!url?.startsWith('fegcontextflow://voice')) return;
      const savedCount = await liveActivity.getSavedCount();
      countRef.current = savedCount;
      setCount(savedCount);
      setIsCountLoaded(true);
      setShowVoice(true);
      const active = await liveActivity.isActive();
      setIsLiveActivityActive(active);
      if (active) await startVoiceInput();
    };
    Linking.getInitialURL().then(handleVoiceURL).catch(() => undefined);
    const urlSubscription = Linking.addEventListener('url', event => {
      handleVoiceURL(event.url).catch(() => undefined);
    });
    liveActivity.isActive().then(setIsLiveActivityActive).catch(() => undefined);
    return () => { voiceSubscription.remove(); urlSubscription.remove(); };
  }, [startVoiceInput]);

  useEffect(() => {
    if (Platform.OS === 'ios' && isCountLoaded) liveActivity?.saveCount(count);
    if (!isCountLoaded || !isLiveActivityActive || !liveActivity) return;
    liveActivity.update(count).catch(() => setIsLiveActivityActive(false));
  }, [count, isCountLoaded, isLiveActivityActive]);

  const toggleLiveActivity = async () => {
    if (!liveActivity) {
      Alert.alert('Live Activity unavailable', 'Install the iOS app to use this feature.');
      return;
    }
    try {
      if (isLiveActivityActive) {
        if (isListening) await liveActivity.stopVoiceRecognition();
        await liveActivity.end();
        setIsListening(false);
        setIsLiveActivityActive(false);
      } else {
        await liveActivity.start(count);
        setIsLiveActivityActive(true);
      }
    } catch (error) {
      Alert.alert('Dynamic Island', error instanceof Error ? error.message : 'Unable to update Live Activity.');
    }
  };

  const toggleVoiceInput = async () => {
    if (!liveActivity) return;
    if (isListening) { await liveActivity.stopVoiceRecognition(); setIsListening(false); }
    else await startVoiceInput();
  };

  const sendNotification = async () => {
    if (!liveActivity) return;
    try { await liveActivity.sendNotification(count); }
    catch (error) { Alert.alert('Notification', error instanceof Error ? error.message : 'Unable to send notification.'); }
  };

  const placeDemoBet = async () => {
    if (!selectedOdd) return;
    const separator = selectedOdd.lastIndexOf('-');
    const eventId = selectedOdd.slice(0, separator);
    const selectionIndex = Number(selectedOdd.slice(separator + 1));
    const event = [...offerEvents, ...liveEvents].find(item => item.id === eventId);
    const selectionId = event?.apiSelectionIds?.[selectionIndex];
    const acceptedOdds = Number(event?.markets[selectionIndex]);
    if (!event?.apiEventId || !event.apiMarketId || !selectionId || !acceptedOdds) {
      Alert.alert('Demo bet', 'Wait for the live offer to finish loading, then select again.');
      return;
    }
    setIsPlacingBet(true);
    try {
      const ticket = await api.placeDemoBet({
        idempotencyKey: 'f37970b1-1127-45b1-ab01-301f09772f0b',
        stake: { currency: 'DCO', minorUnits: 100 },
        selections: [{ eventId: event.apiEventId, marketId: event.apiMarketId, selectionId, acceptedOdds }],
      });
      setTicketId(ticket.id);
    } catch (error) {
      Alert.alert('Demo bet', error instanceof Error ? error.message : 'Unable to place demo bet.');
    } finally {
      setIsPlacingBet(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top']} style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <Header count={count} onVoice={() => setShowVoice(value => !value)} />
        {activeTab === 'Sport' && <NativePrompt />}
        {(activeTab === 'Sport' || activeTab === 'Live') && <PeriodTabs active={activePeriod} onChange={setActivePeriod} />}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {showVoice && <VoicePanel
            count={count} isActive={isLiveActivityActive} isListening={isListening} transcript={transcript}
            onDecrease={() => setCount(value => value - 1)} onIncrease={() => setCount(value => value + 1)}
            onReset={() => setCount(0)} onToggleActivity={toggleLiveActivity}
            onToggleVoice={toggleVoiceInput} onNotify={sendNotification}
          />}
          {activeTab === 'Sport' && !detailEvent && <><View style={styles.hero}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroKicker}>FEG CONTEXTFLOW</Text>
              <Text style={styles.heroTitle}>Speak. Pick. Confirm.</Text>
              <Text style={styles.heroBody}>Your voice agent for every match.</Text>
            </View>
            <View style={styles.heroOrb}><Text style={styles.heroOrbText}>●</Text></View>
          </View>
          <QuickLinks />
          <View style={styles.filters}>
            <Text style={styles.filterTitle}>TOP OFFER</Text>
            <Pressable style={styles.filterButton}><Text style={styles.filterButtonText}>☷  FILTER</Text></Pressable>
          </View>
          {offerEvents.map(event => <EventCard event={event} key={event.id} selectedOdd={selectedOdd} onSelect={setSelectedOdd} onOpen={() => setDetailEvent(event)} />)}</>}
          {activeTab === 'Sport' && detailEvent && <EventDetail event={detailEvent} selectedOdd={selectedOdd} onBack={() => setDetailEvent(null)} onSelect={setSelectedOdd} />}
          {activeTab === 'Live' && <LiveScreen events={liveEvents} selectedOdd={selectedOdd} onSelect={setSelectedOdd} />}
          {activeTab === 'Tickets' && <TicketsScreen hasSelection={Boolean(selectedOdd)} isPlacing={isPlacingBet} ticketId={ticketId} onPlace={placeDemoBet} />}
          {activeTab === 'Casino' && <CasinoScreen />}
          {activeTab === 'Menu' && <MenuScreen />}
        </ScrollView>
        {selectedOdd && <View style={styles.betBar}>
          <View><Text style={styles.betBarLabel}>BET SLIP · 1 PICK</Text><Text style={styles.betBarOdds}>Selection ready</Text></View>
          <Pressable onPress={() => setActiveTab('Tickets')} style={styles.betButton} testID="open-betslip-button"><Text style={styles.betButtonText}>OPEN</Text></Pressable>
        </View>}
        <BottomNavigation active={activeTab} onChange={tab => { setActiveTab(tab); setDetailEvent(null); }} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Header({ count, onVoice }: { count: number; onVoice: () => void }) {
  return <View style={styles.header}>
    <View style={styles.brandLockup}><Text style={styles.brand}>FEG</Text><Text style={styles.brandCaption}>CONTEXTFLOW</Text></View>
    <View style={styles.headerActions}>
      <Text style={styles.headerIcon}>⌕</Text><Text style={styles.headerIcon}>♧</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Voice word count: ${count}`} onPress={onVoice} style={styles.voiceChip} testID="voice-panel-button">
        <Text style={styles.voiceChipDot}>●</Text><Text style={styles.voiceChipText} testID="counter-value">{count}</Text>
      </Pressable>
    </View>
  </View>;
}

function NativePrompt() {
  return <View style={styles.nativePrompt}>
    <View style={styles.nativeMark}><Text style={styles.nativeMarkText}>F</Text></View>
    <View style={styles.nativeCopy}><Text style={styles.nativeTitle}>FEG native application</Text><Text style={styles.nativeSubtitle}>Faster voice actions and live updates</Text></View>
    <Text style={styles.download}>DOWNLOAD</Text>
  </View>;
}

function PeriodTabs({ active, onChange }: { active: string; onChange: (value: string) => void }) {
  return <View style={styles.periodTabs}>{['TODAY', '1H', '3H', 'TOMORROW'].map(period =>
    <Pressable key={period} onPress={() => onChange(period)} style={[styles.periodTab, active === period && styles.periodTabActive]}>
      <Text style={[styles.periodText, active === period && styles.periodTextActive]}>{period}</Text>
    </Pressable>)}</View>;
}

function QuickLinks() {
  const links = [['✈', 'Aviator'], ['◉', 'Live'], ['▤', 'My bets'], ['◎', 'Casino']];
  return <View style={styles.quickLinks}>{links.map(([icon, label]) =>
    <Pressable key={label} style={styles.quickLink}><Text style={styles.quickIcon}>{icon}</Text><Text style={styles.quickLabel}>{label}</Text></Pressable>)}</View>;
}

function EventCard({ event, selectedOdd, onSelect, onOpen }: { event: Event; selectedOdd: string | null; onSelect: (value: string | null) => void; onOpen?: () => void }) {
  const labels = ['1', 'X', '2'];
  return <View style={styles.eventCard} testID={`event-${event.id}`}>
    <View style={styles.eventTopline}><Text style={styles.eventBadge}>{event.label}</Text><Text style={styles.eventStarts}>{event.starts}</Text></View>
    <View style={styles.leagueRow}><Text style={styles.league}>{event.league}</Text><Text style={styles.chevron}>⌄</Text></View>
    <Pressable onPress={onOpen} style={styles.teams}><Text style={styles.team}>{event.home}</Text><Text style={styles.team}>{event.away}</Text></Pressable>
    <View style={styles.marketMeta}><Text style={styles.marketName}>MATCH RESULT</Text><Text style={styles.moreMarkets}>+38 markets</Text></View>
    <View style={styles.oddsRow}>{event.markets.map((odd, index) => {
      const key = `${event.id}-${index}`;
      const selected = selectedOdd === key;
      return <Pressable key={key} onPress={() => onSelect(selected ? null : key)} style={[styles.oddButton, selected && styles.oddButtonSelected]} testID={`odd-${key}`}>
        <Text style={[styles.oddLabel, selected && styles.oddTextSelected]}>{labels[index]}</Text>
        <Text style={[styles.oddValue, selected && styles.oddTextSelected]}>{odd}</Text>
      </Pressable>;
    })}</View>
  </View>;
}

type VoicePanelProps = {
  count: number; isActive: boolean; isListening: boolean; transcript: string;
  onDecrease: () => void; onIncrease: () => void; onReset: () => void;
  onToggleActivity: () => void; onToggleVoice: () => void; onNotify: () => void;
};

function VoicePanel(props: VoicePanelProps) {
  const { count, isActive, isListening, transcript, onDecrease, onIncrease, onReset, onToggleActivity, onToggleVoice, onNotify } = props;
  return <View style={styles.voicePanel} testID="voice-panel">
    <View style={styles.voicePanelHeading}>
      <View><Text style={styles.voicePanelKicker}>VOICE SESSION</Text><Text style={styles.voicePanelTitle}>{isListening ? 'Listening now…' : 'Ready when you are'}</Text></View>
      <View style={[styles.liveState, isActive && styles.liveStateActive]}><Text style={styles.liveStateText}>{isActive ? 'LIVE' : 'OFF'}</Text></View>
    </View>
    <Text style={styles.transcript}>{transcript || 'Start a Live Activity, then speak from the widget or Dynamic Island.'}</Text>
    <View style={styles.wordCounter}>
      <Pressable onPress={onDecrease} style={styles.counterKey} testID="decrease-button"><Text style={styles.counterKeyText}>−</Text></Pressable>
      <View style={styles.wordCount}><Text style={styles.wordCountNumber}>{count}</Text><Text style={styles.wordCountLabel}>WORDS</Text></View>
      <Pressable onPress={onIncrease} style={styles.counterKey} testID="increase-button"><Text style={styles.counterKeyText}>+</Text></Pressable>
    </View>
    <View style={styles.voiceActions}>
      <Pressable onPress={onToggleActivity} style={[styles.voiceAction, styles.voiceActionPrimary]} testID="live-activity-button"><Text style={styles.voiceActionPrimaryText}>{isActive ? 'END ACTIVITY' : 'GO LIVE'}</Text></Pressable>
      <Pressable disabled={!isActive} onPress={onToggleVoice} style={[styles.voiceAction, !isActive && styles.disabled]} testID="voice-input-button"><Text style={styles.voiceActionText}>{isListening ? 'STOP' : 'SPEAK'}</Text></Pressable>
      <Pressable onPress={onNotify} style={styles.voiceAction} testID="notification-button"><Text style={styles.voiceActionText}>NOTIFY</Text></Pressable>
      <Pressable onPress={onReset} style={styles.voiceAction} testID="reset-button"><Text style={styles.voiceActionText}>RESET</Text></Pressable>
    </View>
  </View>;
}

function EventDetail({ event, selectedOdd, onBack, onSelect }: { event: Event; selectedOdd: string | null; onBack: () => void; onSelect: (value: string | null) => void }) {
  return <View testID="event-detail-screen">
    <Pressable onPress={onBack} style={styles.screenHeading}><Text style={styles.backText}>‹</Text><Text style={styles.screenTitle}>EVENT DETAILS</Text></Pressable>
    <View style={styles.scoreboard}><Text style={styles.scoreMeta}>{event.league}</Text><Text style={styles.scoreTeams}>{event.home}  vs  {event.away}</Text><Text style={styles.scoreTime}>{event.starts}</Text></View>
    <Text style={styles.groupHeading}>MAIN MARKETS</Text>
    <EventCard event={event} selectedOdd={selectedOdd} onSelect={onSelect} />
    <Text style={styles.groupHeading}>GOALS</Text>
    <View style={styles.marketPlaceholder}><Text style={styles.marketPlaceholderText}>Over 2.5</Text><Text style={styles.marketPlaceholderOdd}>1.84</Text></View>
    <View style={styles.marketPlaceholder}><Text style={styles.marketPlaceholderText}>Under 2.5</Text><Text style={styles.marketPlaceholderOdd}>1.96</Text></View>
  </View>;
}

function LiveScreen({ events: liveEvents, selectedOdd, onSelect }: { events: Event[]; selectedOdd: string | null; onSelect: (value: string | null) => void }) {
  const liveEvent: Event = liveEvents[0] ?? { id: 'dinamo-hajduk', label: '● LIVE  67\'', league: 'CROATIA · HNL', starts: '1 – 1', home: 'Dinamo Zagreb', away: 'Hajduk Split', markets: ['2.05', '2.80', '4.10'] };
  return <View testID="live-screen">
    <View style={styles.filters}><Text style={styles.filterTitle}>LIVE NOW</Text><Text style={styles.liveCount}>1 EVENT</Text></View>
    <EventCard event={liveEvent} selectedOdd={selectedOdd} onSelect={onSelect} />
    <View style={styles.infoCard}><Text style={styles.infoTitle}>Live updates</Text><Text style={styles.infoBody}>Scores, clocks and market availability update through the realtime channel.</Text></View>
  </View>;
}

function TicketsScreen({ hasSelection, isPlacing, ticketId, onPlace }: { hasSelection: boolean; isPlacing: boolean; ticketId: string | null; onPlace: () => void }) {
  return <View testID="tickets-screen">
    <View style={styles.screenHeading}><Text style={styles.screenTitle}>TICKETS</Text><Text style={styles.sectionAction}>HISTORY</Text></View>
    {hasSelection ? <View style={styles.ticketCard}>
      <Text style={styles.ticketStatus}>{ticketId ? 'OPEN TICKET' : 'DRAFT · 1 SELECTION'}</Text><Text style={styles.ticketTitle}>{ticketId ? 'Demo bet accepted' : 'Your demo bet is ready'}</Text>
      <View style={styles.stakeRow}><Text style={styles.stakeLabel}>STAKE</Text><Text style={styles.stakeValue}>1.00 DCO</Text></View>
      {ticketId ? <Text style={styles.ticketId} numberOfLines={1}>{ticketId}</Text> : <Pressable onPress={onPlace} disabled={isPlacing} style={[styles.placeButton, isPlacing && styles.disabled]} testID="place-demo-bet-button"><Text style={styles.placeButtonText}>{isPlacing ? 'PLACING…' : 'PLACE DEMO BET'}</Text></Pressable>}
    </View> : <EmptyState icon="▤" title="No tickets yet" body="Choose odds from Sport or Live to create your first demo ticket." />}
  </View>;
}

function CasinoScreen() {
  return <View testID="casino-screen">
    <View style={styles.screenHeading}><Text style={styles.screenTitle}>CASINO</Text><Text style={styles.sectionAction}>FILTER</Text></View>
    <View style={styles.casinoGrid}>{['Live tables', 'Jackpots', 'Crash', 'New games', 'Slots', 'Favourites'].map((title, index) =>
      <View key={title} style={[styles.gameTile, index < 2 && styles.gameTileFeatured]}><Text style={styles.gameBadge}>{index < 2 ? 'HOT' : 'DEMO'}</Text><Text style={styles.gameTitle}>{title}</Text></View>)}</View>
  </View>;
}

function MenuScreen() {
  return <View testID="menu-screen">
    <View style={styles.screenHeading}><Text style={styles.screenTitle}>MENU</Text></View>
    {['Profile & demo wallet', 'Promotions', 'Community', 'News', 'Help centre', 'Responsible play', 'Settings'].map(item =>
      <Pressable key={item} style={styles.menuRow}><Text style={styles.menuText}>{item}</Text><Text style={styles.chevron}>›</Text></Pressable>)}
  </View>;
}

function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return <View style={styles.emptyState}><Text style={styles.emptyIcon}>{icon}</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyBody}>{body}</Text></View>;
}

function BottomNavigation({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const tabs = [['●', 'Live'], ['▦', 'Sport'], ['▤', 'Tickets'], ['◎', 'Casino'], ['☰', 'Menu']];
  return <View style={styles.bottomNav}>{tabs.map(([icon, label]) =>
    <Pressable key={label} onPress={() => onChange(label as Tab)} style={styles.bottomTab} testID={`tab-${label.toLowerCase()}`}><Text style={[styles.bottomIcon, label === active && styles.bottomActive]}>{icon}</Text><Text style={[styles.bottomLabel, label === active && styles.bottomActive]}>{label}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#080D14' },
  header: { height: 56, backgroundColor: '#1264C5', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandLockup: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  brand: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1.5 },
  brandCaption: { color: '#D8E9FF', fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  headerIcon: { color: '#FFFFFF', fontSize: 24, fontWeight: '300' },
  voiceChip: { minWidth: 49, height: 30, borderRadius: 15, paddingHorizontal: 9, backgroundColor: '#0A4C9A', flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' },
  voiceChipDot: { color: '#45E6A8', fontSize: 10 },
  voiceChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },
  nativePrompt: { height: 50, backgroundColor: '#0B0F14', borderBottomWidth: 1, borderBottomColor: '#202833', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  nativeMark: { width: 30, height: 30, borderRadius: 4, backgroundColor: '#1264C5', alignItems: 'center', justifyContent: 'center' },
  nativeMarkText: { color: '#FFFFFF', fontWeight: '900', fontSize: 18, fontStyle: 'italic' },
  nativeCopy: { flex: 1, marginLeft: 9 },
  nativeTitle: { color: '#F7F9FC', fontSize: 11, fontWeight: '700' },
  nativeSubtitle: { color: '#77818E', fontSize: 9, marginTop: 2 },
  download: { color: '#6EAFFF', fontSize: 9, fontWeight: '900' },
  periodTabs: { height: 44, backgroundColor: '#282D35', flexDirection: 'row', paddingHorizontal: 9 },
  periodTab: { flex: 1, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  periodTabActive: { borderBottomColor: '#2E8BFF' },
  periodText: { color: '#9EA6B1', fontSize: 10, fontWeight: '700' },
  periodTextActive: { color: '#FFFFFF' },
  scrollContent: { paddingBottom: 16 },
  hero: { height: 112, margin: 10, marginBottom: 4, padding: 16, overflow: 'hidden', backgroundColor: '#164B8D', flexDirection: 'row', alignItems: 'center' },
  heroCopy: { flex: 1, zIndex: 1 },
  heroKicker: { color: '#7FC2FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  heroTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', marginTop: 6 },
  heroBody: { color: '#D6E8FF', fontSize: 11, marginTop: 5 },
  heroOrb: { width: 92, height: 92, marginRight: -24, borderRadius: 46, backgroundColor: '#0E2D55', borderWidth: 15, borderColor: '#247FDE', alignItems: 'center', justifyContent: 'center' },
  heroOrbText: { color: '#45E6A8', fontSize: 20 },
  quickLinks: { height: 85, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222A35', backgroundColor: '#0C121B' },
  quickLink: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 7 },
  quickIcon: { color: '#3E91F4', fontSize: 23 },
  quickLabel: { color: '#DDE3EA', fontSize: 10, fontWeight: '600' },
  filters: { height: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterTitle: { color: '#F1F4F8', fontSize: 12, fontWeight: '900' },
  filterButton: { backgroundColor: '#272D36', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 7 },
  filterButtonText: { color: '#C9D0D9', fontSize: 9, fontWeight: '800' },
  eventCard: { marginHorizontal: 10, marginBottom: 8, backgroundColor: '#111823', borderWidth: 1, borderColor: '#252D39' },
  eventTopline: { height: 29, backgroundColor: '#171F2B', paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eventBadge: { color: '#6EAFFF', fontSize: 8, fontWeight: '900' },
  eventStarts: { color: '#9AA4B0', fontSize: 8, fontWeight: '700' },
  leagueRow: { height: 29, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#242D39' },
  league: { color: '#AAB3BF', fontSize: 8, fontWeight: '800' },
  chevron: { color: '#8A94A1', fontSize: 16 },
  teams: { paddingHorizontal: 10, paddingTop: 9, gap: 4 },
  team: { color: '#F5F7FA', fontSize: 13, fontWeight: '700' },
  marketMeta: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6, flexDirection: 'row', justifyContent: 'space-between' },
  marketName: { color: '#778290', fontSize: 8, fontWeight: '800' },
  moreMarkets: { color: '#69AFFF', fontSize: 8, fontWeight: '700' },
  oddsRow: { flexDirection: 'row', gap: 5, paddingHorizontal: 8, paddingBottom: 8 },
  oddButton: { flex: 1, height: 38, paddingHorizontal: 9, borderRadius: 3, backgroundColor: '#323944', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  oddButtonSelected: { backgroundColor: '#1264C5' },
  oddLabel: { color: '#9DA6B2', fontSize: 9, fontWeight: '800' },
  oddValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
  oddTextSelected: { color: '#FFFFFF' },
  voicePanel: { margin: 10, marginBottom: 0, padding: 13, backgroundColor: '#111B28', borderWidth: 1, borderColor: '#286DB9' },
  voicePanelHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  voicePanelKicker: { color: '#6EAFFF', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  voicePanelTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginTop: 4 },
  liveState: { backgroundColor: '#3B424C', borderRadius: 3, paddingHorizontal: 8, paddingVertical: 4 },
  liveStateActive: { backgroundColor: '#D92532' },
  liveStateText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  transcript: { minHeight: 30, color: '#AEB8C5', fontSize: 10, lineHeight: 15, marginTop: 10 },
  wordCounter: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  counterKey: { width: 34, height: 34, borderRadius: 3, backgroundColor: '#303A47', alignItems: 'center', justifyContent: 'center' },
  counterKeyText: { color: '#FFFFFF', fontSize: 20 },
  wordCount: { minWidth: 70, alignItems: 'center' },
  wordCountNumber: { color: '#FFFFFF', fontSize: 23, fontWeight: '900', fontVariant: ['tabular-nums'] },
  wordCountLabel: { color: '#738092', fontSize: 7, fontWeight: '900' },
  voiceActions: { marginTop: 11, flexDirection: 'row', gap: 5 },
  voiceAction: { flex: 1, height: 32, backgroundColor: '#303944', alignItems: 'center', justifyContent: 'center', borderRadius: 3 },
  voiceActionPrimary: { backgroundColor: '#1264C5' },
  voiceActionText: { color: '#DDE3EA', fontSize: 8, fontWeight: '900' },
  voiceActionPrimaryText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  disabled: { opacity: 0.4 },
  betBar: { minHeight: 55, paddingHorizontal: 13, backgroundColor: '#262D36', borderTopWidth: 1, borderTopColor: '#4A5360', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  betBarLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  betBarOdds: { color: '#AAB3BF', fontSize: 9, marginTop: 3 },
  betButton: { backgroundColor: '#20A20E', borderRadius: 3, paddingHorizontal: 22, paddingVertical: 10 },
  betButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  bottomNav: { height: 61, backgroundColor: '#080C11', borderTopWidth: 1, borderTopColor: '#242A32', flexDirection: 'row', paddingBottom: 4 },
  bottomTab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  bottomIcon: { color: '#98A1AD', fontSize: 17 },
  bottomLabel: { color: '#98A1AD', fontSize: 9, fontWeight: '600' },
  bottomActive: { color: '#4C9DFF' },
  screenHeading: { minHeight: 52, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#252D39' },
  backText: { color: '#70AFFF', fontSize: 28, marginRight: 10 },
  screenTitle: { flex: 1, color: '#F4F6F9', fontSize: 13, fontWeight: '900' },
  sectionAction: { color: '#70AFFF', fontSize: 9, fontWeight: '900' },
  scoreboard: { margin: 10, padding: 18, backgroundColor: '#164B8D', alignItems: 'center' },
  scoreMeta: { color: '#91C8FF', fontSize: 8, fontWeight: '900' },
  scoreTeams: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 12 },
  scoreTime: { color: '#D8E9FF', fontSize: 10, marginTop: 8 },
  groupHeading: { color: '#9EA8B5', fontSize: 9, fontWeight: '900', marginHorizontal: 12, marginVertical: 9 },
  marketPlaceholder: { height: 44, marginHorizontal: 10, marginBottom: 5, paddingHorizontal: 12, backgroundColor: '#222B37', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marketPlaceholderText: { color: '#D8DEE6', fontSize: 11, fontWeight: '700' },
  marketPlaceholderOdd: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  liveCount: { color: '#E33A43', fontSize: 9, fontWeight: '900' },
  infoCard: { margin: 10, padding: 14, borderLeftWidth: 3, borderLeftColor: '#1264C5', backgroundColor: '#151D28' },
  infoTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  infoBody: { color: '#929DAB', fontSize: 10, lineHeight: 15, marginTop: 5 },
  ticketCard: { margin: 10, padding: 14, backgroundColor: '#151D28', borderWidth: 1, borderColor: '#303A47' },
  ticketStatus: { color: '#70AFFF', fontSize: 8, fontWeight: '900' },
  ticketTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 9 },
  stakeRow: { marginTop: 18, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#303A47', flexDirection: 'row', justifyContent: 'space-between' },
  stakeLabel: { color: '#8F9AA8', fontSize: 9, fontWeight: '800' },
  stakeValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  placeButton: { height: 42, backgroundColor: '#20A20E', alignItems: 'center', justifyContent: 'center' },
  placeButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  ticketId: { color: '#75B5FF', fontSize: 9, marginTop: 8 },
  casinoGrid: { padding: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  gameTile: { width: '48.9%', height: 118, padding: 10, backgroundColor: '#232B36', justifyContent: 'space-between' },
  gameTileFeatured: { backgroundColor: '#164B8D' },
  gameBadge: { alignSelf: 'flex-start', color: '#FFFFFF', fontSize: 7, fontWeight: '900', backgroundColor: '#D92532', paddingHorizontal: 5, paddingVertical: 3 },
  gameTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  menuRow: { height: 54, paddingHorizontal: 14, backgroundColor: '#111823', borderBottomWidth: 1, borderBottomColor: '#252D39', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuText: { color: '#E8ECF1', fontSize: 12, fontWeight: '700' },
  emptyState: { margin: 22, paddingVertical: 54, alignItems: 'center' },
  emptyIcon: { color: '#398DEB', fontSize: 36 },
  emptyTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginTop: 14 },
  emptyBody: { maxWidth: 270, color: '#8995A3', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 7 },
});

export default App;
