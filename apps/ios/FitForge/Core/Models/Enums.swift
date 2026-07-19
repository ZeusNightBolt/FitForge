import Foundation

// MARK: - Domain enums
//
// These mirror the Postgres enum types declared in
// supabase/migrations/0001_extensions_enums.sql (BLUEPRINT §4.1) *verbatim*.
// Raw values are the exact Postgres enum labels so PostgREST JSON decodes
// directly. Do not rename — they are contractual across web + iOS.

public enum GoalType: String, Codable, CaseIterable, Identifiable, Sendable {
    case strength
    case hypertrophy
    case fatLoss = "fat_loss"
    case endurance
    case generalHealth = "general_health"

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .strength: return "Strength"
        case .hypertrophy: return "Build muscle"
        case .fatLoss: return "Lose fat"
        case .endurance: return "Endurance"
        case .generalHealth: return "General health"
        }
    }

    public var systemImage: String {
        switch self {
        case .strength: return "dumbbell.fill"
        case .hypertrophy: return "figure.strengthtraining.traditional"
        case .fatLoss: return "flame.fill"
        case .endurance: return "figure.run"
        case .generalHealth: return "heart.fill"
        }
    }
}

public enum ExperienceLevel: String, Codable, CaseIterable, Identifiable, Sendable {
    case beginner
    case intermediate
    case advanced

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .beginner: return "Beginner"
        case .intermediate: return "Intermediate"
        case .advanced: return "Advanced"
        }
    }

    public var subtitle: String {
        switch self {
        case .beginner: return "Less than 1 year of consistent training"
        case .intermediate: return "1–3 years of consistent training"
        case .advanced: return "3+ years of consistent training"
        }
    }

    /// Difficulty ceiling ordering used by the substitution + generation rules.
    public var rank: Int {
        switch self {
        case .beginner: return 0
        case .intermediate: return 1
        case .advanced: return 2
        }
    }
}

public enum TrainingLocation: String, Codable, CaseIterable, Identifiable, Sendable {
    case home
    case commercialGym = "commercial_gym"
    case minimal

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .home: return "Home"
        case .commercialGym: return "Commercial gym"
        case .minimal: return "Minimal"
        }
    }

    public var subtitle: String {
        switch self {
        case .home: return "Dumbbells, bench, bands at home"
        case .commercialGym: return "Full rack of machines & free weights"
        case .minimal: return "Bodyweight & travel-friendly"
        }
    }

    public var systemImage: String {
        switch self {
        case .home: return "house.fill"
        case .commercialGym: return "building.2.fill"
        case .minimal: return "figure.walk"
        }
    }
}

public enum UnitSystem: String, Codable, CaseIterable, Identifiable, Sendable {
    case metric
    case imperial

    public var id: String { rawValue }
    public var displayName: String { self == .metric ? "Metric" : "Imperial" }
}

public enum SexType: String, Codable, CaseIterable, Identifiable, Sendable {
    case male
    case female
    case other
    case preferNotToSay = "prefer_not_to_say"

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .male: return "Male"
        case .female: return "Female"
        case .other: return "Other"
        case .preferNotToSay: return "Prefer not to say"
        }
    }
}

public enum EquipmentCategory: String, Codable, CaseIterable, Identifiable, Sendable {
    case freeWeights = "free_weights"
    case machines
    case cables
    case bodyweightAccessories = "bodyweight_accessories"
    case cardio
    case benchesRacks = "benches_racks"

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .freeWeights: return "Free weights"
        case .machines: return "Machines"
        case .cables: return "Cables"
        case .bodyweightAccessories: return "Bodyweight & accessories"
        case .cardio: return "Cardio"
        case .benchesRacks: return "Benches & racks"
        }
    }

    /// Grouping order used on the equipment screen (screen 6).
    public var displayOrder: Int {
        switch self {
        case .freeWeights: return 0
        case .benchesRacks: return 1
        case .machines: return 2
        case .cables: return 3
        case .bodyweightAccessories: return 4
        case .cardio: return 5
        }
    }
}

public enum MuscleRegion: String, Codable, CaseIterable, Sendable {
    case upper
    case lower
    case core
}

public enum MovementPattern: String, Codable, CaseIterable, Identifiable, Sendable {
    case squat
    case hinge
    case lunge
    case horizontalPush = "horizontal_push"
    case verticalPush = "vertical_push"
    case horizontalPull = "horizontal_pull"
    case verticalPull = "vertical_pull"
    case elbowFlexion = "elbow_flexion"
    case elbowExtension = "elbow_extension"
    case shoulderIsolation = "shoulder_isolation"
    case coreFlexion = "core_flexion"
    case coreStability = "core_stability"
    case carry
    case hipExtensionIso = "hip_extension_iso"
    case kneeFlexionIso = "knee_flexion_iso"
    case kneeExtensionIso = "knee_extension_iso"
    case calfRaise = "calf_raise"
    case cardio

