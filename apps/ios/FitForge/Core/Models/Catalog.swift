import Foundation

// MARK: - Catalog plane models
//
// Codable mirrors of the world-readable catalog tables in
// supabase/migrations/0002_catalog.sql (BLUEPRINT §4.2). All use snake_case
// coding keys to decode PostgREST JSON directly.

public struct Equipment: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let slug: String
    public let name: String
    public let category: EquipmentCategory
    public let description: String?
    public let commonInHome: Bool
    public let commonInGym: Bool

    enum CodingKeys: String, CodingKey {
        case id, slug, name, category, description
        case commonInHome = "common_in_home"
        case commonInGym = "common_in_gym"
    }

    public init(id: UUID, slug: String, name: String, category: EquipmentCategory,
                description: String? = nil, commonInHome: Bool = false, commonInGym: Bool = true) {
        self.id = id; self.slug = slug; self.name = name; self.category = category
        self.description = description; self.commonInHome = commonInHome; self.commonInGym = commonInGym
    }
}

public struct MuscleGroup: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let slug: String
    public let name: String
    public let region: MuscleRegion
    public let displayOrder: Int

    enum CodingKeys: String, CodingKey {
        case id, slug, name, region
        case displayOrder = "display_order"
    }
}

public struct Muscle: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let slug: String
    public let name: String
    public let latinName: String?
    public let muscleGroupId: UUID
    public let isFront: Bool

    enum CodingKeys: String, CodingKey {
        case id, slug, name
        case latinName = "latin_name"
        case muscleGroupId = "muscle_group_id"
        case isFront = "is_front"
    }
}

public struct ExerciseCategory: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let slug: String
    public let name: String
    public let displayOrder: Int

    enum CodingKeys: String, CodingKey {
        case id, slug, name
        case displayOrder = "display_order"
    }
}

public struct Exercise: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let slug: String
    public let name: String
    public let aliases: [String]
    public let categoryId: UUID
    public let movementPattern: MovementPattern
    public let mechanics: MechanicsType
    public let difficulty: DifficultyLevel
    public let isUnilateral: Bool
    public let isBodyweightOk: Bool
    public let instructions: String?
    public let videoUrl: String?
    public let imagePath: String?
    public let tags: [String]
    public let popularity: Int
    public let isActive: Bool

    enum CodingKeys: String, CodingKey {
        case id, slug, name, aliases, mechanics, difficulty, instructions, tags, popularity
        case categoryId = "category_id"
        case movementPattern = "movement_pattern"
        case isUnilateral = "is_unilateral"
        case isBodyweightOk = "is_bodyweight_ok"
        case videoUrl = "video_url"
        case imagePath = "image_path"
        case isActive = "is_active"
    }

    public init(id: UUID, slug: String, name: String, aliases: [String] = [], categoryId: UUID,
                movementPattern: MovementPattern, mechanics: MechanicsType,
                difficulty: DifficultyLevel = .beginner, isUnilateral: Bool = false,
                isBodyweightOk: Bool = false, instructions: String? = nil, videoUrl: String? = nil,
                imagePath: String? = nil, tags: [String] = [], popularity: Int = 50, isActive: Bool = true) {
        self.id = id; self.slug = slug; self.name = name; self.aliases = aliases
        self.categoryId = categoryId; self.movementPattern = movementPattern; self.mechanics = mechanics
        self.difficulty = difficulty; self.isUnilateral = isUnilateral; self.isBodyweightOk = isBodyweightOk
        self.instructions = instructions; self.videoUrl = videoUrl; self.imagePath = imagePath
        self.tags = tags; self.popularity = popularity; self.isActive = isActive
    }
}

public struct ExerciseMuscle: Codable, Hashable, Sendable {
    public let exerciseId: UUID
    public let muscleId: UUID
    public let role: MuscleRole

    enum CodingKeys: String, CodingKey {
        case exerciseId = "exercise_id"
        case muscleId = "muscle_id"
        case role
    }
}

public struct ExerciseEquipment: Codable, Hashable, Sendable {
    public let exerciseId: UUID
    public let equipmentId: UUID
    public let altGroup: Int

    enum CodingKeys: String, CodingKey {
        case exerciseId = "exercise_id"
        case equipmentId = "equipment_id"
        case altGroup = "alt_group"
    }
}

public struct ExerciseSubstitution: Codable, Hashable, Sendable {
    public let exerciseId: UUID
    public let substituteId: UUID
    public let similarity: Int
    public let reason: String?

    enum CodingKeys: String, CodingKey {
        case exerciseId = "exercise_id"
        case substituteId = "substitute_id"
        case similarity, reason
    }
}

