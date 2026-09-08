import SwiftUI
import WidgetKit

private let counterAppGroup = "group.com.fegcontextflow.counter"

struct CounterEntry: TimelineEntry {
  let date: Date
  let count: Int
}

struct CounterProvider: TimelineProvider {
  func placeholder(in context: Context) -> CounterEntry {
    CounterEntry(date: Date(), count: 0)
  }

  func getSnapshot(in context: Context, completion: @escaping (CounterEntry) -> Void) {
    completion(currentEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<CounterEntry>) -> Void) {
    completion(Timeline(entries: [currentEntry()], policy: .never))
  }

  private func currentEntry() -> CounterEntry {
    let count = UserDefaults(suiteName: counterAppGroup)?.integer(forKey: "count") ?? 0
    return CounterEntry(date: Date(), count: count)
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
    }
    .padding()
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
