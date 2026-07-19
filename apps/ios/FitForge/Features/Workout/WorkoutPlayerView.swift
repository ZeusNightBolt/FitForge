import SwiftUI

/// Workout player (§2.3): one exercise per screen, set list with ghosted
/// previous-session defaults, plate-math helper, auto-starting rest timer, swap
/// button, finish → session summary.
struct WorkoutPlayerView: View {
    let day: RoutineDayTree
    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss
    @State private var model: WorkoutPlayerModel?
    @State private var showSwap = false
    @State private var showFinish = false

    var body: some View {
        NavigationStack {
            Group {
                if let model {
                    content(model)
                } else {
                    ProgressView("Loading…").frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .background(Palette.background.ignoresSafeArea())
            .navigationTitle(day.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Close") { dismiss() } }
                ToolbarItem(placement: .primaryAction) { Button("Finish") { showFinish = true } }
            }
        }
        .task {
            if model == nil {
                let m = WorkoutPlayerModel(day: day, env: env)
                await m.startSession()
                model = m
            }
        }
        .sheet(isPresented: $showSwap) {
            if let ex = model?.current {
                SubstitutePickerSheet(exerciseId: ex.exerciseId, currentName: ex.exercise?.name ?? "Exercise") { sub in
                    model?.applySwap(sub)
                }
            }
        }
        .sheet(isPresented: $showFinish) {
            if let model { FinishSheet(model: model) { dismiss() } }
        }
    }

    @ViewBuilder
    private func content(_ model: WorkoutPlayerModel) -> some View {
        VStack(spacing: 0) {
            // Progress dots across exercises
            HStack(spacing: Spacing.xs) {
                ForEach(model.exercises.indices, id: \.self) { i in
                    Capsule()
                        .fill(i == model.currentIndex ? Palette.accent : Palette.separator)
                        .frame(height: 4)
                }
            }
            .padding(.horizontal, Spacing.screenH)
            .padding(.top, Spacing.s)

            ScrollView {
                if let ex = model.current {
                    ExercisePlayerCard(model: model, exercise: ex, onSwap: { showSwap = true })
                        .ffScreenPadding()
                        .padding(.top, Spacing.l)
                }
            }

            if model.restTimer.isRunning {
                RestTimerBar(timer: model.restTimer)
            }

            HStack(spacing: Spacing.m) {
                SecondaryButton("Previous") { model.previous() }
                    .disabled(model.currentIndex == 0)
                    .opacity(model.currentIndex == 0 ? 0.5 : 1)
                if model.isLastExercise {
                    PrimaryButton("Finish", systemImage: "checkmark") { showFinish = true }
                } else {
                    PrimaryButton("Next", systemImage: "chevron.right") { model.next() }
                }
            }
            .padding(.horizontal, Spacing.screenH)
            .padding(.vertical, Spacing.m)
            .background(.ultraThinMaterial)
        }
    }
}

/// The card for one exercise: set rows + plate math + swap.
struct ExercisePlayerCard: View {
    @Bindable var model: WorkoutPlayerModel
    let exercise: RoutineExerciseTree
    let onSwap: () -> Void

    private var sets: [SetEntry] { model.binding(for: exercise) }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.m) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(exercise.exercise?.name ?? "Exercise").font(.ffTitle3)
                    Text("\(exercise.sets) × \(exercise.repRangeText)" + (exercise.targetRpe.map { " · RPE \(String(format: "%.0f", $0))" } ?? ""))
                        .font(.ffSubheadline).foregroundStyle(Palette.textSecondary)
                }
                Spacer()
                Button(action: onSwap) {
                    Image(systemName: "arrow.triangle.2.circlepath").font(.title3).foregroundStyle(Palette.accent)
                }.buttonStyle(.plain)
            }

            ForEach(sets) { entry in
                SetRow(model: model, exercise: exercise, entry: entry)
                if entry.id != sets.last?.id { Divider() }
            }
        }
        .ffCard()
    }
}

/// A single logged set row with ghost defaults and a tap-to-log check.
struct SetRow: View {
    @Bindable var model: WorkoutPlayerModel
    let exercise: RoutineExerciseTree
    let entry: SetEntry

