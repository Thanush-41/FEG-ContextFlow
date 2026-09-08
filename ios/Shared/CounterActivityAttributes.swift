import ActivityKit

struct CounterActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var count: Int
  }

  var title: String
}
