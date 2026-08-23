import ActivityKit
import SwiftUI
import WidgetKit

struct BetweenUsLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: BetweenUsAttributes.self) { context in
            HStack(spacing: 14) {
                Image(systemName: "location.heart.fill")
                    .font(.title2)
                    .foregroundStyle(.pink)
                VStack(alignment: .leading, spacing: 3) {
                    Text("\(context.state.meName) ♥ \(context.state.partnerName)")
                        .font(.headline)
                    Text(distance(context.state)).font(.title3.bold())
                    if !context.state.partnerLocalTime.isEmpty {
                        Text("Partner time · \(context.state.partnerLocalTime)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
            }
            .padding(.horizontal)
            .activityBackgroundTint(Color(red: 1, green: 0.96, blue: 0.97))
            .activitySystemActionForegroundColor(.pink)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.state.meName).font(.caption.bold())
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.partnerName).font(.caption.bold())
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(distance(context.state)).font(.headline)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.state.partnerLocalTime).font(.caption)
                }
            } compactLeading: {
                Image(systemName: "heart.fill").foregroundStyle(.pink)
            } compactTrailing: {
                Text(context.state.distanceKm.map { "\($0)km" } ?? "—")
            } minimal: {
                Image(systemName: "heart.fill").foregroundStyle(.pink)
            }
        }
    }

    private func distance(_ state: BetweenUsAttributes.ContentState) -> String {
        state.sharing ? state.distanceKm.map { "\($0) km apart" } ?? "Updating…" : "Waiting for both locations"
    }
}

