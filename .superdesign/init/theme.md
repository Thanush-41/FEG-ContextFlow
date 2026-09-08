# Theme

## Compact token summary

- Framework: bare React Native 0.87 with `StyleSheet`; no CSS framework or UI library.
- Font: platform system family; weights 600, 700 and 800.
- Canvas: `#F4F6FF`; text: `#162044`; muted text: `#536086`.
- Primary indigo: `#3559E0`; primary soft: `#E1E6FA`; white: `#FFFFFF`.
- Voice violet: `#7C3AED`; active/error red: `#DC2626`.
- Horizontal screen padding: 24; common gaps: 10, 12 and 18.
- Pills: radius 24; circular counter controls: 72 by 72, radius 36.
- No shadows, custom breakpoints, dark theme, or custom font is implemented.

## Raw source

Source: `apps/mobile/App.tsx`

```tsx
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F6FF' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: '#3559E0', fontSize: 13, fontWeight: '700', letterSpacing: 2,
  },
  title: { marginTop: 10, color: '#162044', fontSize: 30, fontWeight: '700' },
  count: {
    marginVertical: 44,
    color: '#162044',
    fontSize: 96,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  buttonRow: { flexDirection: 'row', gap: 18 },
  counterButton: {
    width: 72, height: 72, alignItems: 'center', justifyContent: 'center',
    borderRadius: 36, backgroundColor: '#E1E6FA',
  },
  primaryButton: { backgroundColor: '#3559E0' },
  buttonText: { color: '#162044', fontSize: 36, lineHeight: 40 },
  primaryButtonText: { color: '#FFFFFF' },
  resetButton: { marginTop: 28, paddingHorizontal: 22, paddingVertical: 12 },
  resetText: { color: '#536086', fontSize: 16, fontWeight: '600' },
  liveActivityButton: {
    paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1,
    borderColor: '#3559E0', borderRadius: 24,
  },
  liveActivityButtonActive: { backgroundColor: '#3559E0' },
  liveActivityText: { color: '#3559E0', fontSize: 15, fontWeight: '700' },
  liveActivityTextActive: { color: '#FFFFFF' },
  iosActions: { marginTop: 12, alignItems: 'center', gap: 10 },
  notificationButton: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
    backgroundColor: '#162044',
  },
  notificationText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  voiceButton: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
    backgroundColor: '#7C3AED',
  },
  voiceButtonActive: { backgroundColor: '#DC2626' },
  voiceButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  voiceHint: { maxWidth: 300, color: '#536086', fontSize: 13, textAlign: 'center' },
  pressed: { opacity: 0.65 },
});
```
