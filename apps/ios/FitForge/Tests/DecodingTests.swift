import XCTest
@testable import FitForge

/// Repository/model decoding tests against JSON fixtures matching the §4 table
/// shapes and §5.3 RPC payload shapes. These verify the Codable mirrors decode
/// PostgREST JSON exactly (snake_case keys, enum raw values, `date` handling).
final class DecodingTests: XCTestCase {

    // MARK: Helpers

    private func fixtureData(_ name: String) throws -> Data {
        let bundle = Bundle(for: DecodingTests.self)
        guard let url = bundle.url(forResource: name, withExtension: "json", subdirectory: "Fixtures")
                ?? bundle.url(forResource: name, withExtension: "json") else {
            throw XCTSkip("Missing fixture \(name).json in test bundle")
        }
        return try Data(contentsOf: url)
    }

    private func decode<T: Decodable>(_ type: T.Type, from name: String) throws -> T {
        try JSONDecoder().decode(T.self, from: try fixtureData(name))
    }

    private func decode<T: Decodable>(_ type: T.Type, fromKey key: String, in name: String) throws -> T {
        let data = try fixtureData(name)
        let obj = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        let sub = try JSONSerialization.data(withJSONObject: obj[key]!)
        return try JSONDecoder().decode(T.self, from: sub)
    }

    // MARK: Catalog

    func testExerciseFullDecodes() throws {
        let ex = try decode(ExerciseFull.self, from: "exercise_full")
        XCTAssertEqual(ex.slug, "bench-press")
        XCTAssertEqual(ex.movementPattern, .horizontalPush)
        XCTAssertEqual(ex.mechanics, .compound)
        XCTAssertEqual(ex.difficulty, .intermediate)
        XCTAssertEqual(ex.primaryMuscleSlugs, ["pecs"])
        XCTAssertEqual(ex.secondaryMuscleSlugs, ["front-delts", "triceps"])
        XCTAssertEqual(ex.equipmentSlugs.count, 3)
        XCTAssertEqual(ex.popularity, 95)
    }

    func testFoodDecodesAndComputesMacros() throws {
        let food = try decode(Food.self, from: "food")
        XCTAssertEqual(food.slug, "chicken-breast")
        XCTAssertEqual(food.category, .protein)
        XCTAssertEqual(food.kcal, 165, accuracy: 0.01)
        XCTAssertTrue(food.dietTags.contains("keto_friendly"))
        // 120 g serving → 1.2 × per-100g
        let m = food.macros(forGrams: 120)
        XCTAssertEqual(m.kcal, 198, accuracy: 0.01)
        XCTAssertEqual(m.protein, 37.2, accuracy: 0.01)
    }

    // MARK: User plane

    func testProfileDecodesWithDateOnlyAndEnums() throws {
        let p = try decode(Profile.self, from: "profile")
        XCTAssertEqual(p.displayName, "Rachel")
        XCTAssertEqual(p.sex, .female)
        XCTAssertEqual(p.primaryGoal, .fatLoss)
        XCTAssertEqual(p.secondaryGoal, .generalHealth)
        XCTAssertEqual(p.trainingLocation, .home)
        XCTAssertEqual(p.unitSystem, .imperial)
        XCTAssertEqual(p.birthdate, DateOnly(year: 1992, month: 3, day: 14))
        XCTAssertEqual(p.preferredDays, [0, 2, 4])
        XCTAssertTrue(p.isOnboardingComplete)
    }

    func testRoutineTreeDecodesNested() throws {
        let tree = try decode(RoutineTree.self, from: "routine_tree")
        XCTAssertEqual(tree.name, "Full Body A/B/C")
        XCTAssertEqual(tree.source, .generated)
        XCTAssertEqual(tree.routineDays.count, 1)
        let day = tree.routineDays[0]
        XCTAssertEqual(day.weekday, 0)
        XCTAssertEqual(day.routineExercises.count, 2)
        XCTAssertEqual(day.routineExercises[0].exercise?.name, "Goblet Squat")
        XCTAssertEqual(day.routineExercises[1].repRangeText, "10–15")
    }

    func testNutritionLogDecodes() throws {
        let log = try decode(NutritionLog.self, from: "nutrition_log")
        XCTAssertEqual(log.mealSlot, .lunch)
        XCTAssertEqual(log.kcal, 198, accuracy: 0.01)
        XCTAssertEqual(log.macros.protein, 37.2, accuracy: 0.01)
    }

