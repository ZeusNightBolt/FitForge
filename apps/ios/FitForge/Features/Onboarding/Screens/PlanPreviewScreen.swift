import SwiftUI

/// Screen 12 — Plan preview (§2.2): the generated routine as expandable day
/// cards; every exercise row has a "swap" icon opening the substitute list.
/// "Start plan" (the flow's CTA) activates the routine and completes onboarding.
struct PlanPreviewScreen: View {
    @Bindable var model: OnboardingViewModel
    @State private var swapTarget: RoutineExerciseTree?

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.l) {
            if let routine = model.generatedRoutine {
                Text(routine.name).font(.ffTitle3)
                if let description = routine.description {
                    Text(description).font(.ffSubheadline).foregroundStyle(Palette.textSecondary)
                }
                ForEach(routine.routineDays.sorted { $0.dayIndex < $1.dayIndex }) { day in
                    RoutineDayCard(day: day) { exercise in swapTarget = exercise }
                }
                InfoBanner(text: "Tap the swap icon on any exercise to see alternatives.",
                           systemImage: "arrow.triangle.2.circlepath")
            } else {
                ProgressView("Building your plan…").frame(maxWidth: .infinity, minHeight: 200)
            }
        }
        .sheet(item: $swapTarget) { exercise in
            SubstitutePickerSheet(exerciseId: exercise.exerciseId, currentName: exercise.exercise?.name ?? "Exercise") { _ in
                swapTarget = nil
                // In the app the swap re-writes routine_exercises; preview no-ops.
            }
        }
    }
}

/// Expandable day card showing prescriptions with a per-row swap affordance.
struct RoutineDayCard: View {
    let day: RoutineDayTree
    var onSwap: ((RoutineExerciseTree) -> Void)?
    @State private var expanded = true

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            Button { withAnimation { expanded.toggle() } } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(day.name).font(.ffHeadline).foregroundStyle(Palette.textPrimary)
                        Text("\(day.routineExercises.count) exercises").font(.ffCaption).foregroundStyle(Palette.textSecondary)
                    }
                    Spacer()
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .foregroundStyle(Palette.textSecondary)
                }
            }.buttonStyle(.plain)

            if expanded {
                ForEach(day.routineExercises.sorted { $0.position < $1.position }) { ex in
                    HStack {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(ex.exercise?.name ?? "Exercise").font(.ffSubheadline).foregroundStyle(Palette.textPrimary)
                            Text("\(ex.sets) × \(ex.repRangeText) · \(ex.restSeconds)s rest")
                                .font(.ffCaption).foregroundStyle(Palette.textSecondary)
                        }
                        Spacer()
                        if let onSwap {
                            Button { onSwap(ex) } label: {
                                Image(systemName: "arrow.triangle.2.circlepath").foregroundStyle(Palette.accent)
                            }.buttonStyle(.plain)
                        }
                    }
                    .padding(.vertical, Spacing.xs)
                    if ex.id != day.routineExercises.last?.id { Divider() }
                }
            }
        }
        .ffCard()
    }
}

#Preview("Plan preview") {
    let m = previewModel()
    m.generatedRoutine = Sample.routineTree
    return ScrollView { PlanPreviewScreen(model: m).padding() }
        .background(Palette.background)
        .environment(\.appEnvironment, .preview())
}
