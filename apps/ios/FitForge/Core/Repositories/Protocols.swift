import Foundation
import SwiftUI

// MARK: - Repository protocols
//
// Every data dependency the UI touches is expressed as a protocol so features
// can be driven by the live Supabase implementation in the app and by in-memory
// mocks in previews/tests. `AppEnvironment` bundles them and is injected through
// the SwiftUI environment.

public protocol AuthRepository: Sendable {
    /// Emits the current user id whenever auth state changes (nil = logged out).
    var authState: AsyncStream<UUID?> { get }
    func currentUserId() async -> UUID?
    /// Sign in with Apple: exchanges the Apple identity token for a Supabase session.
    func signInWithApple(idToken: String, nonce: String) async throws -> UUID
    func signOut() async throws
    /// Deletes the account via the `delete-account` Edge Function (§5.4).
    func deleteAccount() async throws
}

public protocol CatalogRepository: Sendable {
    func allEquipment() async throws -> [Equipment]
    func allMuscleGroups() async throws -> [MuscleGroup]
    func allMuscles() async throws -> [Muscle]
    func allCategories() async throws -> [ExerciseCategory]
    func exerciseFull(slug: String) async throws -> ExerciseFull
    func browseExercises(categorySlug: String?) async throws -> [ExerciseFull]
    func food(id: UUID) async throws -> Food
    // Intelligence-layer RPCs (§5.3)
    func searchExercises(_ params: SearchExercisesParams) async throws -> [ExerciseSearchResult]
    func suggestionChips(experience: ExperienceLevel) async throws -> [ExerciseSearchResult]
    func suggestSubstitutes(_ params: SuggestSubstitutesParams) async throws -> [SubstituteResult]
}

public protocol OnboardingRepository: Sendable {
    func loadProfile() async throws -> Profile
    func patchProfile(_ patch: ProfilePatch) async throws -> Profile
    func setEquipment(slugs: [String]) async throws
    func loadUserEquipmentSlugs() async throws -> [String]
    func upsertExercisePreferences(_ prefs: [UserExercisePreference]) async throws
    func upsertMovementExclusions(_ rows: [UserMovementExclusion]) async throws
    func upsertNutritionProfile(_ profile: NutritionProfile) async throws
    func suggestDefaults(_ params: SuggestDefaultsParams) async throws -> OnboardingDefaults
    func suggestNutritionTargets() async throws -> NutritionTargets
    func onboardingStatus() async throws -> OnboardingStatus
    func generateStarterRoutine(name: String?) async throws -> UUID
}

public protocol RoutineRepository: Sendable {
    func activeRoutine() async throws -> RoutineTree?
    func allRoutines() async throws -> [Routine]
    func routineTree(id: UUID) async throws -> RoutineTree
    func updateRoutineExercise(_ row: RoutineExercise) async throws
    func activate(routineId: UUID) async throws
}

public protocol WorkoutRepository: Sendable {
    func startSession(routineDayId: UUID?) async throws -> WorkoutSession
    func previousSets(exerciseId: UUID) async throws -> [PreviousSet]
    func logSet(_ set: SetLog) async throws -> SetLog
    func completeSession(id: UUID, perceivedEffort: Int?, notes: String?) async throws
    func recentSessions(limit: Int) async throws -> [WorkoutSession]
}

public protocol NutritionRepository: Sendable {
    func searchFoods(_ params: SearchFoodsParams) async throws -> [FoodSearchResult]
    func logFood(_ params: LogFoodParams) async throws -> UUID
    func quickAdd(_ log: NutritionLog) async throws -> NutritionLog
    func logs(on day: DateOnly) async throws -> [NutritionLog]
    func dailyTotals(on day: DateOnly) async throws -> DailyNutrition?
    func deleteLog(id: UUID) async throws
    func nutritionProfile() async throws -> NutritionProfile?
}

public protocol ProgressRepository: Sendable {
    func bodyMetrics(limit: Int) async throws -> [BodyMetric]
    func upsertBodyMetric(_ metric: BodyMetric) async throws -> BodyMetric
    func personalRecords() async throws -> [ExercisePR]
    func progressPhotos() async throws -> [ProgressPhoto]
    /// Uploads JPEG data to the `progress-photos` bucket and records the row.
    func uploadPhoto(jpeg: Data, pose: PhotoPose, takenOn: DateOnly) async throws -> ProgressPhoto
    func signedURL(for photo: ProgressPhoto) async throws -> URL
}

// MARK: - Partial profile update (per onboarding step, §5.1 PATCH /profiles)

