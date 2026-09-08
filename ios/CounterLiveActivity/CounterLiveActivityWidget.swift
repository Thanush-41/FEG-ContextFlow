import ActivityKit
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
      }
      .padding()
      .activityBackgroundTint(Color.indigo.opacity(0.12))
      .activitySystemActionForegroundColor(.indigo)
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
          Text("FEG ContextFlow counter")
            .font(.caption)
            .foregroundStyle(.secondary)
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
    }
  }
}
