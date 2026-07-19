import SwiftUI
import UserNotifications

@main
struct FitForgeApp: App {
    // The live, Supabase-backed environment. Previews use `.preview()`.
    @State private var env = AppEnvironment.live()
    @State private var session: SessionModel

    init() {
        let liveEnv = AppEnvironment.live()
        _env = State(initialValue: liveEnv)
        _session = State(initialValue: SessionModel(env: liveEnv))
        // Ask for notification permission early so the workout rest timer can fire (§2.3).
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(\.appEnvironment, env)
                .environment(session)
                .tint(Palette.accent)
                .task { session.start() }
        }
    }
}
