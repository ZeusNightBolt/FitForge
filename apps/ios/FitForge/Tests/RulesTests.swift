import XCTest
@testable import FitForge

/// Tests for the small client-side rule helpers that mirror the blueprint spec
/// (the authoritative rules live in SQL — these only cover the thin UI-side
/// helpers this app owns: meal-slot defaulting, plate math, evenly-spaced days,
/// the body-area exclusion map, and Epley e1RM).
final class RulesTests: XCTestCase {

    func testMealSlotDefaultByTimeOfDay() {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        func at(_ h: Int, _ m: Int) -> Date {
            cal.date(from: DateComponents(year: 2026, month: 7, day: 19, hour: h, minute: m))!
        }
        XCTAssertEqual(MealSlot.defaultForNow(at(8, 0), calendar: cal), .breakfast)
        XCTAssertEqual(MealSlot.defaultForNow(at(10, 29), calendar: cal), .breakfast)
        XCTAssertEqual(MealSlot.defaultForNow(at(10, 30), calendar: cal), .lunch)
        XCTAssertEqual(MealSlot.defaultForNow(at(14, 59), calendar: cal), .lunch)
        XCTAssertEqual(MealSlot.defaultForNow(at(15, 0), calendar: cal), .dinner)
        XCTAssertEqual(MealSlot.defaultForNow(at(20, 59), calendar: cal), .dinner)
        XCTAssertEqual(MealSlot.defaultForNow(at(21, 0), calendar: cal), .snack)
        XCTAssertEqual(MealSlot.defaultForNow(at(23, 30), calendar: cal), .snack)
    }

    func testEvenlySpacedDays() {
        // 3 days → Mon/Wed/Fri (0/2/4)
        XCTAssertEqual(OnboardingViewModel.evenlySpacedDays(count: 3), [0, 2, 4])
        XCTAssertEqual(OnboardingViewModel.evenlySpacedDays(count: 1).count, 1)
        XCTAssertEqual(OnboardingViewModel.evenlySpacedDays(count: 7), Set(0...6))
        XCTAssertEqual(OnboardingViewModel.evenlySpacedDays(count: 0), [])
    }

    func testPlateMath() {
        // 60 kg on a 20 kg bar → 20 kg per side → one 20
        XCTAssertEqual(PlateMath.perSide(target: 60), [20])
        // 100 kg → 40 per side → 25 + 15
        XCTAssertEqual(PlateMath.perSide(target: 100), [25, 15])
        // Bar-only or under-bar → empty
        XCTAssertEqual(PlateMath.perSide(target: 20), [])
        XCTAssertEqual(PlateMath.perSide(target: 15), [])
        // 62.5 → 21.25 per side → 20 + 1.25
        XCTAssertEqual(PlateMath.perSide(target: 62.5), [20, 1.25])
    }

    func testBodyAreaExclusionMap() {
        // shoulders → vertical_push (hard) + shoulder_isolation (soft)
        let shoulders = BodyArea.shoulders.excludedPatterns
        XCTAssertTrue(shoulders.contains { $0.pattern == .verticalPush && !$0.soft })
        XCTAssertTrue(shoulders.contains { $0.pattern == .shoulderIsolation && $0.soft })
        // knees → lunge, knee_extension_iso (hard), squat (soft)
        let knees = BodyArea.knees.excludedPatterns
        XCTAssertTrue(knees.contains { $0.pattern == .lunge && !$0.soft })
        XCTAssertTrue(knees.contains { $0.pattern == .kneeExtensionIso && !$0.soft })
        XCTAssertTrue(knees.contains { $0.pattern == .squat && $0.soft })
        // elbows → both elbow patterns, hard
        XCTAssertEqual(Set(BodyArea.elbows.excludedPatterns.map(\.pattern)), [.elbowFlexion, .elbowExtension])
        XCTAssertTrue(BodyArea.elbows.excludedPatterns.allSatisfy { !$0.soft })
    }

    func testEpleyE1RM() {
        // 100 kg × 5 → 100 × (1 + 5/30) = 116.67
        let set = SetLog(id: UUID(), sessionId: UUID(), exerciseId: UUID(),
                         exerciseNameSnapshot: "Squat", setNumber: 1, reps: 5, weightKg: 100)
        XCTAssertEqual(set.e1rm, 116.666, accuracy: 0.01)
    }

    @MainActor func testEffectiveExclusionsDropsKeptSoftPatterns() {
        let vm = OnboardingViewModel(env: .preview())
        vm.bodyAreas = [.shoulders]
        // By default both patterns are excluded (soft shown pre-checked).
        XCTAssertEqual(Set(vm.effectiveExclusions.map(\.movementPattern)), [.verticalPush, .shoulderIsolation])
        // Keeping the soft one drops it.
        vm.keptSoftPatterns = [.shoulderIsolation]
        XCTAssertEqual(vm.effectiveExclusions.map(\.movementPattern), [.verticalPush])
    }

    @MainActor func testEquipmentPresetHomeVsGym() {
        let vm = OnboardingViewModel(env: .preview())
        vm.allEquipment = Sample.equipment
        vm.trainingLocation = .home
        vm.applyEquipmentPreset()
        XCTAssertTrue(vm.equipmentSlugs.contains("dumbbell"))
        XCTAssertFalse(vm.equipmentSlugs.contains("squat-rack")) // gym-only
        vm.trainingLocation = .commercialGym
        vm.applyEquipmentPreset()
        XCTAssertTrue(vm.equipmentSlugs.contains("squat-rack"))
        vm.trainingLocation = .minimal
        vm.applyEquipmentPreset()
        XCTAssertTrue(vm.equipmentSlugs.isEmpty)
        // Minimal nudges bands + pull-up bar as suggestions.
        XCTAssertTrue(vm.equipmentSuggestions.contains("resistance-bands"))
    }

    @MainActor func testEquipmentDependencyNudges() {
        let vm = OnboardingViewModel(env: .preview())
        vm.allEquipment = Sample.equipment
        vm.trainingLocation = .home
        vm.equipmentSlugs = ["squat-rack"]
        // squat-rack ⇒ suggest barbell + weight-plates (§7.2.1)
        XCTAssertTrue(vm.equipmentSuggestions.contains("barbell"))
        XCTAssertTrue(vm.equipmentSuggestions.contains("weight-plates"))
    }
}
