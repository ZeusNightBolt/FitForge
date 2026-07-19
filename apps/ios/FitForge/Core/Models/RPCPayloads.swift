import Foundation

// MARK: - RPC request params & result rows
//
// Codable mirrors of the RPC signatures in BLUEPRINT §5.3. Request structs are
// Encodable param bags passed to `client.rpc(_:params:)`; result structs decode
// each `setof (...)` / composite return. Column names are the exact SQL OUT
// parameter names (snake_case), so decoding needs no key remapping beyond these.

// MARK: search_exercises

public struct SearchExercisesParams: Encodable, Sendable {
    public let q: String
    public let pLimit: Int
    public let filterEquipment: Bool
    public let categorySlug: String?

    enum CodingKeys: String, CodingKey {
        case q
        case pLimit = "p_limit"
        case filterEquipment = "filter_equipment"
        case categorySlug = "category_slug"
    }

    public init(q: String, pLimit: Int = 10, filterEquipment: Bool = false, categorySlug: String? = nil) {
        self.q = q; self.pLimit = pLimit; self.filterEquipment = filterEquipment; self.categorySlug = categorySlug
    }
}

public struct ExerciseSearchResult: Codable, Identifiable, Hashable, Sendable {
    public let exerciseId: UUID
    public let slug: String
    public let name: String
    public let matchedAlias: String?
    public let score: Double

    public var id: UUID { exerciseId }

    enum CodingKeys: String, CodingKey {
        case exerciseId = "exercise_id"
        case slug, name, score
        case matchedAlias = "matched_alias"
    }

    public init(exerciseId: UUID, slug: String, name: String, matchedAlias: String? = nil, score: Double) {
        self.exerciseId = exerciseId; self.slug = slug; self.name = name
        self.matchedAlias = matchedAlias; self.score = score
    }
}

// MARK: search_foods

public struct SearchFoodsParams: Encodable, Sendable {
    public let q: String
    public let pLimit: Int
    public let applyDietFilter: Bool

    enum CodingKeys: String, CodingKey {
        case q
        case pLimit = "p_limit"
        case applyDietFilter = "apply_diet_filter"
    }

    public init(q: String, pLimit: Int = 10, applyDietFilter: Bool = true) {
        self.q = q; self.pLimit = pLimit; self.applyDietFilter = applyDietFilter
    }
}

public struct FoodSearchResult: Codable, Identifiable, Hashable, Sendable {
    public let foodId: UUID
    public let slug: String
    public let name: String
    public let brand: String?
    public let kcal: Double
    public let proteinG: Double
    public let servingName: String
    public let servingGrams: Double
    public let score: Double

    public var id: UUID { foodId }

    enum CodingKeys: String, CodingKey {
        case foodId = "food_id"
        case slug, name, brand, kcal, score
        case proteinG = "protein_g"
        case servingName = "serving_name"
        case servingGrams = "serving_grams"
    }

    public init(foodId: UUID, slug: String, name: String, brand: String? = nil, kcal: Double,
                proteinG: Double, servingName: String, servingGrams: Double, score: Double) {
        self.foodId = foodId; self.slug = slug; self.name = name; self.brand = brand; self.kcal = kcal
        self.proteinG = proteinG; self.servingName = servingName; self.servingGrams = servingGrams; self.score = score
    }
}

// MARK: suggest_substitutes

public struct SuggestSubstitutesParams: Encodable, Sendable {
    public let pExerciseId: UUID
    public let pLimit: Int

    enum CodingKeys: String, CodingKey {
        case pExerciseId = "p_exercise_id"
        case pLimit = "p_limit"
    }

    public init(pExerciseId: UUID, pLimit: Int = 5) {
        self.pExerciseId = pExerciseId; self.pLimit = pLimit
    }
}

public struct SubstituteResult: Codable, Identifiable, Hashable, Sendable {
    public let exerciseId: UUID
    public let slug: String
    public let name: String
    public let score: Double
    public let reason: String?

    public var id: UUID { exerciseId }

    enum CodingKeys: String, CodingKey {
        case exerciseId = "exercise_id"
        case slug, name, score, reason
    }

    public init(exerciseId: UUID, slug: String, name: String, score: Double, reason: String? = nil) {
        self.exerciseId = exerciseId; self.slug = slug; self.name = name; self.score = score; self.reason = reason
    }
}

// MARK: suggest_nutrition_targets

public struct NutritionTargets: Codable, Hashable, Sendable {
    public let kcal: Int
    public let proteinG: Int
    public let carbsG: Int
    public let fatG: Int
    public let method: String

    enum CodingKeys: String, CodingKey {
        case kcal, method
        case proteinG = "protein_g"
        case carbsG = "carbs_g"
        case fatG = "fat_g"
    }

    public init(kcal: Int, proteinG: Int, carbsG: Int, fatG: Int, method: String) {
        self.kcal = kcal; self.proteinG = proteinG; self.carbsG = carbsG; self.fatG = fatG; self.method = method
    }
}

// MARK: suggest_onboarding_defaults

public struct SuggestDefaultsParams: Encodable, Sendable {
    public let pGoal: GoalType
    public let pExperience: ExperienceLevel

