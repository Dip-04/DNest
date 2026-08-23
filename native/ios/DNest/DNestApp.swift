import SwiftUI

@main
struct DNestApp: App {
    @StateObject private var location = LocationCoordinator()

    var body: some Scene {
        WindowGroup {
            SetupView()
                .environmentObject(location)
                .onOpenURL { url in
                    guard url.scheme == "dnest", url.host == "connect",
                          let parts = URLComponents(url: url, resolvingAgainstBaseURL: false),
                          let server = parts.queryItems?.first(where: { $0.name == "server" })?.value,
                          let token = parts.queryItems?.first(where: { $0.name == "token" })?.value else { return }
                    WidgetStore.connect(server: server, token: token)
                    location.start()
                }
        }
    }
}

