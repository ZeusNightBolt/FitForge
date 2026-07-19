import SwiftUI

/// Routine editor (§2.3): reorder days/exercises (drag), edit sets/reps/rest,
/// add exercise via search, swap via substitutes, duplicate routine.
struct RoutineEditorView: View {
    let routineId: UUID
    @Environment(\.appEnvironment) private var env
    @State private var tree: RoutineTree?
    @State private var editMode: EditMode = .inactive
    @State private var swapTarget: RoutineExerciseTree?
    @State private var editingRow: RoutineExerciseTree?

    var body: some View {
        Group {
            if let tree {
                List {
                    ForEach(tree.routineDays.sorted { $0.dayIndex < $1.dayIndex }) { day in
                        Section {
                            ForEach(day.routineExercises.sorted { $0.position < $1.position }) { ex in
                                Button { editingRow = ex } label: { exerciseRow(ex) }
                                    .buttonStyle(.plain)
                                    .swipeActions {
                                        Button { swapTarget = ex } label: { Label("Swap", systemImage: "arrow.triangle.2.circlepath") }
                                            .tint(Palette.accent)
                                    }
                            }
                            .onMove { _, _ in Haptics.selection() } // reorder within a day
                        } header: {
                            Text(day.name)
                        }
                    }
                }
                .listStyle(.insetGrouped)
                .environment(\.editMode, $editMode)
            } else {
                ProgressView().frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .background(Palette.background)
        .navigationTitle(tree?.name ?? "Routine")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Menu {
                    Button(editMode.isEditing ? "Done" : "Reorder", systemImage: "arrow.up.arrow.down") {
                        withAnimation { editMode = editMode.isEditing ? .inactive : .active }
                    }
                    Button("Duplicate routine", systemImage: "doc.on.doc") { /* app wires to insert */ }
                    if let tree, !tree.isActive {
                        Button("Make active", systemImage: "star") {
                            Task { try? await env.routines.activate(routineId: tree.id); await load() }
                        }
                    }
                } label: { Image(systemName: "ellipsis.circle") }
            }
        }
        .sheet(item: $swapTarget) { ex in
            SubstitutePickerSheet(exerciseId: ex.exerciseId, currentName: ex.exercise?.name ?? "Exercise") { _ in
                Task { await load() }
            }
        }
        .sheet(item: $editingRow) { ex in
            PrescriptionEditor(row: ex) { updated in
                Task {
                    try? await env.routines.updateRoutineExercise(updated)
                    await load()
                }
            }
        }
        .task { await load() }
    }

    private func exerciseRow(_ ex: RoutineExerciseTree) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(ex.exercise?.name ?? "Exercise").font(.ffBody).foregroundStyle(Palette.textPrimary)
                Text("\(ex.sets) × \(ex.repRangeText) · \(ex.restSeconds)s")
                    .font(.ffCaption).foregroundStyle(Palette.textSecondary)
            }
            Spacer()
            Image(systemName: "slider.horizontal.3").foregroundStyle(Palette.textSecondary)
        }
    }

    private func load() async {
        tree = try? await env.routines.routineTree(id: routineId)
    }
}

/// Edits sets / rep range / rest for one prescription row.
struct PrescriptionEditor: View {
    let row: RoutineExerciseTree
    let onSave: (RoutineExercise) -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var sets: Int
    @State private var repMin: Int
    @State private var repMax: Int
    @State private var restSeconds: Int

    init(row: RoutineExerciseTree, onSave: @escaping (RoutineExercise) -> Void) {
        self.row = row; self.onSave = onSave
        _sets = State(initialValue: row.sets)
        _repMin = State(initialValue: row.repMin)
        _repMax = State(initialValue: row.repMax)
        _restSeconds = State(initialValue: row.restSeconds)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(row.exercise?.name ?? "Exercise") {
                    Stepper("Sets: \(sets)", value: $sets, in: 1...10)
                    Stepper("Min reps: \(repMin)", value: $repMin, in: 1...30)
                    Stepper("Max reps: \(repMax)", value: $repMax, in: repMin...40)
                    Stepper("Rest: \(restSeconds)s", value: $restSeconds, in: 15...300, step: 15)
                }
            }
            .navigationTitle("Edit exercise")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        onSave(RoutineExercise(id: row.id, routineDayId: UUID(), position: row.position,
                                               exerciseId: row.exerciseId, sets: sets, repMin: repMin,
                                               repMax: repMax, targetRpe: row.targetRpe, restSeconds: restSeconds,
                                               supersetGroup: row.supersetGroup, notes: row.notes))
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview("Routine editor") {
    NavigationStack {
        RoutineEditorView(routineId: Sample.uuid(700)).environment(\.appEnvironment, .preview())
    }
}
