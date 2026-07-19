import SwiftUI
import AuthenticationServices
import CryptoKit

/// Screens 0–1 of §2.2: Welcome value prop + Sign in with Apple (via Supabase).
/// A hashed nonce protects the Apple id-token exchange.
struct AuthView: View {
    @Environment(\.appEnvironment) private var env
    @Environment(SessionModel.self) private var session
    @Environment(\.colorScheme) private var colorScheme

    @State private var rawNonce = AuthView.randomNonce()
    @State private var errorMessage: String?
    @State private var isWorking = false

    var body: some View {
        ZStack {
            Palette.background.ignoresSafeArea()
            VStack(spacing: Spacing.xl) {
                Spacer()
                VStack(spacing: Spacing.l) {
                    Image(systemName: "bolt.heart.fill")
                        .font(.system(size: 72)).foregroundStyle(Palette.accent)
                    Text("FitForge").font(.ffLargeTitle).foregroundStyle(Palette.textPrimary)
                    Text("Your personal trainer and nutrition guide — a plan built from your goals, equipment, and preferences.")
                        .font(.ffBody).foregroundStyle(Palette.textSecondary)
                        .multilineTextAlignment(.center)
                        .ffScreenPadding()
                }
                Spacer()

                VStack(spacing: Spacing.m) {
                    valueProp("figure.strengthtraining.traditional", "A starter routine from your equipment")
                    valueProp("fork.knife", "Calorie & macro targets, explained")
                    valueProp("arrow.triangle.2.circlepath", "Swap any exercise you can't do")
                }
                .ffScreenPadding()

                Spacer()

                if let errorMessage {
                    Text(errorMessage).font(.ffFootnote).foregroundStyle(Palette.danger)
                        .multilineTextAlignment(.center).ffScreenPadding()
                }

                SignInWithAppleButton(.signIn) { request in
                    request.requestedScopes = [.fullName, .email]
                    request.nonce = AuthView.sha256(rawNonce)
                } onCompletion: { result in
                    handle(result)
                }
                .signInWithAppleButtonStyle(colorScheme == .dark ? .white : .black)
                .frame(height: 52)
                .clipShape(RoundedRectangle(cornerRadius: Radius.m, style: .continuous))
                .ffScreenPadding()
                .disabled(isWorking)

                Text("By continuing you agree to our Terms & Privacy Policy.")
                    .font(.ffCaption).foregroundStyle(Palette.textSecondary)
                    .padding(.bottom, Spacing.l)
            }
        }
    }

    private func valueProp(_ icon: String, _ text: String) -> some View {
        HStack(spacing: Spacing.m) {
            Image(systemName: icon).foregroundStyle(Palette.accent).frame(width: 28)
            Text(text).font(.ffSubheadline).foregroundStyle(Palette.textPrimary)
            Spacer()
        }
    }

    private func handle(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            guard
                let credential = auth.credential as? ASAuthorizationAppleIDCredential,
                let tokenData = credential.identityToken,
                let idToken = String(data: tokenData, encoding: .utf8)
            else {
                errorMessage = "Apple didn't return an identity token. Please try again."
                return
            }
            isWorking = true
            Task {
                do {
                    _ = try await env.auth.signInWithApple(idToken: idToken, nonce: rawNonce)
                    Haptics.notify(.success)
                    // SessionModel's authState stream advances the phase.
                } catch {
                    errorMessage = error.localizedDescription
                    rawNonce = AuthView.randomNonce()
                }
                isWorking = false
            }
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code == .canceled { return }
            errorMessage = error.localizedDescription
        }
    }

    // MARK: Nonce helpers
    static func randomNonce(length: Int = 32) -> String {
        let chars = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length
        while remaining > 0 {
            var random: UInt8 = 0
            _ = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
            if random < chars.count {
                result.append(chars[Int(random)])
                remaining -= 1
            }
        }
        return result
    }

    static func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}

#Preview("Auth") {
    AuthView()
        .environment(\.appEnvironment, .preview())
        .environment(SessionModel(env: .preview()))
}
