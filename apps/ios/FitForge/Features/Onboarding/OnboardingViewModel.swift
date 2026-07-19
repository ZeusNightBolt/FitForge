import SwiftUI
import Observation

/// The onboarding state machine (BLUEPRINT §2.2):
/// welcome → auth → goals → experience → schedule → location → equipment →
/// exercise_prefs → exclusions → body_metrics → nutrition_prefs →
/// targets_review → plan_preview → done.
///
/// `welcome`/`auth` are handled by `AuthView` before this flow starts, so the
/// interactive flow covers `goals` … `plan_preview`.
public enum OnboardingStep: String, CaseIterable, Identifiable, Sendable {
    case goals
    case experience
    case schedule
    case location
    case equipment
    case exercisePrefs = "exercise_prefs"
    case exclusions
    case bodyMetrics = "body_metrics"
    case nutritionPrefs = "nutrition_prefs"
    case targetsReview = "targets_review"
    case planPreview = "plan_preview"

    public var id: String { rawValue }

    public var title: String {
        switch self {
        case .goals: return "What's your main goal?"
        case .experience: return "How experienced are you?"
        case .schedule: return "When can you train?"
        case .location: return "Where will you train?"
        case .equipment: return "What equipment do you have?"
        case .exercisePrefs: return "Exercises you enjoy"
        case .exclusions: return "Anything we should protect?"
        case .bodyMetrics: return "A few body basics"
        case .nutritionPrefs: return "How do you eat?"
        case .targetsReview: return "Your daily targets"
        case .planPreview: return "Your starter plan"
        }
    }

    /// Progress fraction (0…1) for the top bar.
    public var progress: Double {
        Double(OnboardingStep.allCases.firstIndex(of: self)! + 1) / Double(OnboardingStep.allCases.count)
    }
}

/// A selected/excluded exercise, carrying display data for the UI.
public struct ExercisePick: Identifiable, Hashable, Sendable {
    public let id: UUID
    public let slug: String
    public let name: String
    /// For exclusions: the pinned preferred substitute, or nil = auto.
    public var preferredSubstituteId: UUID?
    public init(id: UUID, slug: String, name: String, preferredSubstituteId: UUID? = nil) {
        self.id = id; self.slug = slug; self.name = name; self.preferredSubstituteId = preferredSubstituteId
    }
}

@MainActor
@Observable
public final class OnboardingViewModel {
    // Navigation
    public var step: OnboardingStep

    // Draft answers -------------------------------------------------------
    public var primaryGoal: GoalType?
    public var secondaryGoal: GoalType?
    public var experience: ExperienceLevel = .beginner
    public var daysPerWeek: Int = 3
    public var preferredDays: Set<Int> = [0, 2, 4]           // 0=Mon…6=Sun
    public var sessionMinutes: Int = 45
    public var trainingLocation: TrainingLocation?
    public var equipmentSlugs: Set<String> = []
    public var favorites: [ExercisePick] = []
    public var bodyAreas: Set<BodyArea> = []
    /// Soft-excluded patterns the user chose to keep (un-checked). Not written.
    public var keptSoftPatterns: Set<MovementPattern> = []
    public var excludedExercises: [ExercisePick] = []
    public var sex: SexType = .preferNotToSay
    public var birthdate = Calendar.current.date(byAdding: .year, value: -30, to: Date()) ?? Date()
    public var heightCm: Double = 170
    public var weightKg: Double = 70
    public var unitSystem: UnitSystem = Locale.current.usesMetric ? .metric : .imperial
    public var dietType: DietType = .omnivore
    public var allergies: Set<String> = []
    public var avoidFoods: [FoodSearchResult] = []
    public var mealsPerDay: Int = 3
    public var targets: NutritionTargets?
    public var targetsEdited = false

    // Loaded reference data
    public var allEquipment: [Equipment] = []
    public var defaults: OnboardingDefaults?
    public var generatedRoutine: RoutineTree?

    // UI feedback
    public var isSaving = false
    public var errorMessage: String?

    private var env: AppEnvironment
    public var onFinished: () -> Void = {}

    public init(env: AppEnvironment, resumeStep: String = "goals") {
        self.env = env
        self.step = OnboardingStep(rawValue: resumeStep) ?? .goals
    }

    /// Swaps the placeholder preview env for the live one once the view appears.
    public func replaceEnvironment(_ env: AppEnvironment) { self.env = env }

    // MARK: Derived

