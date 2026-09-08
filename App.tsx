import React, { useEffect, useState } from 'react';
import {
  Alert,
  NativeModules,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

type CounterLiveActivityModule = {
  start: (count: number) => Promise<string>;
  update: (count: number) => Promise<void>;
  end: () => Promise<void>;
  saveCount: (count: number) => void;
  sendNotification: (count: number) => Promise<void>;
};

const liveActivity = NativeModules.CounterLiveActivityModule as
  | CounterLiveActivityModule
  | undefined;

function App() {
  const [count, setCount] = useState(0);
  const [isLiveActivityActive, setIsLiveActivityActive] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      liveActivity?.saveCount(count);
    }

    if (!isLiveActivityActive || !liveActivity) {
      return;
    }

    liveActivity.update(count).catch(() => {
      setIsLiveActivityActive(false);
    });
  }, [count, isLiveActivityActive]);

  const toggleLiveActivity = async () => {
    if (!liveActivity) {
      Alert.alert(
        'Live Activity unavailable',
        'This feature is available in the installed iOS app.',
      );
      return;
    }

    try {
      if (isLiveActivityActive) {
        await liveActivity.end();
        setIsLiveActivityActive(false);
      } else {
        await liveActivity.start(count);
        setIsLiveActivityActive(true);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update Live Activity.';
      Alert.alert('Dynamic Island', message);
    }
  };

  const sendNotification = async () => {
    if (!liveActivity) {
      Alert.alert(
        'Notifications unavailable',
        'This feature is available in the installed iOS app.',
      );
      return;
    }

    try {
      await liveActivity.sendNotification(count);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to send notification.';
      Alert.alert('Notification', message);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <Text style={styles.eyebrow}>FEG CONTEXTFLOW</Text>
          <Text style={styles.title}>Simple Counter</Text>
          <Text
            accessibilityLabel={`Current count: ${count}`}
            style={styles.count}
            testID="counter-value"
          >
            {count}
          </Text>

          <View style={styles.buttonRow}>
            <CounterButton
              label="−"
              accessibilityLabel="Decrease counter"
              testID="decrease-button"
              onPress={() => setCount(value => value - 1)}
            />
            <CounterButton
              label="+"
              accessibilityLabel="Increase counter"
              testID="increase-button"
              primary
              onPress={() => setCount(value => value + 1)}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setCount(0)}
            style={({ pressed }) => [
              styles.resetButton,
              pressed && styles.pressed,
            ]}
            testID="reset-button"
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>

          {Platform.OS === 'ios' && (
            <View style={styles.iosActions}>
              <Pressable
                accessibilityRole="button"
                onPress={toggleLiveActivity}
                style={({ pressed }) => [
                  styles.liveActivityButton,
                  isLiveActivityActive && styles.liveActivityButtonActive,
                  pressed && styles.pressed,
                ]}
                testID="live-activity-button"
              >
                <Text
                  style={[
                    styles.liveActivityText,
                    isLiveActivityActive && styles.liveActivityTextActive,
                  ]}
                >
                  {isLiveActivityActive
                    ? 'End Live Activity'
                    : 'Start Live Activity'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={sendNotification}
                style={({ pressed }) => [
                  styles.notificationButton,
                  pressed && styles.pressed,
                ]}
                testID="notification-button"
              >
                <Text style={styles.notificationText}>Send Notification</Text>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

type CounterButtonProps = {
  label: string;
  accessibilityLabel: string;
  testID: string;
  primary?: boolean;
  onPress: () => void;
};

function CounterButton({
  label,
  accessibilityLabel,
  testID,
  primary = false,
  onPress,
}: CounterButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.counterButton,
        primary && styles.primaryButton,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <Text style={[styles.buttonText, primary && styles.primaryButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6FF',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: '#3559E0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    marginTop: 10,
    color: '#162044',
    fontSize: 30,
    fontWeight: '700',
  },
  count: {
    marginVertical: 44,
    color: '#162044',
    fontSize: 96,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 18,
  },
  counterButton: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    backgroundColor: '#E1E6FA',
  },
  primaryButton: {
    backgroundColor: '#3559E0',
  },
  buttonText: {
    color: '#162044',
    fontSize: 36,
    lineHeight: 40,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  resetButton: {
    marginTop: 28,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  resetText: {
    color: '#536086',
    fontSize: 16,
    fontWeight: '600',
  },
  liveActivityButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3559E0',
    borderRadius: 24,
  },
  liveActivityButtonActive: {
    backgroundColor: '#3559E0',
  },
  liveActivityText: {
    color: '#3559E0',
    fontSize: 15,
    fontWeight: '700',
  },
  liveActivityTextActive: {
    color: '#FFFFFF',
  },
  iosActions: {
    marginTop: 12,
    alignItems: 'center',
    gap: 10,
  },
  notificationButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#162044',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.65,
  },
});

export default App;
