import SwiftUI
import WidgetKit

struct BetweenUsEntry: TimelineEntry {
    let date: Date
    let state: BetweenUsState
}

struct BetweenUsProvider: TimelineProvider {
    func placeholder(in context: Context) -> BetweenUsEntry {
        .init(date: .now, state: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (BetweenUsEntry) -> Void) {
        completion(.init(date: .now, state: WidgetStore.cachedState() ?? .placeholder))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<BetweenUsEntry>) -> Void) {
        Task {
            let state = (try? await WidgetAPI.fetch()) ?? WidgetStore.cachedState() ?? .placeholder
            let entry = BetweenUsEntry(date: .now, state: state)
            completion(Timeline(entries: [entry], policy: .after(Date().addingTimeInterval(15 * 60))))
        }
    }
}

struct BetweenUsWidget: Widget {
    let kind = "BetweenUsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: BetweenUsProvider()) { entry in
            BetweenUsWidgetView(entry: entry)
                .containerBackground(for: .widget) {
                    LinearGradient(
                        colors: [Color(red: 1, green: 0.96, blue: 0.97), Color(red: 0.91, green: 0.97, blue: 0.96)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                }
                .widgetURL(URL(string: WidgetStore.server + "/home"))
        }
        .configurationDisplayName("Between Us")
        .description("See your partner’s local time and your shared distance.")
        .supportedFamilies([.accessoryRectangular, .accessoryInline, .systemSmall])
    }
}

struct BetweenUsWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: BetweenUsEntry

    var body: some View {
        switch family {
        case .accessoryInline:
            Text(inlineText)
        case .accessoryRectangular:
            rectangular
        default:
            small
        }
    }

    private var rectangular: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("\(entry.state.me.name) ♥ \(entry.state.partner?.name ?? "Partner")")
                .font(.headline)
            Text(distanceText).font(.title3.bold())
            if let time = entry.state.partner?.localTime, !time.isEmpty {
                Text("Partner time · \(time)").font(.caption2)
            }
        }
        .containerBackground(.clear, for: .widget)
    }

    private var small: some View {
        VStack(spacing: 7) {
            HStack {
                avatar(entry.state.me.name)
                Spacer()
                Image(systemName: "heart.fill").foregroundStyle(.pink)
                Spacer()
                avatar(entry.state.partner?.name ?? "Partner")
            }
            RouteCurve().stroke(.blue.opacity(0.65), style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .frame(height: 30)
            Text(distanceText).font(.headline)
            if let partner = entry.state.partner {
                Text("\(partner.name) · \(partner.localTime)").font(.caption2).foregroundStyle(.secondary)
            }
        }
    }

    private func avatar(_ name: String) -> some View {
        Text(String(name.prefix(1)).uppercased())
            .font(.caption.bold())
            .frame(width: 32, height: 32)
            .background(.pink.opacity(0.2), in: Circle())
    }

    private var inlineText: String {
        entry.state.sharing ? "♥ \(distanceText)" : "♥ Waiting for both locations"
    }

    private var distanceText: String {
        guard entry.state.sharing, let distance = entry.state.distanceKm else {
            return "Locations needed"
        }
        return "\(distance) km apart"
    }
}

private struct RouteCurve: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: 2, y: rect.height * 0.25))
        path.addCurve(
            to: CGPoint(x: rect.maxX - 2, y: rect.height * 0.7),
            control1: CGPoint(x: rect.width * 0.35, y: rect.maxY),
            control2: CGPoint(x: rect.width * 0.65, y: 0)
        )
        return path
    }
}

