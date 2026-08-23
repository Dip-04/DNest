import ActivityKit
import Foundation

struct BetweenUsLocation: Codable, Hashable, Sendable {
    let latitude: Double?
    let longitude: Double?
    let updatedAt: String?
}

struct BetweenUsPerson: Codable, Hashable, Sendable {
    let name: String
    let timezone: String
    let localTime: String
    let location: BetweenUsLocation?
}

struct BetweenUsState: Codable, Hashable, Sendable {
    let generatedAt: String
    let sharing: Bool
    let distanceKm: Int?
    let me: BetweenUsPerson
    let partner: BetweenUsPerson?

    static let placeholder = BetweenUsState(
        generatedAt: ISO8601DateFormatter().string(from: .now),
        sharing: false,
        distanceKm: nil,
        me: BetweenUsPerson(name: "Me", timezone: "UTC", localTime: "", location: nil),
        partner: BetweenUsPerson(name: "Partner", timezone: "UTC", localTime: "", location: nil)
    )
}

struct BetweenUsAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        let distanceKm: Int?
        let sharing: Bool
        let meName: String
        let partnerName: String
        let partnerLocalTime: String
        let updatedAt: Date
    }

    let nestName: String
}

extension BetweenUsState {
    var activityState: BetweenUsAttributes.ContentState {
        .init(
            distanceKm: distanceKm,
            sharing: sharing,
            meName: me.name,
            partnerName: partner?.name ?? "Partner",
            partnerLocalTime: partner?.localTime ?? "",
            updatedAt: .now
        )
    }
}

