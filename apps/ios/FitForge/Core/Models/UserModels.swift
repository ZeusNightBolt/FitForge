import Foundation

// MARK: - User plane models
//
// Codable mirrors of the RLS-locked user tables in
// supabase/migrations/0003_user_tables.sql (BLUEPRINT §4.3). Every user row is
// owned via user_id = auth.uid(); clients never pass other users' ids.

public struct Profile: Codable, Identifiable, Hashable, Sendable {
    public var id: UUID
    public var displayName: String?
    public var sex: SexType?
    public var birthdate: DateOnly?
    public var heightCm: Double?
    public var unitSystem: UnitSystem
    public var experienceLevel: ExperienceLevel?
    public var primaryGoal: GoalType?
    public var secondaryGoal: GoalType?
    public var trainingLocation: TrainingLocation?
    public var daysPerWeek: Int?
    public var sessionMinutes: Int?
    public var preferredDays: [Int]         // 0=Mon … 6=Sun
    public var onboardingStep: String
    public var onboardingCompletedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, sex, birthdate
        case displayName = "display_name"
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

    public init(id: UUID, displayName: String? = nil, sex: SexType? = nil, birthdate: DateOnly? = nil,
                heightCm: Double? = nil, unitSystem: UnitSystem = .metric,
                experienceLevel: ExperienceLevel? = nil, primaryGoal: GoalType? = nil,
                secondaryGoal: GoalType? = nil, trainingLocation: TrainingLocation? = nil,
                daysPerWeek: Int? = nil, sessionMinutes: Int? = nil, preferredDays: [Int] = [],
                onboardingStep: String = "goals", onboardingCompletedAt: Date? = nil) {
        self.id = id; self.displayName = displayName; self.sex = sex; self.birthdate = birthdate
        self.heightCm = heightCm; self.unitSystem = unitSystem; self.experienceLevel = experienceLevel
        self.primaryGoal = primaryGoal; self.secondaryGoal = secondaryGoal
        self.trainingLocation = trainingLocation; self.daysPerWeek = daysPerWeek
        self.sessionMinutes = sessionMinutes; self.preferredDays = preferredDays
        self.onboardingStep = onboardingStep; self.onboardingCompletedAt = onboardingCompletedAt
    }

    public var isOnboardingComplete: Bool { onboardingCompletedAt != nil }
}

public struct UserEquipment: Codable, Hashable, Sendable {
    public let userId: UUID
    public let equipmentId: UUID

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case equipmentId = "equipment_id"
    }
}

public struct UserExercisePreference: Codable, Hashable, Sendable {
    public let userId: UUID
    public let exerciseId: UUID
    public let preference: PreferenceType
    public let exclusionReason: ExclusionReason?
    public let preferredSubstituteId: UUID?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case exerciseId = "exercise_id"
        case preference
        case exclusionReason = "exclusion_reason"
        case preferredSubstituteId = "preferred_substitute_id"
    }

    public init(userId: UUID, exerciseId: UUID, preference: PreferenceType,
                exclusionReason: ExclusionReason? = nil, preferredSubstituteId: UUID? = nil) {
        self.userId = userId; self.exerciseId = exerciseId; self.preference = preference
        self.exclusionReason = exclusionReason; self.preferredSubstituteId = preferredSubstituteId
    }
}

public struct UserMovementExclusion: Codable, Hashable, Sendable {
    public let userId: UUID
    public let movementPattern: MovementPattern
    public let reason: ExclusionReason
    public let sourceBodyArea: String?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case movementPattern = "movement_pattern"
        case reason
        case sourceBodyArea = "source_body_area"
    }

    public init(userId: UUID, movementPattern: MovementPattern, reason: ExclusionReason = .injury,
                sourceBodyArea: String? = nil) {
        self.userId = userId; self.movementPattern = movementPattern
        self.reason = reason; self.sourceBodyArea = sourceBodyArea
    }
}

