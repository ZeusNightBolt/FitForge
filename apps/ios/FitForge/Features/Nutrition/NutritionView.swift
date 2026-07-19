import SwiftUI

/// Nutrition tab (§2.3 "Log food"): day view grouped by meal slot, a macro ring,
/// and a search → serving-picker → log flow. Meal slot defaults from time of day.
struct NutritionView: View {
    @Environment(\.appEnvironment) private var env
    @State private var day: DateOnly = .today()
    @State private var logs: [NutritionLog] = []
    @State private var totals: DailyNutrition?
    @State private var targets: NutritionProfile?
    @State private var showLogger = false
    @State private var defaultSlot: MealSlot = .breakfast

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.l) {
                    MacroRing(consumed: totals?.macros ?? Macros(), target: targetMacros, size: 150)
                        .padding(.top, Spacing.s)

                    ForEach(MealSlot.allCases) { slot in
                        MealSlotSection(slot: slot, logs: logs.filter { $0.mealSlot == slot }) {
                            defaultSlot = slot; showLogger = true
                        } onDelete: { id in
                            Task { try? await env.nutrition.deleteLog(id: id); await load() }
                        }
                    }
                }
                .ffScreenPadding()
                .padding(.vertical, Spacing.l)
            }
            .background(Palette.background)
            .navigationTitle("Nutrition")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { defaultSlot = MealSlot.defaultForNow(); showLogger = true } label: {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $showLogger) {
            FoodLoggerView(day: day, defaultSlot: defaultSlot) { await load() }
        }
        .task { await load() }
    }

    private var targetMacros: Macros {
        Macros(kcal: Double(targets?.kcalTarget ?? 2000), protein: Double(targets?.proteinGTarget ?? 140),
               carbs: Double(targets?.carbsGTarget ?? 200), fat: Double(targets?.fatGTarget ?? 60))
    }

    private func load() async {
        logs = (try? await env.nutrition.logs(on: day)) ?? []
        totals = try? await env.nutrition.dailyTotals(on: day)
        targets = try? await env.nutrition.nutritionProfile()
    }
}

struct MealSlotSection: View {
    let slot: MealSlot
    let logs: [NutritionLog]
    let onAdd: () -> Void
    let onDelete: (UUID) -> Void

    private var kcal: Int { Int(logs.reduce(0) { $0 + $1.kcal }.rounded()) }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            HStack {
                Text(slot.displayName).ffSectionHeader()
                Spacer()
                Text("\(kcal) kcal").font(.ffCaption).foregroundStyle(Palette.textSecondary)
                Button(action: onAdd) { Image(systemName: "plus.circle.fill").foregroundStyle(Palette.accent) }
                    .buttonStyle(.plain)
            }
            if logs.isEmpty {
                Text("Nothing logged").font(.ffFootnote).foregroundStyle(Palette.textSecondary)
            } else {
                ForEach(logs) { log in
                    HStack {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(log.displayName).font(.ffSubheadline).foregroundStyle(Palette.textPrimary)
                            Text(macroLine(log)).font(.ffCaption).foregroundStyle(Palette.textSecondary)
                        }
                        Spacer()
                        Text("\(Int(log.kcal.rounded()))").font(.ffSubheadline.monospacedDigit())
                        Button { onDelete(log.id) } label: { Image(systemName: "trash").font(.ffCaption) }
                            .buttonStyle(.plain).foregroundStyle(Palette.textSecondary)
                    }
                    .padding(.vertical, 2)
                }
            }
        }
        .ffCard()
    }

    private func macroLine(_ log: NutritionLog) -> String {
        "P \(Int(log.proteinG)) · C \(Int(log.carbsG)) · F \(Int(log.fatG))"
    }
}

#Preview("Nutrition") {
    NutritionView().environment(\.appEnvironment, .preview())
}
