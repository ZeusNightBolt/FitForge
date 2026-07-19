import Foundation

/// Debounces async type-ahead work and cancels stale requests
/// (BLUEPRINT §7.1 client behavior: debounce 150 ms, cancel stale requests).
///
/// Usage:
/// ```
/// await debouncer.run(delayMs: 150) { try await repo.searchFoods(...) }
/// ```
public actor Debouncer {
    private var task: Task<Void, Never>?

    public init() {}

    /// Cancels any in-flight work, waits `delayMs`, then runs `operation`.
    /// If cancelled during the delay, `operation` never runs.
    public func run(delayMs: UInt64 = 150, operation: @escaping @Sendable () async -> Void) {
        task?.cancel()
        task = Task {
            try? await Task.sleep(nanoseconds: delayMs * 1_000_000)
            if Task.isCancelled { return }
            await operation()
        }
    }

    public func cancel() {
        task?.cancel()
        task = nil
    }
}

public extension String {
    /// A trimmed, lowercased query; type-ahead requires ≥2 chars (§7.1).
    var searchNormalized: String { trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
    var isSearchable: Bool { searchNormalized.count >= 2 }
}