    /// The movement-pattern exclusions implied by the selected body areas,
    /// dropping soft patterns the user chose to keep (§7.2.2).
    public var effectiveExclusions: [UserMovementExclusion] {
        var seen = Set<MovementPattern>()
        var rows: [UserMovementExclusion] = []
        for area in bodyAreas {
            for entry in area.excludedPatterns {
                if entry.soft && keptSoftPatterns.contains(entry.pattern) { continue }
                if seen.insert(entry.pattern).inserted {
                    rows.append(UserMovementExclusion(userId: Sample.userId, movementPattern: entry.pattern,
                                                      reason: .injury, sourceBodyArea: area.rawValue))
                }
            }
        }
        return rows
    }

    public var canAdvance: Bool {
        switch step {
        case .goals: return primaryGoal != nil
        case .location: return trainingLocation != nil
        default: return true
        }
    }

    // MARK: Lifecycle

    public func onAppear() async {
        if allEquipment.isEmpty {
            allEquipment = (try? await env.catalog.allEquipment()) ?? []
        }
    }

    // MARK: Step transitions (write-through per §2.2)

    public func advance() async {
        guard canAdvance else { return }
        await persistCurrentStep()
        guard errorMessage == nil else { return }
        Haptics.notify(.success)
        goToNext()
    }

    public func back() {
        guard let idx = OnboardingStep.allCases.firstIndex(of: step), idx > 0 else { return }
        step = OnboardingStep.allCases[idx - 1]
    }

    private func goToNext() {
        guard let idx = OnboardingStep.allCases.firstIndex(of: step),
              idx + 1 < OnboardingStep.allCases.count else { return }
        step = OnboardingStep.allCases[idx + 1]
    }

