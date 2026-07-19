import Foundation

// MARK: - Sample data for previews & tests
//
// A small, self-consistent slice of the §6 seed content, used by the preview
// mock repositories and by the decoding tests. Deterministic UUIDs keep
// previews stable across runs.

public enum Sample {
    public static func uuid(_ n: Int) -> UUID {
        UUID(uuidString: String(format: "00000000-0000-0000-0000-%012d", n))!
    }

    public static let userId = uuid(1)

    // Equipment slice
    public static let equipment: [Equipment] = [
        Equipment(id: uuid(100), slug: "barbell", name: "Barbell", category: .freeWeights, commonInHome: true, commonInGym: true),
        Equipment(id: uuid(101), slug: "dumbbell", name: "Dumbbells", category: .freeWeights, commonInHome: true, commonInGym: true),
        Equipment(id: uuid(102), slug: "kettlebell", name: "Kettlebell", category: .freeWeights, commonInHome: true, commonInGym: true),
        Equipment(id: uuid(103), slug: "weight-plates", name: "Weight Plates", category: .freeWeights, commonInHome: true, commonInGym: true),
        Equipment(id: uuid(104), slug: "flat-bench", name: "Flat Bench", category: .benchesRacks, commonInHome: true, commonInGym: true),
        Equipment(id: uuid(105), slug: "adjustable-bench", name: "Adjustable Bench", category: .benchesRacks, commonInHome: true, commonInGym: true),
        Equipment(id: uuid(106), slug: "squat-rack", name: "Squat / Power Rack", category: .benchesRacks, commonInHome: false, commonInGym: true),
        Equipment(id: uuid(107), slug: "cable-machine", name: "Cable Machine / Crossover", category: .cables, commonInHome: false, commonInGym: true),
        Equipment(id: uuid(108), slug: "lat-pulldown", name: "Lat Pulldown Machine", category: .cables, commonInHome: false, commonInGym: true),
        Equipment(id: uuid(109), slug: "leg-press", name: "Leg Press Machine", category: .machines, commonInHome: false, commonInGym: true),
        Equipment(id: uuid(110), slug: "pull-up-bar", name: "Pull-up Bar", category: .bodyweightAccessories, commonInHome: true, commonInGym: true),
        Equipment(id: uuid(111), slug: "resistance-bands", name: "Resistance Bands", category: .bodyweightAccessories, commonInHome: true, commonInGym: true),
        Equipment(id: uuid(112), slug: "treadmill", name: "Treadmill", category: .cardio, commonInHome: false, commonInGym: true)
    ]

    public static let muscleGroups: [MuscleGroup] = [
        MuscleGroup(id: uuid(200), slug: "chest", name: "Chest", region: .upper, displayOrder: 0),
        MuscleGroup(id: uuid(201), slug: "back", name: "Back", region: .upper, displayOrder: 1),
        MuscleGroup(id: uuid(202), slug: "shoulders", name: "Shoulders", region: .upper, displayOrder: 2),
        MuscleGroup(id: uuid(203), slug: "arms", name: "Arms", region: .upper, displayOrder: 3),
        MuscleGroup(id: uuid(204), slug: "core", name: "Core", region: .core, displayOrder: 4),
        MuscleGroup(id: uuid(205), slug: "glutes", name: "Glutes", region: .lower, displayOrder: 5),
        MuscleGroup(id: uuid(206), slug: "legs", name: "Legs", region: .lower, displayOrder: 6)
    ]

    public static let categories: [ExerciseCategory] = [
        ExerciseCategory(id: uuid(300), slug: "chest", name: "Chest", displayOrder: 0),
        ExerciseCategory(id: uuid(301), slug: "back", name: "Back", displayOrder: 1),
        ExerciseCategory(id: uuid(302), slug: "shoulders", name: "Shoulders", displayOrder: 2),
        ExerciseCategory(id: uuid(303), slug: "arms", name: "Arms", displayOrder: 3),
        ExerciseCategory(id: uuid(304), slug: "legs", name: "Legs", displayOrder: 4),
        ExerciseCategory(id: uuid(305), slug: "glutes", name: "Glutes", displayOrder: 5),
        ExerciseCategory(id: uuid(306), slug: "core", name: "Core", displayOrder: 6),
        ExerciseCategory(id: uuid(307), slug: "cardio", name: "Cardio", displayOrder: 7),
        ExerciseCategory(id: uuid(308), slug: "full-body", name: "Full Body", displayOrder: 8)
    ]