    func testBodyMetricDecodesWithNulls() throws {
        let m = try decode(BodyMetric.self, from: "body_metric")
        XCTAssertEqual(m.weightKg, 67.5)
        XCTAssertNil(m.chestCm)
        XCTAssertNil(m.neckCm)
        XCTAssertEqual(m.waistCm, 78.0)
    }

    // MARK: RPC payloads (§5.3)

    func testNutritionTargetsDecodes() throws {
        let t = try decode(NutritionTargets.self, fromKey: "nutrition_targets", in: "rpc_payloads")
        XCTAssertEqual(t.kcal, 1750)
        XCTAssertEqual(t.proteinG, 120)
        XCTAssertTrue(t.method.contains("Mifflin"))
    }

    func testOnboardingDefaultsDecodes() throws {
        let d = try decode(OnboardingDefaults.self, fromKey: "onboarding_defaults", in: "rpc_payloads")
        XCTAssertEqual(d.daysPerWeek, 3)
        XCTAssertEqual(d.splitName, "Full Body A/B/C")
    }

    func testOnboardingStatusDecodes() throws {
        let s = try decode(OnboardingStatus.self, fromKey: "onboarding_status", in: "rpc_payloads")
        XCTAssertFalse(s.complete)
        XCTAssertEqual(s.resumeStep, "nutrition_prefs")
        XCTAssertEqual(s.missing.count, 2)
    }

    func testExerciseSearchResultsDecode() throws {
        let r = try decode([ExerciseSearchResult].self, fromKey: "exercise_search", in: "rpc_payloads")
        XCTAssertEqual(r.first?.slug, "bench-press")
        XCTAssertEqual(r.first?.matchedAlias, "Bench")
    }

    func testFoodSearchResultsDecode() throws {
        let r = try decode([FoodSearchResult].self, fromKey: "food_search", in: "rpc_payloads")
        XCTAssertEqual(r.first?.slug, "chicken-breast")
        XCTAssertEqual(r.first?.servingGrams, 120)
    }

    func testSubstituteResultsDecode() throws {
        let r = try decode([SubstituteResult].self, fromKey: "substitutes", in: "rpc_payloads")
        XCTAssertEqual(r.first?.slug, "dumbbell-bench-press")
        XCTAssertEqual(r.first?.score, 92)
        XCTAssertNotNil(r.first?.reason)
    }

    func testPreviousSetsDecodeWithNullRpe() throws {
        let r = try decode([PreviousSet].self, fromKey: "previous_sets", in: "rpc_payloads")
        XCTAssertEqual(r.count, 3)
        XCTAssertEqual(r[0].rpe, 7.0)
        XCTAssertNil(r[2].rpe)
    }

    func testDailyNutritionDecodes() throws {
        let d = try decode(DailyNutrition.self, fromKey: "daily_nutrition", in: "rpc_payloads")
        XCTAssertEqual(d.kcal, 503, accuracy: 0.01)
        XCTAssertEqual(d.macros.protein, 59, accuracy: 0.01)
    }

    func testExercisePRsDecode() throws {
        let r = try decode([ExercisePR].self, fromKey: "exercise_prs", in: "rpc_payloads")
        XCTAssertEqual(r.first?.exerciseName, "Barbell Bench Press")
        XCTAssertEqual(r.first?.bestE1rm, 92.5)
    }

    // MARK: Round-trip encode (PATCH / insert bodies)

    func testProfilePatchEncodesOnlyPresentFields() throws {
        var patch = ProfilePatch()
        patch.primaryGoal = .hypertrophy
        patch.onboardingStep = "experience"
        let data = try JSONEncoder().encode(patch)
        let obj = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        XCTAssertEqual(obj["primary_goal"] as? String, "hypertrophy")
        XCTAssertEqual(obj["onboarding_step"] as? String, "experience")
        XCTAssertNil(obj["display_name"]) // absent, not null
        XCTAssertNil(obj["days_per_week"])
    }

    func testDateOnlyRoundTrips() throws {
        let d = DateOnly(year: 2026, month: 7, day: 19)
        let data = try JSONEncoder().encode(d)
        XCTAssertEqual(String(data: data, encoding: .utf8), "\"2026-07-19\"")
        let back = try JSONDecoder().decode(DateOnly.self, from: data)
        XCTAssertEqual(back, d)
    }
}
