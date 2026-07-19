import SwiftUI

/// Screen 8 — Exclusions & substitutions (§2.2):
/// (a) body-area chips auto-exclude mapped movement patterns (§7.2.2); soft
///     patterns are shown pre-checked in an expander and individually keepable.
/// (b) a type-ahead "exercises to avoid"; each excluded exercise immediately
///     shows its top-3 substitutes (RPC `suggest_substitutes`) — the user can
///     pin one or keep "auto".
struct ExclusionsScreen: View {
    @Bindable var model: OnboardingViewModel
    @Environment(\.appEnvironment) private var env

    @State private var query = ""
    @State private var results: [ExerciseSearchResult] = []
    private let debouncer = Debouncer()

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xl) {
            // (a) Body areas
            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Anything we should protect?").ffSectionHeader()
                FlowChips(BodyArea.allCases) { area in
                    CapsuleChip(area.displayName, isOn: model.bodyAreas.contains(area)) {
                        if model.bodyAreas.contains(area) { model.bodyAreas.remove(area) }
                        else { model.bodyAreas.insert(area) }
                    }
                }
                ForEach(Array(model.bodyAreas), id: \.self) { area in
                    ExcludedPatternsExpander(area: area, model: model)
                }
            }

            // (b) Exercises to avoid
            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Exercises to avoid").ffSectionHeader()
                SearchField("Search exercises to avoid", text: $query)
                    .onChange(of: query) { _, v in search(v) }
                ForEach(results) { r in
                    SearchResultRow(title: r.name, isAdded: isExcluded(r.exerciseId)) { addExclusion(r) }
                }
                ForEach(model.excludedExercises) { pick in
                    ExcludedExerciseCard(pick: pick, model: model)
                }
            }
        }
    }

    private func isExcluded(_ id: UUID) -> Bool { model.excludedExercises.contains { $0.id == id } }

    private func addExclusion(_ r: ExerciseSearchResult) {
        guard !isExcluded(r.exerciseId) else { return }
        Haptics.selection()
        model.excludedExercises.append(ExercisePick(id: r.exerciseId, slug: r.slug, name: r.name))
        query = ""; results = []
    }

    private func search(_ text: String) {
        guard text.isSearchable else { results = []; return }
        Task {
            await debouncer.run(delayMs: 150) {
                let found = (try? await env.catalog.searchExercises(.init(q: text, pLimit: 8))) ?? []
                await MainActor.run { results = found }
            }
        }
    }
}

/// Shows the patterns excluded by a body area; soft ones are keepable.
struct ExcludedPatternsExpander: View {
    let area: BodyArea
    @Bindable var model: OnboardingViewModel
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            Button { withAnimation { expanded.toggle() } } label: {
                HStack {
                    Text("\(area.displayName): avoiding \(area.excludedPatterns.count) patterns")
                        .font(.ffFootnote).foregroundStyle(Palette.textPrimary)
                    Spacer()
                    Image(systemName: expanded ? "chevron.up" : "chevron.down")
                        .font(.ffCaption).foregroundStyle(Palette.textSecondary)
                }
            }.buttonStyle(.plain)

            if expanded {
                ForEach(area.excludedPatterns, id: \.pattern) { entry in
                    HStack {
                        Text(entry.pattern.displayName).font(.ffFootnote)
                        if entry.soft { Text("· optional").font(.ffCaption).foregroundStyle(Palette.textSecondary) }
                        Spacer()
                        if entry.soft {
                            // Soft patterns can be kept (un-excluded).
                            let kept = model.keptSoftPatterns.contains(entry.pattern)
                            Button(kept ? "Keep" : "Avoiding") {
                                if kept { model.keptSoftPatterns.remove(entry.pattern) }
                                else { model.keptSoftPatterns.insert(entry.pattern) }
                            }
                            .font(.ffCaption)
                            .foregroundStyle(kept ? Palette.accent : Palette.danger)
                        } else {
                            Image(systemName: "checkmark").font(.ffCaption).foregroundStyle(Palette.danger)
                        }
                    }
                }
            }
        }
        .padding(Spacing.m)
        .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.s, style: .continuous))
    }
}

/// An excluded exercise with its top-3 substitute suggestions.
struct ExcludedExerciseCard: View {
    let pick: ExercisePick
    @Bindable var model: OnboardingViewModel
    @Environment(\.appEnvironment) private var env
    @State private var subs: [SubstituteResult] = []
    @State private var loading = true

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.s) {
            HStack {
                Text(pick.name).font(.ffHeadline)
                Spacer()
                Button { model.excludedExercises.removeAll { $0.id == pick.id } } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(Palette.textSecondary)
                }.buttonStyle(.plain)
            }
            Text("We'll substitute with:").font(.ffCaption).foregroundStyle(Palette.textSecondary)
            if loading {
                ProgressView()
            } else {
                ForEach(subs.prefix(3)) { sub in
                    let pinned = pick.preferredSubstituteId == sub.exerciseId
                    Button { pin(sub) } label: {
                        HStack {
                            Image(systemName: pinned ? "pin.fill" : "pin").font(.ffCaption)
                                .foregroundStyle(pinned ? Palette.accent : Palette.textSecondary)
                            VStack(alignment: .leading, spacing: 0) {
                                Text(sub.name).font(.ffSubheadline).foregroundStyle(Palette.textPrimary)
                                if let reason = sub.reason {
                                    Text(reason).font(.ffCaption).foregroundStyle(Palette.textSecondary)
                                }
                            }
                            Spacer()
                        }
                        .contentShape(Rectangle())
                    }.buttonStyle(.plain)
                }
                Text(pick.preferredSubstituteId == nil ? "Or keep it automatic." : "Pinned as your preferred swap.")
                    .font(.ffCaption).foregroundStyle(Palette.textSecondary)
            }
        }
        .ffCard()
        .task { await load() }
    }

    private func pin(_ sub: SubstituteResult) {
        Haptics.selection()
        if let idx = model.excludedExercises.firstIndex(where: { $0.id == pick.id }) {
            let current = model.excludedExercises[idx].preferredSubstituteId
            model.excludedExercises[idx].preferredSubstituteId = current == sub.exerciseId ? nil : sub.exerciseId
        }
    }

    private func load() async {
        subs = (try? await env.catalog.suggestSubstitutes(.init(pExerciseId: pick.id, pLimit: 3))) ?? []
        loading = false
    }
}

#Preview("Exclusions") {
    let m = previewModel()
    m.bodyAreas = [.shoulders]
    m.excludedExercises = [ExercisePick(id: Sample.uuid(402), slug: "bench-press", name: "Barbell Bench Press")]
    return ScrollView { ExclusionsScreen(model: m).padding() }
        .background(Palette.background)
        .environment(\.appEnvironment, .preview())
}