    public static let exercisesFull: [ExerciseFull] = [
        ExerciseFull(id: uuid(400), slug: "barbell-back-squat", name: "Barbell Back Squat",
                     aliases: ["Back Squat"], categoryName: "Legs", movementPattern: .squat,
                     mechanics: .compound, difficulty: .intermediate, popularity: 95,
                     primaryMuscleSlugs: ["quads"], secondaryMuscleSlugs: ["glute-max", "lower-back", "adductors"],
                     equipmentSlugs: ["barbell", "weight-plates", "squat-rack"]),
        ExerciseFull(id: uuid(401), slug: "goblet-squat", name: "Goblet Squat",
                     categoryName: "Legs", movementPattern: .squat, mechanics: .compound,
                     difficulty: .beginner, popularity: 80, primaryMuscleSlugs: ["quads"],
                     secondaryMuscleSlugs: ["glute-max", "abs"], equipmentSlugs: ["dumbbell", "kettlebell"]),
        ExerciseFull(id: uuid(402), slug: "bench-press", name: "Barbell Bench Press",
                     categoryName: "Chest", movementPattern: .horizontalPush, mechanics: .compound,
                     difficulty: .intermediate, popularity: 95, primaryMuscleSlugs: ["pecs"],
                     secondaryMuscleSlugs: ["front-delts", "triceps"], equipmentSlugs: ["barbell", "weight-plates", "flat-bench"]),
        ExerciseFull(id: uuid(403), slug: "dumbbell-bench-press", name: "Dumbbell Bench Press",
                     categoryName: "Chest", movementPattern: .horizontalPush, mechanics: .compound,
                     difficulty: .beginner, popularity: 90, primaryMuscleSlugs: ["pecs"],
                     secondaryMuscleSlugs: ["front-delts", "triceps"], equipmentSlugs: ["dumbbell", "flat-bench"]),
        ExerciseFull(id: uuid(404), slug: "push-up", name: "Push-up", categoryName: "Chest",
                     movementPattern: .horizontalPush, mechanics: .compound, difficulty: .beginner,
                     isBodyweightOk: true, popularity: 90, primaryMuscleSlugs: ["pecs"],
                     secondaryMuscleSlugs: ["front-delts", "triceps", "abs"], equipmentSlugs: []),
        ExerciseFull(id: uuid(405), slug: "pull-up", name: "Pull-up", categoryName: "Back",
                     movementPattern: .verticalPull, mechanics: .compound, difficulty: .advanced,
                     popularity: 90, primaryMuscleSlugs: ["lats"],
                     secondaryMuscleSlugs: ["biceps", "rhomboids", "forearms"], equipmentSlugs: ["pull-up-bar"]),
        ExerciseFull(id: uuid(406), slug: "dumbbell-row", name: "One-Arm Dumbbell Row",
                     categoryName: "Back", movementPattern: .horizontalPull, mechanics: .compound,
                     difficulty: .beginner, isUnilateral: true, popularity: 85, primaryMuscleSlugs: ["lats"],
                     secondaryMuscleSlugs: ["rhomboids", "biceps"], equipmentSlugs: ["dumbbell", "flat-bench"]),
        ExerciseFull(id: uuid(407), slug: "romanian-deadlift", name: "Romanian Deadlift",
                     categoryName: "Legs", movementPattern: .hinge, mechanics: .compound,
                     difficulty: .intermediate, popularity: 85, primaryMuscleSlugs: ["hamstrings"],
                     secondaryMuscleSlugs: ["glute-max", "lower-back"], equipmentSlugs: ["barbell"]),
        ExerciseFull(id: uuid(408), slug: "plank", name: "Plank", categoryName: "Core",
                     movementPattern: .coreStability, mechanics: .isolation, difficulty: .beginner,
                     isBodyweightOk: true, popularity: 85, primaryMuscleSlugs: ["abs"],
                     secondaryMuscleSlugs: ["obliques", "lower-back"], equipmentSlugs: [])
    ]