    public var id: String { rawValue }

    public var displayName: String {
        rawValue
            .replacingOccurrences(of: "_iso", with: "")
            .replacingOccurrences(of: "_", with: " ")
            .capitalized
    }
}

public enum MechanicsType: String, Codable, CaseIterable, Sendable {
    case compound
    case isolation
}

public enum DifficultyLevel: String, Codable, CaseIterable, Sendable {
    case beginner
    case intermediate
    case advanced

    public var rank: Int {
        switch self {
        case .beginner: return 0
        case .intermediate: return 1
        case .advanced: return 2
        }
    }
}

public enum MuscleRole: String, Codable, CaseIterable, Sendable {
    case primary
    case secondary
}

public enum PreferenceType: String, Codable, CaseIterable, Sendable {
    case favorite
    case excluded
}

public enum ExclusionReason: String, Codable, CaseIterable, Sendable {
    case injury
    case dislike
    case noEquipment = "no_equipment"
    case other
}

public enum RoutineSource: String, Codable, CaseIterable, Sendable {
    case generated
    case custom
}

public enum FoodCategory: String, Codable, CaseIterable, Identifiable, Sendable {
    case protein
    case grain
    case vegetable
    case fruit
    case dairy
    case fatOil = "fat_oil"
    case legume
    case nutSeed = "nut_seed"
    case beverage
    case snack
    case condiment

    public var id: String { rawValue }
    public var displayName: String { rawValue.replacingOccurrences(of: "_", with: " ").capitalized }
}

public enum DietType: String, Codable, CaseIterable, Identifiable, Sendable {
    case omnivore
    case vegetarian
    case vegan
    case pescatarian
    case keto
    case mediterranean
    case none

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .none: return "None — just track"
        default: return rawValue.capitalized
        }
    }
}

public enum MealSlot: String, Codable, CaseIterable, Identifiable, Sendable {
    case breakfast
    case lunch
    case dinner
    case snack

    public var id: String { rawValue }
    public var displayName: String { rawValue.capitalized }

    /// Default meal slot from time of day (BLUEPRINT §2.3 "Log food").
    /// <10:30 breakfast, <15:00 lunch, <21:00 dinner, else snack.
    public static func defaultForNow(_ date: Date = Date(), calendar: Calendar = .current) -> MealSlot {
        let comps = calendar.dateComponents([.hour, .minute], from: date)
        let minutes = (comps.hour ?? 0) * 60 + (comps.minute ?? 0)
        switch minutes {
        case ..<(10 * 60 + 30): return .breakfast
        case ..<(15 * 60): return .lunch
        case ..<(21 * 60): return .dinner
        default: return .snack
        }
    }
}

public enum TargetsSource: String, Codable, CaseIterable, Sendable {
    case suggested
    case custom
}

public enum PhotoPose: String, Codable, CaseIterable, Identifiable, Sendable {
    case front
    case side
    case back

    public var id: String { rawValue }
    public var displayName: String { rawValue.capitalized }
}

// MARK: - Body-area chips (screen 8a) → movement-pattern exclusion map (§7.2.2)

public enum BodyArea: String, Codable, CaseIterable, Identifiable, Sendable {
    case shoulders
    case lowerBack = "lower_back"
    case knees
    case wrists
    case hips
    case neck
    case elbows

    public var id: String { rawValue }
    public var displayName: String { rawValue.replacingOccurrences(of: "_", with: " ").capitalized }

    /// (pattern, isSoft) tuples — soft exclusions are shown pre-checked but
    /// individually un-checkable (BLUEPRINT §7.2.2).
    public var excludedPatterns: [(pattern: MovementPattern, soft: Bool)] {
        switch self {
        case .shoulders:
            return [(.verticalPush, false), (.shoulderIsolation, true)]
        case .lowerBack:
            return [(.hinge, false), (.squat, true)]
        case .knees:
            return [(.lunge, false), (.kneeExtensionIso, false), (.squat, true)]
        case .wrists:
            return [(.elbowExtension, true), (.horizontalPush, true)]
        case .elbows:
            return [(.elbowFlexion, false), (.elbowExtension, false)]
        case .hips:
            return [(.hinge, false), (.lunge, false)]
        case .neck:
            return [(.verticalPull, true)]
        }
    }
}
