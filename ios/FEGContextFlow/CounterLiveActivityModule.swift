import ActivityKit
import Foundation
import React
import UserNotifications
import WidgetKit

@objc(CounterLiveActivityModule)
final class CounterLiveActivityModule: NSObject {
  private let appGroup = "group.com.fegcontextflow.counter"

  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc(saveCount:)
  func saveCount(_ count: NSNumber) {
    UserDefaults(suiteName: appGroup)?.set(count.intValue, forKey: "count")
    WidgetCenter.shared.reloadTimelines(ofKind: "CounterHomeWidget")
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
        let state = CounterActivityAttributes.ContentState(count: count.intValue)
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
      let state = CounterActivityAttributes.ContentState(count: count.intValue)
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
