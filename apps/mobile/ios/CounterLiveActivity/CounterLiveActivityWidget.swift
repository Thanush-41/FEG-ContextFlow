import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

struct CounterLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: CounterActivityAttributes.self) { context in
      HStack(spacing: 16) {
        Image(systemName: "number.circle.fill")
          .font(.system(size: 34))
          .foregroundStyle(.indigo)

        VStack(alignment: .leading, spacing: 2) {
          Text(context.attributes.title)
            .font(.caption)
            .foregroundStyle(.secondary)
          Text("Count: \(context.state.count)")
            .font(.title2.bold())
        }

        Spacer()

        if #available(iOSApplicationExtension 18.0, *) {
          Button(intent: ToggleCounterVoiceIntent()) {
            Image(systemName: context.state.isListening ? "stop.fill" : "mic.fill")
          }
          .buttonStyle(.borderedProminent)
          .tint(context.state.isListening ? .red : .indigo)
        }
      }
      .padding()
      .activityBackgroundTint(Color.indigo.opacity(0.12))
      .activitySystemActionForegroundColor(.indigo)
      .widgetURL(URL(string: "fegcontextflow://voice"))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Image(systemName: "number.circle.fill")
            .foregroundStyle(.indigo)
        }

        DynamicIslandExpandedRegion(.trailing) {
          Text("\(context.state.count)")
            .font(.title2.bold())
            .monospacedDigit()
        }

        DynamicIslandExpandedRegion(.bottom) {
          if #available(iOSApplicationExtension 18.0, *) {
            Button(intent: ToggleCounterVoiceIntent()) {
              Label(
                context.state.isListening ? "Stop voice counting" : "Start voice counting",
                systemImage: context.state.isListening ? "stop.fill" : "mic.fill"
              )
              .font(.caption.bold())
            }
            .buttonStyle(.borderedProminent)
            .tint(context.state.isListening ? .red : .indigo)
          } else {
            Text("Open FEG ContextFlow to speak")
              .font(.caption)
          }
        }
      } compactLeading: {
        Image(systemName: "number")
          .foregroundStyle(.indigo)
      } compactTrailing: {
        Text("\(context.state.count)")
          .fontWeight(.semibold)
          .monospacedDigit()
      } minimal: {
        Text("\(context.state.count)")
          .font(.caption.bold())
          .monospacedDigit()
      }
      .keylineTint(.indigo)
      .widgetURL(URL(string: "fegcontextflow://voice"))
    }
  }
}
