import SwiftUI

/// Food logging flow (§2.3): debounced `search_foods` type-ahead → tap result →
/// serving picker (default serving, quick chips ×0.5/×1/×2) → `log_food`.
struct FoodLoggerView: View {
    let day: DateOnly
    let defaultSlot: MealSlot
    let onLogged: () async -> Void

    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss

    @State private var query = ""
    @State private var results: [FoodSearchResult] = []
    @State private var slot: MealSlot
    @State private var picked: FoodSearchResult?
    @State private var isSearching = false
    private let debouncer = Debouncer()

    init(day: DateOnly, defaultSlot: MealSlot, onLogged: @escaping () async -> Void) {
        self.day = day; self.defaultSlot = defaultSlot; self.onLogged = onLogged
        _slot = State(initialValue: defaultSlot)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: Spacing.m) {
                Picker("Meal", selection: $slot) {
                    ForEach(MealSlot.allCases) { Text($0.displayName).tag($0) }
                }.pickerStyle(.segmented)

                SearchField("Search foods", text: $query)
                    .onChange(of: query) { _, v in search(v) }

                if isSearching { ProgressView().frame(maxWidth: .infinity) }

                List(results) { r in
                    Button { picked = r } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 1) {
                                Text(r.name).font(.ffBody).foregroundStyle(Palette.textPrimary)
                                Text("\(Int(r.kcal)) kcal · \(Int(r.proteinG))g protein / 100g")
                                    .font(.ffCaption).foregroundStyle(Palette.textSecondary)
                            }
                            Spacer()
                            Image(systemName: "plus.circle").foregroundStyle(Palette.accent)
                        }
                    }
                }
                .listStyle(.plain)
                Spacer()
            }
            .padding()
            .background(Palette.background)
            .navigationTitle("Log food")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } } }
        }
        .sheet(item: $picked) { food in
            ServingPickerSheet(food: food, slot: slot, day: day) {
                await onLogged()
                dismiss()
            }
        }
    }

    private func search(_ text: String) {
        guard text.isSearchable else { results = []; isSearching = false; return }
        isSearching = true
        Task {
            await debouncer.run(delayMs: 150) {
                let found = (try? await env.nutrition.searchFoods(.init(q: text, pLimit: 10, applyDietFilter: true))) ?? []
                await MainActor.run { results = found; isSearching = false }
            }
        }
    }
}

/// Serving picker: default serving, quick multiplier chips, gram override.
struct ServingPickerSheet: View {
    let food: FoodSearchResult
    let slot: MealSlot
    let day: DateOnly
    let onDone: () async -> Void

    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss
    @State private var multiplier: Double = 1
    @State private var grams: Double
    @State private var isLogging = false

    init(food: FoodSearchResult, slot: MealSlot, day: DateOnly, onDone: @escaping () async -> Void) {
        self.food = food; self.slot = slot; self.day = day; self.onDone = onDone
        _grams = State(initialValue: food.servingGrams)
    }

    private var kcal: Int { Int((food.kcal * grams / 100).rounded()) }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(food.name).font(.ffTitle3)
                    Text(food.servingName).font(.ffSubheadline).foregroundStyle(Palette.textSecondary)
                }

                HStack(spacing: Spacing.s) {
                    ForEach([0.5, 1.0, 2.0], id: \.self) { m in
                        CapsuleChip("×\(m == 0.5 ? "0.5" : String(Int(m)))", isOn: multiplier == m) {
                            multiplier = m; grams = food.servingGrams * m
                        }
                    }
                }

                VStack(alignment: .leading, spacing: Spacing.s) {
                    Text("Amount: \(Int(grams)) g").ffSectionHeader()
                    Slider(value: $grams, in: 5...max(food.servingGrams * 4, 400), step: 5).tint(Palette.accent)
                }

                HStack {
                    Text("\(kcal)").font(.ffMonoLarge).foregroundStyle(Palette.accent)
                    Text("kcal").font(.ffHeadline).foregroundStyle(Palette.textSecondary)
                    Spacer()
                }

                Spacer()
                PrimaryButton("Log to \(slot.displayName)", isLoading: isLogging) {
                    Task { await log() }
                }
            }
            .padding()
            .navigationTitle("Serving")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Back") { dismiss() } } }
        }
    }

    private func log() async {
        isLogging = true
        defer { isLogging = false }
        // Macro snapshots computed server-side by log_food (§5.3 single source of rounding).
        _ = try? await env.nutrition.logFood(.init(pFoodId: food.foodId, pQuantityG: grams,
                                                    pMealSlot: slot, pLoggedOn: day))
        Haptics.notify(.success)
        await onDone()
        dismiss()
    }
}

#Preview("Food logger") {
    FoodLoggerView(day: .today(), defaultSlot: .lunch) {}
        .environment(\.appEnvironment, .preview())
}
#Preview("Serving picker") {
    ServingPickerSheet(food: Sample.foodSearchResults[0], slot: .lunch, day: .today()) {}
        .environment(\.appEnvironment, .preview())
}