    enum CodingKeys: String, CodingKey {
        case pGoal = "p_goal"
        case pExperience = "p_experience"
    }

    public init(pGoal: GoalType, pExperience: ExperienceLevel) {
        self.pGoal = pGoal; self.pExperience = pExperience
    }
}

public struct OnboardingDefaults: Codable, Hashable, Sendable {
    public let daysPerWeek: Int
    public let sessionMinutes: Int
    public let repMin: Int
    public let repMax: Int
    public let splitName: String

    enum CodingKeys: String, CodingKey {
        case daysPerWeek = "days_per_week"
        case sessionMinutes = "session_minutes"
        case repMin = "rep_min"
        case repMax = "rep_max"
        case splitName = "split_name"
    }

    public init(daysPerWeek: Int, sessionMinutes: Int, repMin: Int, repMax: Int, splitName: String) {
        self.daysPerWeek = daysPerWeek; self.sessionMinutes = sessionMinutes
        self.repMin = repMin; self.repMax = repMax; self.splitName = splitName
    }
}

// MARK: generate_starter_routine

public struct GenerateRoutineParams: Encodable, Sendable {
    public let pName: String?

    enum CodingKeys: String, CodingKey { case pName = "p_name" }

    public init(pName: String? = nil) { self.pName = pName }
}

// MARK: onboarding_status

public struct OnboardingStatus: Codable, Hashable, Sendable {
    public let complete: Bool
    public let missing: [String]
    public let resumeStep: String

    enum CodingKeys: String, CodingKey {
        case complete, missing
        case resumeStep = "resume_step"
    }

    public init(complete: Bool, missing: [String], resumeStep: String) {
        self.complete = complete; self.missing = missing; self.resumeStep = resumeStep
    }
}

// MARK: set_user_equipment

public struct SetUserEquipmentParams: Encodable, Sendable {
    public let equipmentSlugs: [String]

    enum CodingKeys: String, CodingKey { case equipmentSlugs = "equipment_slugs" }

    public init(equipmentSlugs: [String]) { self.equipmentSlugs = equipmentSlugs }
}

// MARK: log_food

public struct LogFoodParams: Encodable, Sendable {
    public let pFoodId: UUID
    public let pQuantityG: Double
    public let pMealSlot: MealSlot
    public let pLoggedOn: DateOnly?

    enum CodingKeys: String, CodingKey {
        case pFoodId = "p_food_id"
        case pQuantityG = "p_quantity_g"
        case pMealSlot = "p_meal_slot"
        case pLoggedOn = "p_logged_on"
    }

    public init(pFoodId: UUID, pQuantityG: Double, pMealSlot: MealSlot, pLoggedOn: DateOnly? = nil) {
        self.pFoodId = pFoodId; self.pQuantityG = pQuantityG; self.pMealSlot = pMealSlot; self.pLoggedOn = pLoggedOn
    }
}

// MARK: previous_sets

public struct PreviousSetsParams: Encodable, Sendable {
    public let pExerciseId: UUID

    enum CodingKeys: String, CodingKey { case pExerciseId = "p_exercise_id" }

    public init(pExerciseId: UUID) { self.pExerciseId = pExerciseId }
}

public struct PreviousSet: Codable, Identifiable, Hashable, Sendable {
    public let setNumber: Int
    public let reps: Int
    public let weightKg: Double
    public let rpe: Double?

    public var id: Int { setNumber }

    enum CodingKeys: String, CodingKey {
        case setNumber = "set_number"
        case reps
        case weightKg = "weight_kg"
        case rpe
    }

    public init(setNumber: Int, reps: Int, weightKg: Double, rpe: Double? = nil) {
        self.setNumber = setNumber; self.reps = reps; self.weightKg = weightKg; self.rpe = rpe
    }
}

// MARK: v_daily_nutrition / v_exercise_prs read models (§5.2)

public struct DailyNutrition: Codable, Hashable, Sendable {
    public let userId: UUID
    public let loggedOn: DateOnly
    public let kcal: Double
    public let proteinG: Double
    public let carbsG: Double
    public let fatG: Double

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case loggedOn = "logged_on"
        case kcal
        case proteinG = "protein_g"
        case carbsG = "carbs_g"
        case fatG = "fat_g"
    }

    public var macros: Macros { Macros(kcal: kcal, protein: proteinG, carbs: carbsG, fat: fatG) }
}

public struct ExercisePR: Codable, Identifiable, Hashable, Sendable {
    public let userId: UUID
    public let exerciseId: UUID
    public let exerciseName: String
    public let bestE1rm: Double
    public let bestWeightKg: Double

    public var id: UUID { exerciseId }

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case exerciseId = "exercise_id"
        case exerciseName = "exercise_name"
        case bestE1rm = "best_e1rm"
        case bestWeightKg = "best_weight_kg"
    }

    public init(userId: UUID, exerciseId: UUID, exerciseName: String, bestE1rm: Double, bestWeightKg: Double) {
        self.userId = userId; self.exerciseId = exerciseId; self.exerciseName = exerciseName
        self.bestE1rm = bestE1rm; self.bestWeightKg = bestWeightKg
    }
}
