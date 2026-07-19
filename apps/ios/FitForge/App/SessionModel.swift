import SwiftUI
import Observation

/// Top-level app phase driving `RootView`.
public enum AppPhase: Equatable {
    case launching
    case signedOut
    case onboarding(resumeStep: String)
    case ready
}

/// Owns auth + onboarding-completion state and decides the app phase.
/// Observed by `RootView`; also injected so features can trigger sign-out etc.
@MainActor
@Observable
public final class SessionModel {
    public private(set) var phase: AppPhase = .launching
    public private(set) var userId: UUID?
    public var profile: Profile?

    private let env: AppEnvironment
    private var authTask: Task<Void, Never>?

    public init(env: AppEnvironment) {
        self.env = env
    }

    public func start() {
        authTask?.cancel()
        authTask = Task { [weak self] in
            guard let self else { return }
            // Resolve the initial phase immediately, then watch for changes.
            await self.resolvePhase(userId: await env.auth.currentUserId())
            for await uid in env.auth.authState {
                await self.resolvePhase(userId: uid)
            }
        }
    }

    private func resolvePhase(userId: UUID?) async {
        self.userId = userId
        guard userId != nil else {
            phase = .signedOut
            profile = nil
            return
        }
        // Use the onboarding_status RPC to resume at the right screen (§2.2).
        do {
            let status = try await env.onboarding.onboardingStatus()
            if status.complete {
                profile = try? await env.onboarding.loadProfile()
                phase = .ready
            } else {
                phase = .onboarding(resumeStep: status.resumeStep)
            }
        } catch {
            // Fall back to the profile's own pointer if the RPC is unavailable.
            if let profile = try? await env.onboarding.loadProfile() {
                self.profile = profile
                phase = profile.isOnboardingComplete ? .ready : .onboarding(resumeStep: profile.onboardingStep)
            } else {
                phase = .onboarding(resumeStep: "goals")
            }
        }
    }

    public func completeOnboarding() {
        Task { await resolvePhase(userId: userId) }
    }

    public func signOut() {
        Task {
            try? await env.auth.signOut()
            await resolvePhase(userId: nil)
        }
    }
}
