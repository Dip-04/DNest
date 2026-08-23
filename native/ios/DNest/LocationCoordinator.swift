import CoreLocation
import Combine
import Foundation
import WidgetKit

@MainActor
final class LocationCoordinator: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        manager.distanceFilter = 50
        manager.activityType = .other
        manager.pausesLocationUpdatesAutomatically = true
    }

    func start() {
        guard WidgetStore.configured else { return }
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse:
            manager.requestAlwaysAuthorization()
            beginUpdates()
        case .authorizedAlways:
            beginUpdates()
        default:
            break
        }
    }

    func stop() {
        manager.stopUpdatingLocation()
        manager.allowsBackgroundLocationUpdates = false
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if manager.authorizationStatus == .authorizedWhenInUse {
            manager.requestAlwaysAuthorization()
        }
        if manager.authorizationStatus == .authorizedAlways || manager.authorizationStatus == .authorizedWhenInUse {
            beginUpdates()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        Task {
            do {
                try await WidgetAPI.upload(
                    latitude: location.coordinate.latitude,
                    longitude: location.coordinate.longitude
                )
                let state = try await WidgetAPI.fetch()
                WidgetCenter.shared.reloadAllTimelines()
                try await LiveActivityManager.startOrUpdate(with: state)
            } catch {
                // The next accepted location update retries automatically.
            }
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {}

    private func beginUpdates() {
        manager.allowsBackgroundLocationUpdates = manager.authorizationStatus == .authorizedAlways
        manager.showsBackgroundLocationIndicator = true
        manager.startUpdatingLocation()
    }
}