    public static let exerciseSearchResults: [ExerciseSearchResult] = exercisesFull.enumerated().map {
        ExerciseSearchResult(exerciseId: $0.element.id, slug: $0.element.slug, name: $0.element.name,
                             matchedAlias: nil, score: Double(100 - $0.offset))
    }

    public static let foods: [Food] = [
        Food(id: uuid(500), slug: "chicken-breast", name: "Chicken Breast, cooked", brand: nil,
             category: .protein, kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fiberG: 0, sugarG: 0,
             sodiumMg: 74, servingName: "1 breast · 120 g", servingGrams: 120,
             dietTags: ["gluten_free", "dairy_free", "keto_friendly"], allergenTags: [],
             verified: true, source: "fitforge-curated", isActive: true),
        Food(id: uuid(501), slug: "white-rice", name: "White Rice, cooked", brand: nil, category: .grain,
             kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, fiberG: 0.4, sugarG: 0, sodiumMg: 1,
             servingName: "1 cup · 158 g", servingGrams: 158,
             dietTags: ["vegan", "vegetarian", "pescatarian_ok", "gluten_free", "dairy_free"],
             allergenTags: [], verified: true, source: "fitforge-curated", isActive: true),
        Food(id: uuid(502), slug: "greek-yogurt-nonfat", name: "Greek Yogurt, nonfat", brand: nil,
             category: .dairy, kcal: 59, proteinG: 10.3, carbsG: 3.6, fatG: 0.4, fiberG: 0, sugarG: 3.2,
             sodiumMg: 36, servingName: "1 cup · 170 g", servingGrams: 170,
             dietTags: ["vegetarian", "gluten_free"], allergenTags: ["dairy"],
             verified: true, source: "fitforge-curated", isActive: true),
        Food(id: uuid(503), slug: "banana", name: "Banana", brand: nil, category: .fruit,
             kcal: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3, fiberG: 2.6, sugarG: 12.2, sodiumMg: 1,
             servingName: "1 medium · 118 g", servingGrams: 118,
             dietTags: ["vegan", "vegetarian", "pescatarian_ok", "gluten_free", "dairy_free"],
             allergenTags: [], verified: true, source: "fitforge-curated", isActive: true)
    ]

    public static let foodSearchResults: [FoodSearchResult] = foods.map {
        FoodSearchResult(foodId: $0.id, slug: $0.slug, name: $0.name, brand: $0.brand, kcal: $0.kcal,
                         proteinG: $0.proteinG, servingName: $0.servingName, servingGrams: $0.servingGrams, score: 100)
    }

    public static var profile: Profile {
        Profile(id: userId, displayName: "Rachel", sex: .female,
                birthdate: DateOnly(year: 1992, month: 3, day: 14), heightCm: 165, unitSystem: .imperial,
                experienceLevel: .beginner, primaryGoal: .fatLoss, secondaryGoal: .generalHealth,
                trainingLocation: .home, daysPerWeek: 3, sessionMinutes: 45, preferredDays: [0, 2, 4],
                onboardingStep: "done", onboardingCompletedAt: Date())
    }

    public static var incompleteProfile: Profile {
        Profile(id: userId, displayName: "Rachel", unitSystem: .imperial, onboardingStep: "goals")
    }

    public static let nutritionProfile = NutritionProfile(
        userId: userId, dietType: .vegetarian, allergies: ["tree_nut"], mealsPerDay: 3,
        kcalTarget: 1750, proteinGTarget: 120, carbsGTarget: 180, fatGTarget: 55, targetsSource: .suggested)

    public static let nutritionTargets = NutritionTargets(
        kcal: 1750, proteinG: 120, carbsG: 180, fatG: 55,
        method: "Mifflin-St Jeor × 1.5 − 20% (fat loss)")

    public static let onboardingDefaults = OnboardingDefaults(
        daysPerWeek: 3, sessionMinutes: 45, repMin: 10, repMax: 15, splitName: "Full Body A/B/C")

    public static let substitutes: [SubstituteResult] = [
        SubstituteResult(exerciseId: uuid(403), slug: "dumbbell-bench-press", name: "Dumbbell Bench Press",
                         score: 92, reason: "Same horizontal push, uses dumbbells"),
        SubstituteResult(exerciseId: uuid(404), slug: "push-up", name: "Push-up",
                         score: 72, reason: "Same movement pattern, no equipment needed")
    ]

