import SwiftUI
import WidgetKit

struct SetupView: View {
    @EnvironmentObject private var location: LocationCoordinator
    @State private var server = WidgetStore.server
    @State private var token = WidgetStore.token
    @State private var message = "Connect from DNest Settings, then enable location."

    var body: some View {
        NavigationStack {
            Form {
                Section("Private connection") {
                    TextField("https://your-dnest-domain.com", text: $server)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                    SecureField("Private widget key", text: $token)
                    Button("Save connection") {
                        WidgetStore.connect(server: server, token: token)
                        Task { await refresh() }
                    }
                }

                Section("Between Us") {
                    Button("Enable live lock-screen distance") {
                        WidgetStore.connect(server: server, token: token)
                        location.start()
                        Task { await refresh(startActivity: true) }
                    }
                    Button("Refresh now") { Task { await refresh() } }
                    Button("Stop live distance", role: .destructive) {
                        location.stop()
                        Task { await LiveActivityManager.stop() }
                    }
                    Text(message).font(.footnote).foregroundStyle(.secondary)
                }

                Section("How it works") {
                    Text("DNest shares location only after you explicitly enable it. iOS controls widget refresh timing; the Live Activity updates whenever the app receives a location update.")
                        .font(.footnote)
                }
            }
            .navigationTitle("DNest")
        }
    }

    @MainActor
    private func refresh(startActivity: Bool = false) async {
        do {
            let state = try await WidgetAPI.fetch()
            WidgetCenter.shared.reloadAllTimelines()
            if startActivity { try await LiveActivityManager.startOrUpdate(with: state) }
            message = state.sharing
                ? "Live · \(state.distanceKm ?? 0) km apart"
                : "Connected. Both partners need to enable location."
        } catch {
            message = error.localizedDescription
        }
    }
}