/// A sparse patch: only non-nil fields are sent. `sentinel` markers let the
/// caller explicitly clear a nullable column when needed (rare in onboarding).
public struct ProfilePatch: Encodable, Sendable {
    public var displayName: String?
    public var sex: SexType?
    public var birthdate: DateOnly?
    public var heightCm: Double?
    public var unitSystem: UnitSystem?
    public var experienceLevel: ExperienceLevel?
    public var primaryGoal: GoalType?
    public var secondaryGoal: GoalType?
    public var trainingLocation: TrainingLocation?
    public var daysPerWeek: Int?
    public var sessionMinutes: Int?
    public var preferredDays: [Int]?
    public var onboardingStep: String?
    public var onboardingCompletedAt: Date?

    public init() {}

    enum CodingKeys: String, CodingKey {
        case displayName = "display_name"
        case sex, birthdate
        case heightCm = "height_cm"
        case unitSystem = "unit_system"
        case experienceLevel = "experience_level"
        case primaryGoal = "primary_goal"
        case secondaryGoal = "secondary_goal"
        case trainingLocation = "training_location"
        case daysPerWeek = "days_per_week"
        case sessionMinutes = "session_minutes"
        case preferredDays = "preferred_days"
        case onboardingStep = "onboarding_step"
        case onboardingCompletedAt = "onboarding_completed_at"
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(displayName, forKey: .displayName)
        try c.encodeIfPresent(sex, forKey: .sex)
        try c.encodeIfPresent(birthdate, forKey: .birthdate)
        try c.encodeIfPresent(heightCm, forKey: .heightCm)
        try c.encodeIfPresent(unitSystem, forKey: .unitSystem)
        try c.encodeIfPresent(experienceLevel, forKey: .experienceLevel)
        try c.encodeIfPresent(primaryGoal, forKey: .primaryGoal)
        try c.encodeIfPresent(secondaryGoal, forKey: .secondaryGoal)
        try c.encodeIfPresent(trainingLocation, forKey: .trainingLocation)
        try c.encodeIfPresent(daysPerWeek, forKey: .daysPerWeek)
        try c.encodeIfPresent(sessionMinutes, forKey: .sessionMinutes)
        try c.encodeIfPresent(preferredDays, forKey: .preferredDays)
        try c.encodeIfPresent(onboardingStep, forKey: .onboardingStep)
        try c.encodeIfPresent(onboardingCompletedAt, forKey: .onboardingCompletedAt)
    }
}

// MARK: - Environment container

/// Bundles all repositories. Injected via `.environment(\.appEnvironment, …)`.
public struct AppEnvironment: Sendable {
    public var auth: any AuthRepository
    public var catalog: any CatalogRepository
    public var onboarding: any OnboardingRepository
    public var routines: any RoutineRepository
    public var workouts: any WorkoutRepository
    public var nutrition: any NutritionRepository
    public var progress: any ProgressRepository

    public init(auth: any AuthRepository, catalog: any CatalogRepository,
                onboarding: any OnboardingRepository, routines: any RoutineRepository,
                workouts: any WorkoutRepository, nutrition: any NutritionRepository,
                progress: any ProgressRepository) {
        self.auth = auth; self.catalog = catalog; self.onboarding = onboarding
        self.routines = routines; self.workouts = workouts; self.nutrition = nutrition
        self.progress = progress
    }

    /// The live stack wired to Supabase.
    public static func live() -> AppEnvironment {
        let client = SupabaseStack.client
        return AppEnvironment(
            auth: LiveAuthRepository(client: client),
            catalog: LiveCatalogRepository(client: client),
            onboarding: LiveOnboardingRepository(client: client),
            routines: LiveRoutineRepository(client: client),
            workouts: LiveWorkoutRepository(client: client),
            nutrition: LiveNutritionRepository(client: client),
            progress: LiveProgressRepository(client: client)
        )
    }

    /// In-memory mock stack for previews and tests.
    public static func preview() -> AppEnvironment {
        AppEnvironment(
            auth: MockAuthRepository(),
            catalog: MockCatalogRepository(),
            onboarding: MockOnboardingRepository(),
            routines: MockRoutineRepository(),
            workouts: MockWorkoutRepository(),
            nutrition: MockNutritionRepository(),
            progress: MockProgressRepository()
        )
    }
}

private struct AppEnvironmentKey: EnvironmentKey {
    static let defaultValue: AppEnvironment = .preview()
}

public extension EnvironmentValues {
    var appEnvironment: AppEnvironment {
        get { self[AppEnvironmentKey.self] }
        set { self[AppEnvironmentKey.self] = newValue }
    }
}
