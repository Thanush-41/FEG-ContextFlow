import AppIntents
import SwiftUI
import WidgetKit

struct CounterEntry: TimelineEntry {
  let date: Date
  let count: Int
  let isListening: Bool
}

struct CounterProvider: TimelineProvider {
  func placeholder(in context: Context) -> CounterEntry {
    CounterEntry(date: Date(), count: 0, isListening: false)
  }

  func getSnapshot(in context: Context, completion: @escaping (CounterEntry) -> Void) {
    completion(currentEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<CounterEntry>) -> Void) {
    completion(Timeline(entries: [currentEntry()], policy: .never))
  }

  private func currentEntry() -> CounterEntry {
    let count = UserDefaults(suiteName: counterAppGroup)?.integer(forKey: "count") ?? 0
    let isListening = UserDefaults(suiteName: counterAppGroup)?
      .bool(forKey: "isListening") ?? false
    return CounterEntry(date: Date(), count: count, isListening: isListening)
  }
}

struct CounterHomeWidgetView: View {
  let entry: CounterEntry

  var body: some View {
    if #available(iOSApplicationExtension 17.0, *) {
      content
        .containerBackground(Color.indigo.opacity(0.12), for: .widget)
    } else {
      content
        .padding()
        .background(Color.indigo.opacity(0.12))
    }
  }

  private var content: some View {
    VStack(alignment: .leading, spacing: 8) {
      Label("FEG Counter", systemImage: "number.circle.fill")
        .font(.caption.bold())
        .foregroundStyle(.indigo)

      Spacer()

      Text("\(entry.count)")
        .font(.system(size: 48, weight: .bold, design: .rounded))
        .monospacedDigit()
        .minimumScaleFactor(0.6)

      Text("Current count")
        .font(.caption)
        .foregroundStyle(.secondary)

      if #available(iOSApplicationExtension 18.0, *) {
        Button(intent: ToggleCounterVoiceIntent()) {
          Label(
            entry.isListening ? "Stop" : "Speak",
            systemImage: entry.isListening ? "stop.fill" : "mic.fill"
          )
          .font(.caption2.bold())
        }
        .buttonStyle(.borderedProminent)
        .tint(entry.isListening ? .red : .indigo)
      } else {
        Label("Open to speak", systemImage: "mic.fill")
          .font(.caption2.bold())
          .foregroundStyle(.indigo)
      }
    }
    .padding()
    .widgetURL(URL(string: "fegcontextflow://voice"))
  }
}

struct CounterHomeWidget: Widget {
  let kind = "CounterHomeWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: CounterProvider()) { entry in
      CounterHomeWidgetView(entry: entry)
    }
    .configurationDisplayName("FEG Counter")
    .description("See your current counter value on the Home Screen.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