    public static let previousSets: [PreviousSet] = [
        PreviousSet(setNumber: 1, reps: 10, weightKg: 40, rpe: 7),
        PreviousSet(setNumber: 2, reps: 9, weightKg: 40, rpe: 8),
        PreviousSet(setNumber: 3, reps: 8, weightKg: 40, rpe: 9)
    ]

    public static let personalRecords: [ExercisePR] = [
        ExercisePR(userId: userId, exerciseId: uuid(402), exerciseName: "Barbell Bench Press", bestE1rm: 92.5, bestWeightKg: 80),
        ExercisePR(userId: userId, exerciseId: uuid(400), exerciseName: "Barbell Back Squat", bestE1rm: 120, bestWeightKg: 100)
    ]

    public static var bodyMetrics: [BodyMetric] {
        (0..<8).map { i in
            BodyMetric(id: uuid(600 + i), userId: userId,
                       measuredOn: DateOnly(year: 2026, month: 6, day: 1 + i * 3),
                       weightKg: 68.0 - Double(i) * 0.4, waistCm: 78 - Double(i) * 0.3)
        }
    }

    public static var routineTree: RoutineTree {
        RoutineTree(id: uuid(700), userId: userId, name: "Full Body A/B/C",
                    description: "Generated for fat loss · 3 days/week", goal: .fatLoss,
                    source: .generated, isActive: true, startDate: .today(),
                    routineDays: [
                        RoutineDayTree(id: uuid(710), dayIndex: 0, name: "Day A — Full body", focus: "Full body", weekday: 0,
                                       routineExercises: [
                                           RoutineExerciseTree(id: uuid(720), position: 0, exerciseId: uuid(401), sets: 3, repMin: 10, repMax: 15, restSeconds: 60,
                                                               exercise: ExerciseStub(name: "Goblet Squat", slug: "goblet-squat")),
                                           RoutineExerciseTree(id: uuid(721), position: 1, exerciseId: uuid(403), sets: 3, repMin: 10, repMax: 15, restSeconds: 60,
                                                               exercise: ExerciseStub(name: "Dumbbell Bench Press", slug: "dumbbell-bench-press")),
                                           RoutineExerciseTree(id: uuid(722), position: 2, exerciseId: uuid(406), sets: 3, repMin: 10, repMax: 15, restSeconds: 60,
                                                               exercise: ExerciseStub(name: "One-Arm Dumbbell Row", slug: "dumbbell-row")),
                                           RoutineExerciseTree(id: uuid(723), position: 3, exerciseId: uuid(407), sets: 3, repMin: 10, repMax: 15, restSeconds: 60,
                                                               exercise: ExerciseStub(name: "Romanian Deadlift", slug: "romanian-deadlift")),
                                           RoutineExerciseTree(id: uuid(724), position: 4, exerciseId: uuid(408), sets: 3, repMin: 10, repMax: 15, restSeconds: 45,
                                                               exercise: ExerciseStub(name: "Plank", slug: "plank"))
                                       ]),
                        RoutineDayTree(id: uuid(711), dayIndex: 1, name: "Day B — Full body", focus: "Full body", weekday: 2,
                                       routineExercises: [
                                           RoutineExerciseTree(id: uuid(730), position: 0, exerciseId: uuid(401), sets: 3, repMin: 10, repMax: 15, restSeconds: 60,
                                                               exercise: ExerciseStub(name: "Goblet Squat", slug: "goblet-squat")),
                                           RoutineExerciseTree(id: uuid(731), position: 1, exerciseId: uuid(404), sets: 3, repMin: 10, repMax: 15, restSeconds: 60,
                                                               exercise: ExerciseStub(name: "Push-up", slug: "push-up"))
                                       ]),
                        RoutineDayTree(id: uuid(712), dayIndex: 2, name: "Day C — Full body", focus: "Full body", weekday: 4,
                                       routineExercises: [
                                           RoutineExerciseTree(id: uuid(740), position: 0, exerciseId: uuid(405), sets: 3, repMin: 8, repMax: 12, restSeconds: 60,
                                                               exercise: ExerciseStub(name: "Pull-up", slug: "pull-up"))
                                       ])
                    ])
    }

