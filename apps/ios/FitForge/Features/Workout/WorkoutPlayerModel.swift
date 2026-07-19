import SwiftUI
import Observation

/// One editable set row in the player.
public struct SetEntry: Identifiable, Hashable, Sendable {
    public let id = UUID()
    public var setNumber: Int
    public var reps: Int
    public var weightKg: Double
    public var rpe: Double?
    public var isWarmup: Bool
    public var isLogged: Bool
    /// Ghosted previous-session value shown as the tap-to-log default (§2.3).
    public var ghostReps: Int?
    public var ghostWeight: Double?
}

/// Drives the workout player: per-exercise paging, ghost defaults from
/// `previous_sets`, set logging, rest timer, swap, and finishing.
@MainActor
@Observable
public final class WorkoutPlayerModel {
    public var day: RoutineDayTree
    public var exercises: [RoutineExerciseTree]
    public var currentIndex = 0
    public var setsByExercise: [UUID: [SetEntry]] = [:]
    public var session: WorkoutSession?
    public var isFinishing = false
    public var errorMessage: String?

    public let restTimer = RestTimer()

    private let env: AppEnvironment

    public init(day: RoutineDayTree, env: AppEnvironment) {
        self.day = day
        self.env = env
        self.exercises = day.routineExercises.sorted { $0.position < $1.position }
    }

    public var current: RoutineExerciseTree? {
        exercises.indices.contains(currentIndex) ? exercises[currentIndex] : nil
    }

    public var isLastExercise: Bool { currentIndex >= exercises.count - 1 }

    public var completedSetCount: Int {
        setsByExercise.values.flatMap { $0 }.filter(\.isLogged).count
    }

    public func startSession() async {
        do {
            session = try await env.workouts.startSession(routineDayId: day.id)
        } catch {
            errorMessage = "Couldn't start the session, logging locally."
        }
        for ex in exercises { await prepareSets(for: ex) }
    }

    /// Seeds set rows using previous-session ghost defaults where available.
    private func prepareSets(for ex: RoutineExerciseTree) async {
        let previous = (try? await env.workouts.previousSets(exerciseId: ex.exerciseId)) ?? []
        var entries: [SetEntry] = []
        for i in 0..<ex.sets {
            let prev = previous.first { $0.setNumber == i + 1 }
            entries.append(SetEntry(
                setNumber: i + 1,
                reps: prev?.reps ?? ex.repMax,
                weightKg: prev?.weightKg ?? 0,
                rpe: ex.targetRpe,
                isWarmup: false,
                isLogged: false,
                ghostReps: prev?.reps,
                ghostWeight: prev?.weightKg))
        }
        setsByExercise[ex.id] = entries
    }

    public func binding(for ex: RoutineExerciseTree) -> [SetEntry] {
        setsByExercise[ex.id] ?? []
    }

    /// Logs one set: persists to `set_logs` and auto-starts the rest timer (§2.3).
    public func logSet(exercise: RoutineExerciseTree, setId: UUID) async {
        guard var entries = setsByExercise[exercise.id],
              let idx = entries.firstIndex(where: { $0.id == setId }) else { return }
        entries[idx].isLogged.toggle()
        setsByExercise[exercise.id] = entries
        let entry = entries[idx]
        guard entry.isLogged, let session else {
            return
        }
        let log = SetLog(id: UUID(), sessionId: session.id, exerciseId: exercise.exerciseId,
                         exerciseNameSnapshot: exercise.exercise?.name ?? "Exercise",
                         setNumber: entry.setNumber, reps: entry.reps, weightKg: entry.weightKg,
                         rpe: entry.rpe, isWarmup: entry.isWarmup)
        _ = try? await env.workouts.logSet(log)
        restTimer.start(seconds: exercise.restSeconds)
    }

    public func next() { if !isLastExercise { currentIndex += 1; restTimer.skip() } }
    public func previous() { if currentIndex > 0 { currentIndex -= 1; restTimer.skip() } }

    /// Applies a chosen substitute to the current exercise for this session.
    public func applySwap(_ sub: SubstituteResult) {
        guard exercises.indices.contains(currentIndex) else { return }
        let old = exercises[currentIndex]
        exercises[currentIndex] = RoutineExerciseTree(
            id: old.id, position: old.position, exerciseId: sub.exerciseId, sets: old.sets,
            repMin: old.repMin, repMax: old.repMax, targetRpe: old.targetRpe, restSeconds: old.restSeconds,
            supersetGroup: old.supersetGroup, notes: old.notes,
            exercise: ExerciseStub(name: sub.name, slug: sub.slug))
        Task { await prepareSets(for: exercises[currentIndex]) }
    }

    public func finish(perceivedEffort: Int?) async {
        guard let session else { return }
        isFinishing = true
        defer { isFinishing = false }
        try? await env.workouts.completeSession(id: session.id, perceivedEffort: perceivedEffort, notes: nil)
        restTimer.skip()
    }
}

/// Plate-math helper: given a target barbell weight, the per-side plate stack
/// (BLUEPRINT §2.3 "plate-math helper"). Assumes a 20 kg bar.
public enum PlateMath {
    public static let barKg: Double = 20
    public static let plates: [Double] = [25, 20, 15, 10, 5, 2.5, 1.25]

    public static func perSide(target: Double, bar: Double = barKg) -> [Double] {
        var remaining = (target - bar) / 2
        guard remaining > 0 else { return [] }
        var out: [Double] = []
        for plate in plates {
            while remaining >= plate - 0.001 {
                out.append(plate); remaining -= plate
            }
        }
        return out
    }
}
