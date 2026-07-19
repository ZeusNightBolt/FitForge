import SwiftUI

/// Screen 11 — Targets review (§2.2): shows computed calories + macros with an
/// explanation line ("Mifflin-St Jeor × 1.5 − 20% (fat loss)"), and a
/// "sounds right / adjust" pattern. Edits are stored as explicit overrides
/// (targets_source = custom).
struct TargetsReviewScreen: View {
    @Bindable var model: OnboardingViewModel
    @State private var editing = false

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xl) {
            if let t = model.targets {
                MacroRing(consumed: Macros(kcal: Double(t.kcal), protein: Double(t.proteinG),
                                           carbs: Double(t.carbsG), fat: Double(t.fatG)),
                          target: Macros(kcal: Double(t.kcal), protein: Double(t.proteinG),
                                         carbs: Double(t.carbsG), fat: Double(t.fatG)))
                    .frame(maxWidth: .infinity)

                InfoBanner(text: t.method, systemImage: "function")

                VStack(spacing: Spacing.m) {
                    targetRow("Calories", value: t.kcal, unit: "kcal") { newValue in
                        replace { $0.withKcal(newValue) }
                    }
                    targetRow("Protein", value: t.proteinG, unit: "g") { newValue in
                        replace { $0.withProtein(newValue) }
                    }
                    targetRow("Carbs", value: t.carbsG, unit: "g") { newValue in
                        replace { $0.withCarbs(newValue) }
                    }
                    targetRow("Fat", value: t.fatG, unit: "g") { newValue in
                        replace { $0.withFat(newValue) }
                    }
                }
                .ffCard()

                Button(editing ? "Done adjusting" : "Adjust targets") {
                    withAnimation { editing.toggle() }
                }
                .font(.ffHeadline).foregroundStyle(Palette.accent)

                if model.targetsEdited {
                    Text("Saved as your custom targets.").font(.ffFootnote).foregroundStyle(Palette.textSecondary)
                }
            } else {
                ProgressView("Calculating your targets…").frame(maxWidth: .infinity, minHeight: 200)
            }
        }
    }

    @ViewBuilder
    private func targetRow(_ label: String, value: Int, unit: String, set: @escaping (Int) -> Void) -> some View {
        HStack {
            Text(label).font(.ffBody)
            Spacer()
            if editing {
                Stepper(value: Binding(get: { value }, set: set),
                        in: 0...600, step: unit == "kcal" ? 50 : 5) {
                    Text("\(value) \(unit)").font(.ffHeadline.monospacedDigit())
                }
                .labelsHidden()
                Text("\(value) \(unit)").font(.ffHeadline.monospacedDigit()).frame(minWidth: 80, alignment: .trailing)
            } else {
                Text("\(value) \(unit)").font(.ffHeadline.monospacedDigit()).foregroundStyle(Palette.textPrimary)
            }
        }
    }

    private func replace(_ transform: (NutritionTargets) -> NutritionTargets) {
        guard let t = model.targets else { return }
        model.targets = transform(t)
        model.targetsEdited = true
    }
}

private extension NutritionTargets {
    func withKcal(_ v: Int) -> NutritionTargets { .init(kcal: v, proteinG: proteinG, carbsG: carbsG, fatG: fatG, method: method) }
    func withProtein(_ v: Int) -> NutritionTargets { .init(kcal: kcal, proteinG: v, carbsG: carbsG, fatG: fatG, method: method) }
    func withCarbs(_ v: Int) -> NutritionTargets { .init(kcal: kcal, proteinG: proteinG, carbsG: v, fatG: fatG, method: method) }
    func withFat(_ v: Int) -> NutritionTargets { .init(kcal: kcal, proteinG: proteinG, carbsG: carbsG, fatG: v, method: method) }
}

#Preview("Targets review") {
    ScrollView { TargetsReviewScreen(model: previewModel()).padding() }
        .background(Palette.background)
}