public struct Food: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let slug: String
    public let name: String
    public let brand: String?
    public let category: FoodCategory
    public let kcal: Double
    public let proteinG: Double
    public let carbsG: Double
    public let fatG: Double
    public let fiberG: Double
    public let sugarG: Double
    public let sodiumMg: Double
    public let servingName: String
    public let servingGrams: Double
    public let dietTags: [String]
    public let allergenTags: [String]
    public let verified: Bool
    public let source: String
    public let isActive: Bool

    enum CodingKeys: String, CodingKey {
        case id, slug, name, brand, category, kcal, verified, source
        case proteinG = "protein_g"
        case carbsG = "carbs_g"
        case fatG = "fat_g"
        case fiberG = "fiber_g"
        case sugarG = "sugar_g"
        case sodiumMg = "sodium_mg"
        case servingName = "serving_name"
        case servingGrams = "serving_grams"
        case dietTags = "diet_tags"
        case allergenTags = "allergen_tags"
        case isActive = "is_active"
    }

    /// Macros for an arbitrary gram quantity (catalog stores per 100 g).
    public func macros(forGrams grams: Double) -> Macros {
        let factor = grams / 100.0
        return Macros(kcal: kcal * factor, protein: proteinG * factor,
                      carbs: carbsG * factor, fat: fatG * factor)
    }
}

/// Convenience macro tuple used across nutrition UI.
public struct Macros: Hashable, Sendable {
    public var kcal: Double
    public var protein: Double
    public var carbs: Double
    public var fat: Double

    public init(kcal: Double = 0, protein: Double = 0, carbs: Double = 0, fat: Double = 0) {
        self.kcal = kcal; self.protein = protein; self.carbs = carbs; self.fat = fat
    }

    public static func + (lhs: Macros, rhs: Macros) -> Macros {
        Macros(kcal: lhs.kcal + rhs.kcal, protein: lhs.protein + rhs.protein,
               carbs: lhs.carbs + rhs.carbs, fat: lhs.fat + rhs.fat)
    }
}

// MARK: - Joined read model (v_exercise_full / nested PostgREST select §5.1)

/// Mirrors the aggregated exercise-detail read used for catalog list + detail.
/// Populated either from the `v_exercise_full` view or the nested
/// `exercises?select=*,exercise_muscles(...),exercise_equipment(...)` select.
public struct ExerciseFull: Codable, Identifiable, Hashable, Sendable {
    public let id: UUID
    public let slug: String
    public let name: String
    public let aliases: [String]
    public let categoryName: String?
    public let movementPattern: MovementPattern
    public let mechanics: MechanicsType
    public let difficulty: DifficultyLevel
    public let isUnilateral: Bool
    public let isBodyweightOk: Bool
    public let instructions: String?
    public let imagePath: String?
    public let popularity: Int
    public let primaryMuscleSlugs: [String]
    public let secondaryMuscleSlugs: [String]
    public let equipmentSlugs: [String]

    enum CodingKeys: String, CodingKey {
        case id, slug, name, aliases, mechanics, difficulty, instructions, popularity
        case categoryName = "category_name"
        case movementPattern = "movement_pattern"
        case isUnilateral = "is_unilateral"
        case isBodyweightOk = "is_bodyweight_ok"
        case imagePath = "image_path"
        case primaryMuscleSlugs = "primary_muscle_slugs"
        case secondaryMuscleSlugs = "secondary_muscle_slugs"
        case equipmentSlugs = "equipment_slugs"
    }

    public init(id: UUID, slug: String, name: String, aliases: [String] = [], categoryName: String? = nil,
                movementPattern: MovementPattern, mechanics: MechanicsType, difficulty: DifficultyLevel,
                isUnilateral: Bool = false, isBodyweightOk: Bool = false, instructions: String? = nil,
                imagePath: String? = nil, popularity: Int = 50, primaryMuscleSlugs: [String] = [],
                secondaryMuscleSlugs: [String] = [], equipmentSlugs: [String] = []) {
        self.id = id; self.slug = slug; self.name = name; self.aliases = aliases
        self.categoryName = categoryName; self.movementPattern = movementPattern
        self.mechanics = mechanics; self.difficulty = difficulty; self.isUnilateral = isUnilateral
        self.isBodyweightOk = isBodyweightOk; self.instructions = instructions; self.imagePath = imagePath
        self.popularity = popularity; self.primaryMuscleSlugs = primaryMuscleSlugs
        self.secondaryMuscleSlugs = secondaryMuscleSlugs; self.equipmentSlugs = equipmentSlugs
    }
}