public struct NutritionProfile: Codable, Hashable, Sendable {
    public var userId: UUID
    public var dietType: DietType
    public var allergies: [String]
    public var mealsPerDay: Int
    public var kcalTarget: Int?
    public var proteinGTarget: Int?
    public var carbsGTarget: Int?
    public var fatGTarget: Int?
    public var targetsSource: TargetsSource

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case dietType = "diet_type"
        case allergies
        case mealsPerDay = "meals_per_day"
        case kcalTarget = "kcal_target"
        case proteinGTarget = "protein_g_target"
        case carbsGTarget = "carbs_g_target"
        case fatGTarget = "fat_g_target"
        case targetsSource = "targets_source"
    }

    public init(userId: UUID, dietType: DietType = .none, allergies: [String] = [],
                mealsPerDay: Int = 3, kcalTarget: Int? = nil, proteinGTarget: Int? = nil,
                carbsGTarget: Int? = nil, fatGTarget: Int? = nil, targetsSource: TargetsSource = .suggested) {
        self.userId = userId; self.dietType = dietType; self.allergies = allergies
        self.mealsPerDay = mealsPerDay; self.kcalTarget = kcalTarget; self.proteinGTarget = proteinGTarget
        self.carbsGTarget = carbsGTarget; self.fatGTarget = fatGTarget; self.targetsSource = targetsSource
    }
}

public struct UserFoodPreference: Codable, Hashable, Sendable {
    public let userId: UUID
    public let foodId: UUID
    public let preference: PreferenceType

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case foodId = "food_id"
        case preference
    }
}

public struct Routine: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public var userId: UUID
    public var name: String
    public var description: String?
    public var goal: GoalType?
    public var source: RoutineSource
    public var isActive: Bool
    public var startDate: DateOnly?

    enum CodingKeys: String, CodingKey {
        case id, name, description, goal, source
        case userId = "user_id"
        case isActive = "is_active"
        case startDate = "start_date"
    }

    public init(id: UUID, userId: UUID, name: String, description: String? = nil, goal: GoalType? = nil,
                source: RoutineSource = .custom, isActive: Bool = false, startDate: DateOnly? = nil) {
        self.id = id; self.userId = userId; self.name = name; self.description = description
        self.goal = goal; self.source = source; self.isActive = isActive; self.startDate = startDate
    }
}

public struct RoutineDay: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public var routineId: UUID
    public var dayIndex: Int
    public var name: String
    public var focus: String?
    public var weekday: Int?

    enum CodingKeys: String, CodingKey {
        case id, name, focus, weekday
        case routineId = "routine_id"
        case dayIndex = "day_index"
    }

    public init(id: UUID, routineId: UUID, dayIndex: Int, name: String, focus: String? = nil, weekday: Int? = nil) {
        self.id = id; self.routineId = routineId; self.dayIndex = dayIndex
        self.name = name; self.focus = focus; self.weekday = weekday
    }
}

public struct RoutineExercise: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public var routineDayId: UUID
    public var position: Int
    public var exerciseId: UUID
    public var sets: Int
    public var repMin: Int
    public var repMax: Int
    public var targetRpe: Double?
    public var restSeconds: Int
    public var supersetGroup: Int?
    public var notes: String?

    enum CodingKeys: String, CodingKey {
        case id, position, sets, notes
        case routineDayId = "routine_day_id"
        case exerciseId = "exercise_id"
        case repMin = "rep_min"
        case repMax = "rep_max"
        case targetRpe = "target_rpe"
        case restSeconds = "rest_seconds"
        case supersetGroup = "superset_group"
    }

    public init(id: UUID, routineDayId: UUID, position: Int, exerciseId: UUID, sets: Int = 3,
                repMin: Int = 8, repMax: Int = 12, targetRpe: Double? = nil, restSeconds: Int = 90,
                supersetGroup: Int? = nil, notes: String? = nil) {
        self.id = id; self.routineDayId = routineDayId; self.position = position
        self.exerciseId = exerciseId; self.sets = sets; self.repMin = repMin; self.repMax = repMax
        self.targetRpe = targetRpe; self.restSeconds = restSeconds; self.supersetGroup = supersetGroup
        self.notes = notes
    }

    public var repRangeText: String { repMin == repMax ? "\(repMin)" : "\(repMin)–\(repMax)" }
}

public struct WorkoutSession: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public var userId: UUID
    public var routineDayId: UUID?
    public var startedAt: Date
    public var completedAt: Date?
    public var perceivedEffort: Int?
    public var notes: String?

    enum CodingKeys: String, CodingKey {
        case id, notes
        case userId = "user_id"
        case routineDayId = "routine_day_id"
        case startedAt = "started_at"
        case completedAt = "completed_at"
        case perceivedEffort = "perceived_effort"
    }

    public init(id: UUID, userId: UUID, routineDayId: UUID? = nil, startedAt: Date = Date(),
                completedAt: Date? = nil, perceivedEffort: Int? = nil, notes: String? = nil) {
        self.id = id; self.userId = userId; self.routineDayId = routineDayId; self.startedAt = startedAt
        self.completedAt = completedAt; self.perceivedEffort = perceivedEffort; self.notes = notes
    }
}

