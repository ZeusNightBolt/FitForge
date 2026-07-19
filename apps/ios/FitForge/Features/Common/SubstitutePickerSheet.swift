import SwiftUI

/// A reusable sheet that lists substitute exercises for a target, powered by the
/// `suggest_substitutes` RPC (BLUEPRINT §7.4). Used by the onboarding plan
/// preview, the workout player swap button, and the routine editor — all the
/// same RPC contract.
struct SubstitutePickerSheet: View {
    let exerciseId: UUID
    let currentName: String
    let onPick: (SubstituteResult) -> Void

    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss
    @State private var state: LoadState<[SubstituteResult]> = .idle

    var body: some View {
        NavigationStack {
            LoadableContent(state, retry: { Task { await load() } }) { subs in
                if subs.isEmpty {
                    ContentUnavailableView("No substitutes", systemImage: "arrow.triangle.2.circlepath",
                                           description: Text("We couldn't find a feasible swap with your equipment."))
                } else {
                    List(subs) { sub in
                        Button {
                            Haptics.selection()
                            onPick(sub)
                            dismiss()
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                HStack {
                                    Text(sub.name).font(.ffHeadline).foregroundStyle(Palette.textPrimary)
                                    Spacer()
                                    Text("\(Int(sub.score))").font(.ffCaption.monospacedDigit())
                                        .foregroundStyle(Palette.textSecondary)
                                }
                                if let reason = sub.reason {
                                    Text(reason).font(.ffFootnote).foregroundStyle(Palette.textSecondary)
                                }
                            }
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Swap \(currentName)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
            }
        }
        .task { await load() }
    }

    private func load() async {
        state = .loading
        do {
            let subs = try await env.catalog.suggestSubstitutes(.init(pExerciseId: exerciseId, pLimit: 5))
            state = .loaded(subs)
        } catch {
            state = .failed((error as? LocalizedError)?.errorDescription ?? "Couldn't load substitutes.")
        }
    }
}

#Preview("Substitute picker") {
    SubstitutePickerSheet(exerciseId: Sample.uuid(402), currentName: "Bench Press") { _ in }
        .environment(\.appEnvironment, .preview())
}
