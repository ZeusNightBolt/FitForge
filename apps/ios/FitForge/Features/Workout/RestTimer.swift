import SwiftUI
import Observation
import UserNotifications

/// Rest timer that counts down after a set is completed and fires a local
/// notification when it elapses (BLUEPRINT §2.3 "rest timer auto-starts on set
/// completion"; §9 "Live Activity-ready structure — local notification is enough
/// for MVP"). The countdown is driven by a wall-clock end date so it stays
/// accurate if the app is backgrounded.
@MainActor
@Observable
public final class RestTimer {
    public private(set) var remaining: Int = 0
    public private(set) var total: Int = 0
    public private(set) var isRunning = false

    private var ticker: Timer?
    private var endDate: Date?
    private let notificationId = "fitforge.rest-timer"

    public init() {}

    public func start(seconds: Int) {
        cancelPendingNotification()
        total = seconds
        remaining = seconds
        endDate = Date().addingTimeInterval(TimeInterval(seconds))
        isRunning = true
        Haptics.impact(.medium)
        scheduleNotification(after: seconds)
        ticker?.invalidate()
        ticker = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.tick() }
        }
    }

    public func addTime(_ seconds: Int) {
        guard isRunning, let end = endDate else { return }
        endDate = end.addingTimeInterval(TimeInterval(seconds))
        total += seconds
        cancelPendingNotification()
        scheduleNotification(after: max(0, Int(endDate!.timeIntervalSinceNow)))
        tick()
    }

    public func skip() { finish() }

    private func tick() {
        guard let end = endDate else { return }
        remaining = max(0, Int(end.timeIntervalSinceNow.rounded()))
        if remaining <= 0 { finish() }
    }

    private func finish() {
        ticker?.invalidate(); ticker = nil
        isRunning = false
        remaining = 0
        endDate = nil
        cancelPendingNotification()
        Haptics.notify(.success)
    }

    public var progress: Double { total > 0 ? Double(total - remaining) / Double(total) : 0 }

    // MARK: Local notification

    private func scheduleNotification(after seconds: Int) {
        guard seconds > 0 else { return }
        let content = UNMutableNotificationContent()
        content.title = "Rest complete"
        content.body = "Time for your next set."
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: TimeInterval(seconds), repeats: false)
        let request = UNNotificationRequest(identifier: notificationId, content: content, trigger: trigger)
        UNUserNotificationCenter.current().add(request)
    }

    private func cancelPendingNotification() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [notificationId])
    }
}