public struct SetLog: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public var sessionId: UUID
    public var exerciseId: UUID
    public var exerciseNameSnapshot: String
    public var setNumber: Int
    public var reps: Int
    public var weightKg: Double
    public var rpe: Double?
    public var isWarmup: Bool
    public var completedAt: Date

    enum CodingKeys: String, CodingKey {
        case id, reps, rpe
        case sessionId = "session_id"
        case exerciseId = "exercise_id"
        case exerciseNameSnapshot = "exercise_name_snapshot"
        case setNumber = "set_number"
        case weightKg = "weight_kg"
        case isWarmup = "is_warmup"
        case completedAt = "completed_at"
    }

    public init(id: UUID, sessionId: UUID, exerciseId: UUID, exerciseNameSnapshot: String,
                setNumber: Int, reps: Int, weightKg: Double = 0, rpe: Double? = nil,
                isWarmup: Bool = false, completedAt: Date = Date()) {
        self.id = id; self.sessionId = sessionId; self.exerciseId = exerciseId
        self.exerciseNameSnapshot = exerciseNameSnapshot; self.setNumber = setNumber; self.reps = reps
        self.weightKg = weightKg; self.rpe = rpe; self.isWarmup = isWarmup; self.completedAt = completedAt
    }

    /// Epley estimated 1RM (BLUEPRINT §5.2 v_exercise_prs).
    public var e1rm: Double { weightKg * (1 + Double(reps) / 30.0) }
}

public struct Meal: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public var userId: UUID
    public var name: String

    enum CodingKeys: String, CodingKey {
        case id, name
        case userId = "user_id"
    }
}

public struct MealItem: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public var mealId: UUID
    public var foodId: UUID
    public var quantityG: Double

    enum CodingKeys: String, CodingKey {
        case id
        case mealId = "meal_id"
        case foodId = "food_id"
        case quantityG = "quantity_g"
    }
}

public struct NutritionLog: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public var userId: UUID
    public var loggedOn: DateOnly
    public var mealSlot: MealSlot
    public var foodId: UUID?
    public var customName: String?
    public var quantityG: Double?
    public var kcal: Double
    public var proteinG: Double
    public var carbsG: Double
    public var fatG: Double

    enum CodingKeys: String, CodingKey {
        case id, kcal
        case userId = "user_id"
        case loggedOn = "logged_on"
        case mealSlot = "meal_slot"
        case foodId = "food_id"
        case customName = "custom_name"
        case quantityG = "quantity_g"
        case proteinG = "protein_g"
        case carbsG = "carbs_g"
        case fatG = "fat_g"
    }

    public init(id: UUID, userId: UUID, loggedOn: DateOnly, mealSlot: MealSlot, foodId: UUID? = nil,
                customName: String? = nil, quantityG: Double? = nil, kcal: Double, proteinG: Double = 0,
                carbsG: Double = 0, fatG: Double = 0) {
        self.id = id; self.userId = userId; self.loggedOn = loggedOn; self.mealSlot = mealSlot
        self.foodId = foodId; self.customName = customName; self.quantityG = quantityG
        self.kcal = kcal; self.proteinG = proteinG; self.carbsG = carbsG; self.fatG = fatG
    }

    public var displayName: String { customName ?? "Logged food" }
    public var macros: Macros { Macros(kcal: kcal, protein: proteinG, carbs: carbsG, fat: fatG) }
}

public struct BodyMetric: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public var userId: UUID
    public var measuredOn: DateOnly
    public var weightKg: Double?
    public var bodyFatPct: Double?
    public var waistCm: Double?
    public var chestCm: Double?
    public var hipsCm: Double?
    public var armCm: Double?
    public var thighCm: Double?
    public var neckCm: Double?
    public var notes: String?

    enum CodingKeys: String, CodingKey {
        case id, notes
        case userId = "user_id"
        case measuredOn = "measured_on"
        case weightKg = "weight_kg"
        case bodyFatPct = "body_fat_pct"
        case waistCm = "waist_cm"
        case chestCm = "chest_cm"
        case hipsCm = "hips_cm"
        case armCm = "arm_cm"
        case thighCm = "thigh_cm"
        case neckCm = "neck_cm"
    }

    public init(id: UUID, userId: UUID, measuredOn: DateOnly, weightKg: Double? = nil,
                bodyFatPct: Double? = nil, waistCm: Double? = nil, chestCm: Double? = nil,
                hipsCm: Double? = nil, armCm: Double? = nil, thighCm: Double? = nil,
                neckCm: Double? = nil, notes: String? = nil) {
        self.id = id; self.userId = userId; self.measuredOn = measuredOn; self.weightKg = weightKg
        self.bodyFatPct = bodyFatPct; self.waistCm = waistCm; self.chestCm = chestCm; self.hipsCm = hipsCm
        self.armCm = armCm; self.thighCm = thighCm; self.neckCm = neckCm; self.notes = notes
    }
}

