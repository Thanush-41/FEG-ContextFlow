import ActivityKit
import AVFoundation
import Foundation
import React
import Speech
import UserNotifications
import WidgetKit

@objc(CounterLiveActivityModule)
final class CounterLiveActivityModule: RCTEventEmitter {
  private var progressObserver: NSObjectProtocol?

  override init() {
    super.init()
    progressObserver = NotificationCenter.default.addObserver(
      forName: counterVoiceProgressNotification,
      object: nil,
      queue: .main
    ) { [weak self] notification in
      self?.sendEvent(
        withName: "CounterVoiceProgress",
        body: notification.userInfo ?? [:]
      )
    }
  }

  deinit {
    if let progressObserver {
      NotificationCenter.default.removeObserver(progressObserver)
    }
  }

  @objc
  override static func requiresMainQueueSetup() -> Bool {
    false
  }

  override func supportedEvents() -> [String]! {
    ["CounterVoiceProgress"]
  }

  @objc(saveCount:)
  func saveCount(_ count: NSNumber) {
    UserDefaults(suiteName: counterAppGroup)?.set(count.intValue, forKey: "count")
    WidgetCenter.shared.reloadTimelines(ofKind: "CounterHomeWidget")
  }

  @objc(getSavedCount:rejecter:)
  func getSavedCount(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let count = UserDefaults(suiteName: counterAppGroup)?.integer(forKey: "count") ?? 0
    resolve(count)
  }

  @objc(isActive:rejecter:)
  func isActive(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      resolve(false)
      return
    }
    resolve(!Activity<CounterActivityAttributes>.activities.isEmpty)
  }

  @objc(startVoiceRecognition:rejecter:)
  func startVoiceRecognition(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard SFSpeechRecognizer()?.isAvailable == true else {
      reject("speech_unavailable", "Speech recognition is currently unavailable.", nil)
      return
    }

    SFSpeechRecognizer.requestAuthorization { status in
      guard status == .authorized else {
        reject("speech_denied", "Speech recognition permission is required.", nil)
        return
      }

      AVAudioSession.sharedInstance().requestRecordPermission { granted in
        guard granted else {
          reject("microphone_denied", "Microphone permission is required.", nil)
          return
        }

        Task { @MainActor in
          do {
            try CounterVoiceSession.shared.start()
            resolve(nil)
          } catch {
            reject("speech_start_failed", error.localizedDescription, error)
          }
        }
      }
    }
  }

  @objc(stopVoiceRecognition:rejecter:)
  func stopVoiceRecognition(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    Task { @MainActor in
      CounterVoiceSession.shared.stop()
      resolve(nil)
    }
  }

  @objc(sendNotification:resolver:rejecter:)
  func sendNotification(
    _ count: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let center = UNUserNotificationCenter.current()
    center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
      if let error {
        reject("permission_failed", error.localizedDescription, error)
        return
      }

      guard granted else {
        reject("permission_denied", "Notifications are disabled for this app.", nil)
        return
      }

      let content = UNMutableNotificationContent()
      content.title = "FEG Counter"
      content.body = "Your current count is \(count.intValue)."
      content.sound = .default

      let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
      let request = UNNotificationRequest(
        identifier: UUID().uuidString,
        content: content,
        trigger: trigger
      )
      center.add(request) { error in
        if let error {
          reject("notification_failed", error.localizedDescription, error)
        } else {
          resolve(nil)
        }
      }
    }
  }

  @objc(start:resolver:rejecter:)
  func start(
    _ count: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      reject("unsupported", "Live Activities require iOS 16.2 or later.", nil)
      return
    }

    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      reject("disabled", "Live Activities are disabled for this app.", nil)
      return
    }

    Task {
      do {
        for existingActivity in Activity<CounterActivityAttributes>.activities {
          await existingActivity.end(nil, dismissalPolicy: .immediate)
        }

        let attributes = CounterActivityAttributes(title: "FEG Counter")
        let state = CounterActivityAttributes.ContentState(
          count: count.intValue,
          isListening: false
        )
        let activity = try Activity.request(
          attributes: attributes,
          content: ActivityContent(state: state, staleDate: nil),
          pushType: nil
        )
        resolve(activity.id)
      } catch {
        reject("start_failed", error.localizedDescription, error)
      }
    }
  }

  @objc(update:resolver:rejecter:)
  func update(
    _ count: NSNumber,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      reject("unsupported", "Live Activities require iOS 16.2 or later.", nil)
      return
    }

    Task {
      let listening = UserDefaults(suiteName: counterAppGroup)?
        .bool(forKey: "isListening") ?? false
      let state = CounterActivityAttributes.ContentState(
        count: count.intValue,
        isListening: listening
      )
      let content = ActivityContent(state: state, staleDate: nil)
      for activity in Activity<CounterActivityAttributes>.activities {
        await activity.update(content)
      }
      resolve(nil)
    }
  }

  @objc(end:rejecter:)
  func end(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard #available(iOS 16.2, *) else {
      reject("unsupported", "Live Activities require iOS 16.2 or later.", nil)
      return
    }

    Task {
      for activity in Activity<CounterActivityAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
      resolve(nil)
    }
  }
}
