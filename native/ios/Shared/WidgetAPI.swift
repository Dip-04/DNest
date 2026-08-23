import Foundation

enum WidgetAPIError: LocalizedError {
    case notConnected
    case invalidResponse(Int)

    var errorDescription: String? {
        switch self {
        case .notConnected: "Connect this phone from DNest Settings first."
        case .invalidResponse(let status): "DNest returned status \(status)."
        }
    }
}

enum WidgetAPI {
    static func fetch() async throws -> BetweenUsState {
        let request = try request(method: "GET")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw WidgetAPIError.invalidResponse((response as? HTTPURLResponse)?.statusCode ?? 0)
        }
        let state = try JSONDecoder().decode(BetweenUsState.self, from: data)
        WidgetStore.save(state)
        return state
    }

    static func upload(latitude: Double, longitude: Double) async throws {
        var request = try request(method: "POST")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "latitude": latitude,
            "longitude": longitude,
        ])
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw WidgetAPIError.invalidResponse((response as? HTTPURLResponse)?.statusCode ?? 0)
        }
    }

    private static func request(method: String) throws -> URLRequest {
        guard WidgetStore.configured,
              let url = URL(string: WidgetStore.server + "/api/native-widget/state") else {
            throw WidgetAPIError.notConnected
        }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(WidgetStore.token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.timeoutInterval = 15
        return request
    }
}