public struct ProgressPhoto: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public var userId: UUID
    public var takenOn: DateOnly
    public var pose: PhotoPose
    public var storagePath: String

    enum CodingKeys: String, CodingKey {
        case id, pose
        case userId = "user_id"
        case takenOn = "taken_on"
        case storagePath = "storage_path"
    }

    public init(id: UUID, userId: UUID, takenOn: DateOnly, pose: PhotoPose = .front, storagePath: String) {
        self.id = id; self.userId = userId; self.takenOn = takenOn; self.pose = pose; self.storagePath = storagePath
    }
}

// MARK: - Nested read models (§5.1 nested selects)

/// Full active-routine tree from:
/// `routines?select=*,routine_days(*,routine_exercises(*,exercises(name,slug,image_path)))`
public struct RoutineTree: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let userId: UUID
    public let name: String
    public let description: String?
    public let goal: GoalType?
    public let source: RoutineSource
    public let isActive: Bool
    public let startDate: DateOnly?
    public let routineDays: [RoutineDayTree]

    enum CodingKeys: String, CodingKey {
        case id, name, description, goal, source
        case userId = "user_id"
        case isActive = "is_active"
        case startDate = "start_date"
        case routineDays = "routine_days"
    }

    public init(id: UUID, userId: UUID, name: String, description: String? = nil, goal: GoalType? = nil,
                source: RoutineSource = .generated, isActive: Bool = true, startDate: DateOnly? = nil,
                routineDays: [RoutineDayTree] = []) {
        self.id = id; self.userId = userId; self.name = name; self.description = description
        self.goal = goal; self.source = source; self.isActive = isActive; self.startDate = startDate
        self.routineDays = routineDays
    }
}

public struct RoutineDayTree: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let dayIndex: Int
    public let name: String
    public let focus: String?
    public let weekday: Int?
    public let routineExercises: [RoutineExerciseTree]

    enum CodingKeys: String, CodingKey {
        case id, name, focus, weekday
        case dayIndex = "day_index"
        case routineExercises = "routine_exercises"
    }

    public init(id: UUID, dayIndex: Int, name: String, focus: String? = nil, weekday: Int? = nil,
                routineExercises: [RoutineExerciseTree] = []) {
        self.id = id; self.dayIndex = dayIndex; self.name = name; self.focus = focus
        self.weekday = weekday; self.routineExercises = routineExercises
    }
}

public struct RoutineExerciseTree: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let position: Int
    public let exerciseId: UUID
    public let sets: Int
    public let repMin: Int
    public let repMax: Int
    public let targetRpe: Double?
    public let restSeconds: Int
    public let supersetGroup: Int?
    public let notes: String?
    public let exercise: ExerciseStub?

    enum CodingKeys: String, CodingKey {
        case id, position, sets, notes, exercise = "exercises"
        case exerciseId = "exercise_id"
        case repMin = "rep_min"
        case repMax = "rep_max"
        case targetRpe = "target_rpe"
        case restSeconds = "rest_seconds"
        case supersetGroup = "superset_group"
    }

    public init(id: UUID, position: Int, exerciseId: UUID, sets: Int = 3, repMin: Int = 8, repMax: Int = 12,
                targetRpe: Double? = nil, restSeconds: Int = 90, supersetGroup: Int? = nil,
                notes: String? = nil, exercise: ExerciseStub? = nil) {
        self.id = id; self.position = position; self.exerciseId = exerciseId; self.sets = sets
        self.repMin = repMin; self.repMax = repMax; self.targetRpe = targetRpe; self.restSeconds = restSeconds
        self.supersetGroup = supersetGroup; self.notes = notes; self.exercise = exercise
    }

    public var repRangeText: String { repMin == repMax ? "\(repMin)" : "\(repMin)–\(repMax)" }
}

/// The `exercises(name,slug,image_path)` embed on routine_exercises.
public struct ExerciseStub: Codable, Hashable, Sendable {
    public let name: String
    public let slug: String
    public let imagePath: String?

    enum CodingKeys: String, CodingKey {
        case name, slug
        case imagePath = "image_path"
    }

    public init(name: String, slug: String, imagePath: String? = nil) {
        self.name = name; self.slug = slug; self.imagePath = imagePath
    }
}