    public static var nutritionLogs: [NutritionLog] {
        [
            NutritionLog(id: uuid(800), userId: userId, loggedOn: .today(), mealSlot: .breakfast,
                         foodId: uuid(502), customName: "Greek Yogurt, nonfat", quantityG: 170,
                         kcal: 100, proteinG: 17.5, carbsG: 6.1, fatG: 0.7),
            NutritionLog(id: uuid(801), userId: userId, loggedOn: .today(), mealSlot: .lunch,
                         foodId: uuid(500), customName: "Chicken Breast, cooked", quantityG: 120,
                         kcal: 198, proteinG: 37.2, carbsG: 0, fatG: 4.3),
            NutritionLog(id: uuid(802), userId: userId, loggedOn: .today(), mealSlot: .lunch,
                         foodId: uuid(501), customName: "White Rice, cooked", quantityG: 158,
                         kcal: 205, proteinG: 4.3, carbsG: 44.2, fatG: 0.5)
        ]
    }

    public static var dailyNutrition: DailyNutrition {
        let total = nutritionLogs.reduce(Macros()) { $0 + $1.macros }
        return DailyNutrition(userId: userId, loggedOn: .today(), kcal: total.kcal,
                              proteinG: total.protein, carbsG: total.carbs, fatG: total.fat)
    }

    public static var recentSessions: [WorkoutSession] {
        (0..<4).map { i in
            WorkoutSession(id: uuid(900 + i), userId: userId, routineDayId: uuid(710),
                           startedAt: Calendar.current.date(byAdding: .day, value: -i * 2, to: Date())!,
                           completedAt: Calendar.current.date(byAdding: .day, value: -i * 2, to: Date())!,
                           perceivedEffort: 7)
        }
    }
}

// MARK: - Mock repositories

public struct MockAuthRepository: AuthRepository {
    public var loggedIn: Bool
    public init(loggedIn: Bool = true) { self.loggedIn = loggedIn }
    public var authState: AsyncStream<UUID?> {
        AsyncStream { c in c.yield(loggedIn ? Sample.userId : nil); c.finish() }
    }
    public func currentUserId() async -> UUID? { loggedIn ? Sample.userId : nil }
    public func signInWithApple(idToken: String, nonce: String) async throws -> UUID { Sample.userId }
    public func signOut() async throws {}
    public func deleteAccount() async throws {}
}

public struct MockCatalogRepository: CatalogRepository {
    public init() {}
    public func allEquipment() async throws -> [Equipment] { Sample.equipment }
    public func allMuscleGroups() async throws -> [MuscleGroup] { Sample.muscleGroups }
    public func allMuscles() async throws -> [Muscle] { [] }
    public func allCategories() async throws -> [ExerciseCategory] { Sample.categories }
    public func exerciseFull(slug: String) async throws -> ExerciseFull {
        Sample.exercisesFull.first { $0.slug == slug } ?? Sample.exercisesFull[0]
    }
    public func browseExercises(categorySlug: String?) async throws -> [ExerciseFull] {
        guard let categorySlug else { return Sample.exercisesFull }
        return Sample.exercisesFull.filter { $0.categoryName?.lowercased() == categorySlug }
    }
    public func food(id: UUID) async throws -> Food { Sample.foods.first { $0.id == id } ?? Sample.foods[0] }
    public func searchExercises(_ params: SearchExercisesParams) async throws -> [ExerciseSearchResult] {
        guard !params.q.isEmpty else { return Array(Sample.exerciseSearchResults.prefix(params.pLimit)) }
        return Sample.exerciseSearchResults.filter { $0.name.lowercased().contains(params.q.lowercased()) }
    }
    public func suggestionChips(experience: ExperienceLevel) async throws -> [ExerciseSearchResult] {
        Array(Sample.exerciseSearchResults.prefix(8))
    }
    public func suggestSubstitutes(_ params: SuggestSubstitutesParams) async throws -> [SubstituteResult] {
        Sample.substitutes
    }
}

