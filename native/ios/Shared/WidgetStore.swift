import Foundation

enum WidgetStore {
    static let appGroup = "group.com.dnest.app"
    private static let serverKey = "widget.server"
    private static let tokenKey = "widget.token"
    private static let stateKey = "widget.state"

    private static var defaults: UserDefaults {
        UserDefaults(suiteName: appGroup) ?? .standard
    }

    static var server: String {
        defaults.string(forKey: serverKey) ?? ""
    }

    static var token: String {
        defaults.string(forKey: tokenKey) ?? ""
    }

    static var configured: Bool {
        server.hasPrefix("https://") && token.count >= 40
    }

    static func connect(server: String, token: String) {
        var normalized = server.trimmingCharacters(in: .whitespacesAndNewlines)
        while normalized.hasSuffix("/") { normalized.removeLast() }
        defaults.set(normalized, forKey: serverKey)
        defaults.set(token.trimmingCharacters(in: .whitespacesAndNewlines), forKey: tokenKey)
    }

    static func save(_ state: BetweenUsState) {
        if let data = try? JSONEncoder().encode(state) {
            defaults.set(data, forKey: stateKey)
        }
    }

    static func cachedState() -> BetweenUsState? {
        guard let data = defaults.data(forKey: stateKey) else { return nil }
        return try? JSONDecoder().decode(BetweenUsState.self, from: data)
    }
}