    /// Persists the answers for the current step, then side-effects (RPCs) as needed.
    private func persistCurrentStep() async {
        isSaving = true; errorMessage = nil
        defer { isSaving = false }
        do {
            switch step {
            case .goals:
                var patch = ProfilePatch()
                patch.primaryGoal = primaryGoal
                patch.secondaryGoal = secondaryGoal
                patch.onboardingStep = OnboardingStep.experience.rawValue
                _ = try await env.onboarding.patchProfile(patch)

            case .experience:
                var patch = ProfilePatch()
                patch.experienceLevel = experience
                patch.onboardingStep = OnboardingStep.schedule.rawValue
                _ = try await env.onboarding.patchProfile(patch)
                // Pull schedule/prescription defaults for the next screen (§7.2.5).
                if let goal = primaryGoal {
                    defaults = try? await env.onboarding.suggestDefaults(.init(pGoal: goal, pExperience: experience))
                    if let d = defaults {
                        daysPerWeek = d.daysPerWeek
                        sessionMinutes = d.sessionMinutes
                        preferredDays = Self.evenlySpacedDays(count: d.daysPerWeek)
                    }
                }

            case .schedule:
                var patch = ProfilePatch()
                patch.daysPerWeek = daysPerWeek
                patch.sessionMinutes = sessionMinutes
                patch.preferredDays = preferredDays.sorted()
                patch.onboardingStep = OnboardingStep.location.rawValue
                _ = try await env.onboarding.patchProfile(patch)

            case .location:
                var patch = ProfilePatch()
                patch.trainingLocation = trainingLocation
                patch.onboardingStep = OnboardingStep.equipment.rawValue
                _ = try await env.onboarding.patchProfile(patch)
                applyEquipmentPreset()

            case .equipment:
                try await env.onboarding.setEquipment(slugs: Array(equipmentSlugs))
                var patch = ProfilePatch(); patch.onboardingStep = OnboardingStep.exercisePrefs.rawValue
                _ = try await env.onboarding.patchProfile(patch)

            case .exercisePrefs:
                let prefs = favorites.map {
                    UserExercisePreference(userId: Sample.userId, exerciseId: $0.id, preference: .favorite)
                }
                try await env.onboarding.upsertExercisePreferences(prefs)
                var patch = ProfilePatch(); patch.onboardingStep = OnboardingStep.exclusions.rawValue
                _ = try await env.onboarding.patchProfile(patch)

            case .exclusions:
                try await env.onboarding.upsertMovementExclusions(effectiveExclusions)
                let excl = excludedExercises.map {
                    UserExercisePreference(userId: Sample.userId, exerciseId: $0.id, preference: .excluded,
                                           exclusionReason: .injury, preferredSubstituteId: $0.preferredSubstituteId)
                }
                try await env.onboarding.upsertExercisePreferences(excl)
                var patch = ProfilePatch(); patch.onboardingStep = OnboardingStep.bodyMetrics.rawValue
                _ = try await env.onboarding.patchProfile(patch)

            case .bodyMetrics:
                var patch = ProfilePatch()
                patch.sex = sex
                patch.birthdate = DateOnly(birthdate)
                patch.heightCm = heightCm
                patch.unitSystem = unitSystem
                patch.onboardingStep = OnboardingStep.nutritionPrefs.rawValue
                _ = try await env.onboarding.patchProfile(patch)

            case .nutritionPrefs:
                let np = NutritionProfile(userId: Sample.userId, dietType: dietType,
                                          allergies: Array(allergies), mealsPerDay: mealsPerDay,
                                          targetsSource: .suggested)
                try await env.onboarding.upsertNutritionProfile(np)
                for avoid in avoidFoods {
                    // Persisted as food exclusions; handled by nutrition repo upsert path in app.
                    _ = avoid
                }
                var patch = ProfilePatch(); patch.onboardingStep = OnboardingStep.targetsReview.rawValue
                _ = try await env.onboarding.patchProfile(patch)
                // Compute targets for the review screen (§7.2.4).
                targets = try? await env.onboarding.suggestNutritionTargets()

            case .targetsReview:
                if let t = targets {
                    let np = NutritionProfile(userId: Sample.userId, dietType: dietType,
                                              allergies: Array(allergies), mealsPerDay: mealsPerDay,
                                              kcalTarget: t.kcal, proteinGTarget: t.proteinG,
                                              carbsGTarget: t.carbsG, fatGTarget: t.fatG,
                                              targetsSource: targetsEdited ? .custom : .suggested)
                    try await env.onboarding.upsertNutritionProfile(np)
                }
                var patch = ProfilePatch(); patch.onboardingStep = OnboardingStep.planPreview.rawValue
                _ = try await env.onboarding.patchProfile(patch)
                // Generate the routine so plan_preview can show it (§7.5).
                let routineId = try await env.onboarding.generateStarterRoutine(name: nil)
                generatedRoutine = try? await env.routines.routineTree(id: routineId)

            case .planPreview:
                break // handled by finish()
            }
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    /// "Start plan": mark onboarding complete and hand off to the main app.
    public func finish() async {
        isSaving = true; errorMessage = nil
        defer { isSaving = false }
        do {
            var patch = ProfilePatch()
            patch.onboardingStep = "done"
            patch.onboardingCompletedAt = Date()
            _ = try await env.onboarding.patchProfile(patch)
            Haptics.notify(.success)
            onFinished()
        } catch {
            errorMessage = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    // MARK: Equipment presets & dependency nudges (§7.2.1)

    public func applyEquipmentPreset() {
        guard let location = trainingLocation else { return }
        switch location {
        case .home:
            equipmentSlugs = Set(allEquipment.filter(\.commonInHome).map(\.slug))
        case .commercialGym:
            equipmentSlugs = Set(allEquipment.filter(\.commonInGym).map(\.slug))
        case .minimal:
            equipmentSlugs = [] // bands / pull-up-bar are *suggested*, not preselected
        }
    }

    /// Dependency suggestion chips (§7.2.1). Returns slugs to suggest given the
    /// currently-selected equipment.
    public var equipmentSuggestions: [String] {
        var out = Set<String>()
        func has(_ s: String) -> Bool { equipmentSlugs.contains(s) }
        if has("squat-rack") || has("flat-bench") || has("adjustable-bench") {
            out.insert("barbell"); out.insert("weight-plates")
        }
        if has("barbell") { out.insert("weight-plates"); out.insert("flat-bench") }
        if has("lat-pulldown") || has("seated-row-machine") { out.insert("cable-machine") }
        // Minimal-location nudges
        if trainingLocation == .minimal { out.insert("resistance-bands"); out.insert("pull-up-bar") }
        return out.subtracting(equipmentSlugs).sorted()
    }

    public func toggleEquipment(_ slug: String) {
        if equipmentSlugs.contains(slug) { equipmentSlugs.remove(slug) } else { equipmentSlugs.insert(slug) }
    }

    // MARK: Helpers

    /// Evenly-spaced weekday pattern (e.g. 3 → Mon/Wed/Fri) (§2.2 screen 4).
    public static func evenlySpacedDays(count: Int) -> Set<Int> {
        guard count > 0 else { return [] }
        guard count < 7 else { return Set(0...6) }
        let step = 7.0 / Double(count)
        return Set((0..<count).map { Int((Double($0) * step).rounded()) % 7 })
    }

    public func equipment(for category: EquipmentCategory) -> [Equipment] {
        allEquipment.filter { $0.category == category }.sorted { $0.name < $1.name }
    }
}

extension Locale {
    var usesMetric: Bool {
        if #available(iOS 16, *) { return measurementSystem == .metric }
        return (self as NSLocale).object(forKey: .usesMetricSystem) as? Bool ?? true
    }
}
