import SwiftUI

/// Switches between the auth gate, onboarding flow, and the main tab bar based
/// on `SessionModel.phase`.
struct RootView: View {
    @Environment(\.appEnvironment) private var env
    @Environment(SessionModel.self) private var session

    var body: some View {
        Group {
            switch session.phase {
            case .launching:
                LaunchView()
            case .signedOut:
                AuthView()
            case .onboarding(let resumeStep):
                OnboardingFlowView(resumeStep: resumeStep)
            case .ready:
                MainTabView()
            }
        }
        .animation(.easeInOut(duration: 0.3), value: session.phase)
    }
}

/// Simple branded launch/splash while the initial phase resolves.
struct LaunchView: View {
    var body: some View {
        ZStack {
            Palette.background.ignoresSafeArea()
            VStack(spacing: Spacing.l) {
                Image(systemName: "bolt.heart.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(Palette.accent)
                Text("FitForge").font(.ffLargeTitle).foregroundStyle(Palette.textPrimary)
                ProgressView().padding(.top)
            }
        }
    }
}

/// The main authenticated shell — a TabView per §2.3.
struct MainTabView: View {
    var body: some View {
        TabView {
            TodayView()
                .tabItem { Label("Today", systemImage: "sun.max.fill") }
            RoutinesListView()
                .tabItem { Label("Workouts", systemImage: "dumbbell.fill") }
            NutritionView()
                .tabItem { Label("Nutrition", systemImage: "fork.knife") }
            ProgressDashboardView()
                .tabItem { Label("Progress", systemImage: "chart.xyaxis.line") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .tint(Palette.accent)
    }
}

#Preview("Launch") {
    LaunchView()
}

#Preview("Main tabs") {
    MainTabView()
        .environment(\.appEnvironment, .preview())
        .environment(SessionModel(env: .preview()))
}