    var body: some View {
        HStack(spacing: Spacing.m) {
            Text("\(entry.setNumber)").font(.ffHeadline.monospacedDigit())
                .frame(width: 24)
                .foregroundStyle(Palette.textSecondary)

            // Weight & reps steppers with ghosted previous values.
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: Spacing.s) {
                    fieldStepper(value: bindWeight, unit: "kg", step: 2.5, format: "%.1f")
                    Text("×").foregroundStyle(Palette.textSecondary)
                    fieldStepper(value: bindReps, unit: "reps", step: 1, format: "%.0f")
                }
                if let gr = entry.ghostReps, let gw = entry.ghostWeight {
                    Text("Last: \(Int(gw)) kg × \(gr)").font(.ffCaption).foregroundStyle(Palette.textSecondary)
                }
                if PlateMath.perSide(target: entry.weightKg).isEmpty == false {
                    Text("Per side: " + PlateMath.perSide(target: entry.weightKg).map { plateLabel($0) }.joined(separator: ", "))
                        .font(.ffCaption).foregroundStyle(Palette.textSecondary)
                }
            }
            Spacer()
            Button {
                Task { await model.logSet(exercise: exercise, setId: entry.id) }
            } label: {
                Image(systemName: entry.isLogged ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(entry.isLogged ? Palette.success : Palette.separator)
            }.buttonStyle(.plain)
        }
        .padding(.vertical, Spacing.xs)
    }

    private func plateLabel(_ v: Double) -> String { v == v.rounded() ? "\(Int(v))" : String(format: "%.2f", v) }

    private var bindWeight: Binding<Double> {
        Binding(
            get: { entry.weightKg },
            set: { newValue in mutate { $0.weightKg = max(0, newValue) } })
    }
    private var bindReps: Binding<Double> {
        Binding(
            get: { Double(entry.reps) },
            set: { newValue in mutate { $0.reps = max(0, Int(newValue)) } })
    }

    private func mutate(_ change: (inout SetEntry) -> Void) {
        guard var entries = model.setsByExercise[exercise.id],
              let idx = entries.firstIndex(where: { $0.id == entry.id }) else { return }
        change(&entries[idx])
        model.setsByExercise[exercise.id] = entries
    }

    private func fieldStepper(value: Binding<Double>, unit: String, step: Double, format: String) -> some View {
        HStack(spacing: 4) {
            Button { value.wrappedValue -= step; Haptics.selection() } label: {
                Image(systemName: "minus").font(.ffCaption)
            }.buttonStyle(.plain)
            Text(String(format: format, value.wrappedValue) + " \(unit)")
                .font(.ffSubheadline.monospacedDigit()).frame(minWidth: 64)
            Button { value.wrappedValue += step; Haptics.selection() } label: {
                Image(systemName: "plus").font(.ffCaption)
            }.buttonStyle(.plain)
        }
        .padding(.horizontal, Spacing.s)
        .padding(.vertical, 4)
        .background(Palette.surfaceElevated, in: Capsule())
    }
}

/// The rest-timer bar shown while resting.
struct RestTimerBar: View {
    @Bindable var timer: RestTimer
    var body: some View {
        HStack(spacing: Spacing.m) {
            Image(systemName: "timer").foregroundStyle(Palette.accent)
            Text(timeString(timer.remaining)).font(.ffHeadline.monospacedDigit())
            ProgressView(value: timer.progress).tint(Palette.accent)
            Button("+30s") { timer.addTime(30) }.font(.ffFootnote).foregroundStyle(Palette.accent)
            Button("Skip") { timer.skip() }.font(.ffFootnote).foregroundStyle(Palette.textSecondary)
        }
        .padding(.horizontal, Spacing.screenH)
        .padding(.vertical, Spacing.s)
        .background(Palette.accentSoft)
    }
    private func timeString(_ s: Int) -> String { String(format: "%d:%02d", s / 60, s % 60) }
}

/// Finish sheet: perceived effort + summary, then writes completion.
struct FinishSheet: View {
    @Bindable var model: WorkoutPlayerModel
    let onDone: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var effort = 7.0

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: Spacing.xl) {
                Text("\(model.completedSetCount) sets logged across \(model.exercises.count) exercises.")
                    .font(.ffBody).foregroundStyle(Palette.textSecondary)
                VStack(alignment: .leading, spacing: Spacing.s) {
                    Text("How hard was that? (RPE \(Int(effort)))").ffSectionHeader()
                    Slider(value: $effort, in: 1...10, step: 1).tint(Palette.accent)
                }
                Spacer()
                PrimaryButton("Save workout", isLoading: model.isFinishing) {
                    Task { await model.finish(perceivedEffort: Int(effort)); dismiss(); onDone() }
                }
            }
            .padding()
            .navigationTitle("Finish workout")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview("Workout player") {
    WorkoutPlayerView(day: Sample.routineTree.routineDays[0])
        .environment(\.appEnvironment, .preview())
}
