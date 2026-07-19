import Foundation

/// App configuration, sourced from the bundle's `Info.plist` keys
/// `SUPABASE_URL` / `SUPABASE_ANON_KEY` (populated from `.env` at build time via
/// the XcodeGen `settings` / a build phase). Falls back to the local Supabase
/// dev stack defaults so previews and the simulator work out of the box.
public enum AppConfig {
    public static let supabaseURL: URL = {
        if let raw = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
           !raw.isEmpty, let url = URL(string: raw) {
            return url
        }
        // Local `supabase start` default.
        return URL(string: "http://127.0.0.1:54321")!
    }()

    public static let supabaseAnonKey: String = {
        if let raw = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String, !raw.isEmpty {
            return raw
        }
        // Well-known local anon key printed by `supabase start`.
        return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
               "eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24ifQ." +
               "625_WdcF3KHqz5amU0x2X5WWHP-OEs_4qj0ssLNHzTs"
    }()

    /// Sign in with Apple redirect scheme (matches `CFBundleURLSchemes` in project.yml).
    public static let appleRedirectScheme = "fitforge"

    public static let progressPhotosBucket = "progress-photos"
    public static let exerciseMediaBucket = "exercise-media"
}
