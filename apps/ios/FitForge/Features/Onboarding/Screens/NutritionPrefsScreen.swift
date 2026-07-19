import SwiftUI

/// Screen 10 — Nutrition preferences (§2.2): diet-type cards, allergy chips,
/// a "foods to avoid" type-ahead (pre-filtered by diet compatibility), and a
/// meals/day stepper. Diet type auto-applies food-tag exclusion filters (§7.2.3).
struct NutritionPrefsScreen: View {
    @Bindable var model: OnboardingViewModel
    @Environment(\.appEnvironment) private var env

    @State private var query = ""
    @State private var results: [FoodSearchResult] = []
    private let debouncer = Debouncer()

    /// Allergen tag slugs (§4.3 / §6.6).
    private let allergenChips = ["peanut", "tree_nut", "dairy", "gluten", "egg", "soy", "shellfish", "fish", "sesame"]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xl) {
            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Diet type").ffSectionHeader()
                ForEach(DietType.allCases) { diet in
                    SelectableCard(title: diet.displayName, isSelected: model.dietType == diet) {
                        model.dietType = diet
                    }
                }
            }

            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Allergies").ffSectionHeader()
                FlowChips(allergenChips) { tag in
                    CapsuleChip(label(tag), isOn: model.allergies.contains(tag)) {
                        if model.allergies.contains(tag) { model.allergies.remove(tag) }
                        else { model.allergies.insert(tag) }
                    }
                }
            }

            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Foods to avoid").ffSectionHeader()
                SearchField("Search foods", text: $query)
                    .onChange(of: query) { _, v in search(v) }
                ForEach(results) { r in
                    SearchResultRow(title: r.name, subtitle: r.brand, isAdded: isAvoided(r.foodId)) { toggle(r) }
                }
                if !model.avoidFoods.isEmpty {
                    FlowChips(model.avoidFoods) { f in
                        CapsuleChip(f.name, systemImage: "xmark", isOn: true) {
                            model.avoidFoods.removeAll { $0.foodId == f.foodId }
                        }
                    }
                }
            }

            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Meals per day").ffSectionHeader()
                CountStepper(title: "Meals", value: $model.mealsPerDay, range: 1...6).ffCard()
            }
        }
    }

    private func label(_ tag: String) -> String { tag.replacingOccurrences(of: "_", with: " ").capitalized }
    private func isAvoided(_ id: UUID) -> Bool { model.avoidFoods.contains { $0.foodId == id } }

    private func toggle(_ r: FoodSearchResult) {
        Haptics.selection()
        if isAvoided(r.foodId) { model.avoidFoods.removeAll { $0.foodId == r.foodId } }
        else { model.avoidFoods.append(r); query = ""; results = [] }
    }

    private func search(_ text: String) {
        guard text.isSearchable else { results = []; return }
        Task {
            await debouncer.run(delayMs: 150) {
                // Diet filter applied server-side (§7.1/§7.2.3).
                let found = (try? await env.nutrition.searchFoods(.init(q: text, pLimit: 8, applyDietFilter: true))) ?? []
                await MainActor.run { results = found }
            }
        }
    }
}

#Preview("Nutrition prefs") {
    ScrollView { NutritionPrefsScreen(model: previewModel()).padding() }
        .background(Palette.background)
        .environment(\.appEnvironment, .preview())
}
