import ActivityKit
import Foundation

enum LiveActivityManager {
    static func startOrUpdate(with state: BetweenUsState) async throws {
        let content = ActivityContent(
            state: state.activityState,
            staleDate: Date().addingTimeInterval(15 * 60)
        )
        if let activity = Activity<BetweenUsAttributes>.activities.first {
            await activity.update(content)
        } else {
            _ = try Activity.request(
                attributes: BetweenUsAttributes(nestName: "Between Us"),
                content: content,
                pushType: nil
            )
        }
    }

    static func stop() async {
        for activity in Activity<BetweenUsAttributes>.activities {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }
}