public final class MockOnboardingRepository: OnboardingRepository, @unchecked Sendable {
    public var profile: Profile
    public init(profile: Profile = Sample.profile) { self.profile = profile }
    public func loadProfile() async throws -> Profile { profile }
    public func patchProfile(_ patch: ProfilePatch) async throws -> Profile { profile }
    public func setEquipment(slugs: [String]) async throws {}
    public func loadUserEquipmentSlugs() async throws -> [String] { ["dumbbell", "flat-bench", "resistance-bands"] }
    public func upsertExercisePreferences(_ prefs: [UserExercisePreference]) async throws {}
    public func upsertMovementExclusions(_ rows: [UserMovementExclusion]) async throws {}
    public func upsertNutritionProfile(_ profile: NutritionProfile) async throws {}
    public func suggestDefaults(_ params: SuggestDefaultsParams) async throws -> OnboardingDefaults { Sample.onboardingDefaults }
    public func suggestNutritionTargets() async throws -> NutritionTargets { Sample.nutritionTargets }
    public func onboardingStatus() async throws -> OnboardingStatus {
        OnboardingStatus(complete: true, missing: [], resumeStep: "done")
    }
    public func generateStarterRoutine(name: String?) async throws -> UUID { Sample.uuid(700) }
}

public struct MockRoutineRepository: RoutineRepository {
    public init() {}
    public func activeRoutine() async throws -> RoutineTree? { Sample.routineTree }
    public func allRoutines() async throws -> [Routine] {
        [Routine(id: Sample.uuid(700), userId: Sample.userId, name: "Full Body A/B/C", goal: .fatLoss, source: .generated, isActive: true)]
    }
    public func routineTree(id: UUID) async throws -> RoutineTree { Sample.routineTree }
    public func updateRoutineExercise(_ row: RoutineExercise) async throws {}
    public func activate(routineId: UUID) async throws {}
}

public struct MockWorkoutRepository: WorkoutRepository {
    public init() {}
    public func startSession(routineDayId: UUID?) async throws -> WorkoutSession {
        WorkoutSession(id: Sample.uuid(950), userId: Sample.userId, routineDayId: routineDayId)
    }
    public func previousSets(exerciseId: UUID) async throws -> [PreviousSet] { Sample.previousSets }
    public func logSet(_ set: SetLog) async throws -> SetLog { set }
    public func completeSession(id: UUID, perceivedEffort: Int?, notes: String?) async throws {}
    public func recentSessions(limit: Int) async throws -> [WorkoutSession] { Sample.recentSessions }
}

public struct MockNutritionRepository: NutritionRepository {
    public init() {}
    public func searchFoods(_ params: SearchFoodsParams) async throws -> [FoodSearchResult] {
        guard !params.q.isEmpty else { return Sample.foodSearchResults }
        return Sample.foodSearchResults.filter { $0.name.lowercased().contains(params.q.lowercased()) }
    }
    public func logFood(_ params: LogFoodParams) async throws -> UUID { UUID() }
    public func quickAdd(_ log: NutritionLog) async throws -> NutritionLog { log }
    public func logs(on day: DateOnly) async throws -> [NutritionLog] { Sample.nutritionLogs }
    public func dailyTotals(on day: DateOnly) async throws -> DailyNutrition? { Sample.dailyNutrition }
    public func deleteLog(id: UUID) async throws {}
    public func nutritionProfile() async throws -> NutritionProfile? { Sample.nutritionProfile }
}

public struct MockProgressRepository: ProgressRepository {
    public init() {}
    public func bodyMetrics(limit: Int) async throws -> [BodyMetric] { Sample.bodyMetrics }
    public func upsertBodyMetric(_ metric: BodyMetric) async throws -> BodyMetric { metric }
    public func personalRecords() async throws -> [ExercisePR] { Sample.personalRecords }
    public func progressPhotos() async throws -> [ProgressPhoto] { [] }
    public func uploadPhoto(jpeg: Data, pose: PhotoPose, takenOn: DateOnly) async throws -> ProgressPhoto {
        ProgressPhoto(id: UUID(), userId: Sample.userId, takenOn: takenOn, pose: pose, storagePath: "preview/mock.jpg")
    }
    public func signedURL(for photo: ProgressPhoto) async throws -> URL { URL(string: "https://example.com/mock.jpg")! }
}
