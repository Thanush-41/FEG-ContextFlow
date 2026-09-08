import ActivityKit
import AppIntents
import AVFoundation
import Foundation
import Speech
import WidgetKit

let counterAppGroup = "group.com.fegcontextflow.counter"
let counterVoiceProgressNotification = Notification.Name("CounterVoiceProgressNotification")

@MainActor
final class CounterVoiceSession {
  static let shared = CounterVoiceSession()

  private let audioEngine = AVAudioEngine()
  private let speechRecognizer = SFSpeechRecognizer()
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var hasAudioTap = false
  private var baseCount = 0
  private var transcript = ""
  private var wordCount = 0
  private var stopping = false

  var isListening: Bool {
    audioEngine.isRunning
  }

  func start() throws {
    guard !audioEngine.isRunning else { return }
    guard #available(iOS 16.2, *),
          !Activity<CounterActivityAttributes>.activities.isEmpty else {
      throw CounterVoiceError.liveActivityRequired
    }
    guard SFSpeechRecognizer.authorizationStatus() == .authorized else {
      throw CounterVoiceError.permissionsRequired
    }
    guard AVAudioSession.sharedInstance().recordPermission == .granted else {
      throw CounterVoiceError.permissionsRequired
    }
    guard let speechRecognizer, speechRecognizer.isAvailable else {
      throw CounterVoiceError.speechUnavailable
    }

    recognitionTask?.cancel()
    recognitionTask = nil
    stopping = false
    transcript = ""
    wordCount = 0
    baseCount = defaults.integer(forKey: "count")

    let audioSession = AVAudioSession.sharedInstance()
    try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
    try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

    let request = SFSpeechAudioBufferRecognitionRequest()
    request.shouldReportPartialResults = true
    recognitionRequest = request

    let inputNode = audioEngine.inputNode
    let format = inputNode.outputFormat(forBus: 0)
    guard format.sampleRate > 0 else {
      throw CounterVoiceError.invalidAudioFormat
    }

    inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
      request.append(buffer)
    }
    hasAudioTap = true

    recognitionTask = speechRecognizer.recognitionTask(with: request) { [weak self] result, error in
      Task { @MainActor in
        guard let self else { return }
        if let result {
          self.transcript = result.bestTranscription.formattedString
          self.wordCount = self.countWords(in: self.transcript)
          self.publish(isFinal: result.isFinal, error: nil)
          if result.isFinal {
            self.stop(emitFinal: false)
          }
        } else if let error, !self.stopping {
          self.publish(isFinal: true, error: error.localizedDescription)
          self.stop(emitFinal: false)
        }
      }
    }

    audioEngine.prepare()
    try audioEngine.start()
    publish(isFinal: false, error: nil)
  }

  func stop(emitFinal: Bool = true) {
    stopping = true
    if audioEngine.isRunning {
      audioEngine.stop()
    }
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()
    recognitionTask = nil
    recognitionRequest = nil
    if hasAudioTap {
      audioEngine.inputNode.removeTap(onBus: 0)
      hasAudioTap = false
    }
    try? AVAudioSession.sharedInstance().setActive(
      false,
      options: .notifyOthersOnDeactivation
    )
    if emitFinal {
      publish(isFinal: true, error: nil)
    } else {
      persistAndRefresh(isListening: false)
    }
  }

  private var defaults: UserDefaults {
    UserDefaults(suiteName: counterAppGroup) ?? .standard
  }

  private func publish(isFinal: Bool, error: String?) {
    let listening = !isFinal && audioEngine.isRunning
    persistAndRefresh(isListening: listening)

    var info: [String: Any] = [
      "transcript": transcript,
      "wordCount": wordCount,
      "isFinal": isFinal,
    ]
    if let error {
      info["error"] = error
    }
    NotificationCenter.default.post(
      name: counterVoiceProgressNotification,
      object: nil,
      userInfo: info
    )
  }

  private func persistAndRefresh(isListening: Bool) {
    let count = baseCount + wordCount
    defaults.set(count, forKey: "count")
    defaults.set(isListening, forKey: "isListening")
    WidgetCenter.shared.reloadTimelines(ofKind: "CounterHomeWidget")

    guard #available(iOS 16.2, *) else { return }
    let state = CounterActivityAttributes.ContentState(
      count: count,
      isListening: isListening
    )
    let content = ActivityContent(state: state, staleDate: nil)
    Task {
      for activity in Activity<CounterActivityAttributes>.activities {
        await activity.update(content)
      }
    }
  }

  private func countWords(in value: String) -> Int {
    var count = 0
    value.enumerateSubstrings(
      in: value.startIndex..<value.endIndex,
      options: [.byWords, .localized]
    ) { _, _, _, _ in count += 1 }
    return count
  }
}

@available(iOS 18.0, *)
struct ToggleCounterVoiceIntent: LiveActivityIntent, AudioRecordingIntent {
  static let title: LocalizedStringResource = "Start or stop FEG voice counting"
  static let description = IntentDescription(
    "Counts spoken words and updates the FEG counter without opening the app."
  )
  static let openAppWhenRun = false

  @MainActor
  func perform() async throws -> some IntentResult {
    if CounterVoiceSession.shared.isListening {
      CounterVoiceSession.shared.stop()
    } else {
      try CounterVoiceSession.shared.start()
    }
    return .result()
  }
}

enum CounterVoiceError: LocalizedError {
  case permissionsRequired
  case liveActivityRequired
  case speechUnavailable
  case invalidAudioFormat

  var errorDescription: String? {
    switch self {
    case .permissionsRequired:
      return "Open FEG ContextFlow once and allow Microphone and Speech Recognition."
    case .liveActivityRequired:
      return "Start the FEG Counter Live Activity before using voice counting."
    case .speechUnavailable:
      return "Speech recognition is currently unavailable."
    case .invalidAudioFormat:
      return "The microphone did not provide a valid audio format."
    }
  }
}
