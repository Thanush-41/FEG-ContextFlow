import SwiftUI
import WidgetKit

@main
struct CounterLiveActivityBundle: WidgetBundle {
  var body: some Widget {
    CounterHomeWidget()
    CounterLiveActivityWidget()
  }
}
