import Foundation
import Supabase

/// Shared Supabase client and small conveniences layered on top of
/// `supabase-swift`. A single actor-safe instance is created from `AppConfig`
/// and shared across all live repositories.
public enum SupabaseStack {
    public static let client: SupabaseClient = SupabaseClient(
        supabaseURL: AppConfig.supabaseURL,
        supabaseKey: AppConfig.supabaseAnonKey
    )
}

public extension SupabaseClient {
    /// The current authenticated user id, or nil when logged out.
    var currentUserId: UUID? {
        get async {
            do { return try await auth.session.user.id }
            catch { return nil }
        }
    }
}

/// A typed error surfaced to the UI so views can render friendly copy without
/// leaking Postgrest/GoTrue internals.
public enum RepositoryError: LocalizedError, Sendable {
    case notAuthenticated
    case notFound
    case decoding(String)
    case underlying(String)

    public var errorDescription: String? {
        switch self {
        case .notAuthenticated: return "You need to be signed in to do that."
        case .notFound: return "We couldn't find what you were looking for."
        case .decoding(let m): return "Unexpected data from the server. (\(m))"
        case .underlying(let m): return m
        }
    }
}
