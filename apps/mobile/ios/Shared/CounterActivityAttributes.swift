import ActivityKit

struct CounterActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var count: Int
    var isListening: Bool
  }

  var title: String
}
