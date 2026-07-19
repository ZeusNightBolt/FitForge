import SwiftUI

/// Screen 7 — Exercises you enjoy (§2.2): type-ahead multi-select over the
/// exercise catalog plus 8 popularity-ranked suggestion chips (§7.3). Search is
/// debounced 150 ms and stale requests are cancelled (§7.1).
struct ExercisePrefsScreen: View {
    @Bindable var model: OnboardingViewModel
    @Environment(\.appEnvironment) private var env

    @State private var query = ""
    @State private var results: [ExerciseSearchResult] = []
    @State private var suggestions: [ExerciseSearchResult] = []
    @State private var isSearching = false
    private let debouncer = Debouncer()

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.l) {
            Text("Add movements you like — we'll favor them when building your plan.")
                .font(.ffSubheadline).foregroundStyle(Palette.textSecondary)

            SearchField("Search exercises", text: $query)
                .onChange(of: query) { _, newValue in search(newValue) }

            if isSearching { ProgressView().frame(maxWidth: .infinity) }

            if !results.isEmpty {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    ForEach(results) { r in
                        SearchResultRow(title: r.name, isAdded: isPicked(r.exerciseId)) {
                            toggle(r)
                        }
                    }
                }
            } else if query.isEmpty {
                VStack(alignment: .leading, spacing: Spacing.s) {
                    Text("Popular for you").ffSectionHeader()
                    FlowChips(suggestions) { s in
                        CapsuleChip(s.name, systemImage: isPicked(s.exerciseId) ? "checkmark" : "plus",
                                    isOn: isPicked(s.exerciseId)) { toggle(s) }
                    }
                }
            }

            if !model.favorites.isEmpty {
                VStack(alignment: .leading, spacing: Spacing.s) {
                    Text("Selected (\(model.favorites.count))").ffSectionHeader()
                    FlowChips(model.favorites) { pick in
                        CapsuleChip(pick.name, systemImage: "xmark", isOn: true) {
                            model.favorites.removeAll { $0.id == pick.id }
                        }
                    }
                }
            }
        }
        .task { await loadSuggestions() }
    }

    private func isPicked(_ id: UUID) -> Bool { model.favorites.contains { $0.id == id } }

    private func toggle(_ r: ExerciseSearchResult) {
        Haptics.selection()
        if isPicked(r.exerciseId) {
            model.favorites.removeAll { $0.id == r.exerciseId }
        } else {
            model.favorites.append(ExercisePick(id: r.exerciseId, slug: r.slug, name: r.name))
        }
    }

    private func loadSuggestions() async {
        suggestions = (try? await env.catalog.suggestionChips(experience: model.experience)) ?? []
    }

    private func search(_ text: String) {
        guard text.isSearchable else { results = []; isSearching = false; return }
        isSearching = true
        Task {
            await debouncer.run(delayMs: 150) {
                let params = SearchExercisesParams(q: text, pLimit: 8, filterEquipment: true)
                let found = (try? await env.catalog.searchExercises(params)) ?? []
                await MainActor.run { results = found; isSearching = false }
            }
        }
    }
}

/// A tappable search-result row used across type-ahead screens.
struct SearchResultRow: View {
    let title: String
    var subtitle: String?
    let isAdded: Bool
    let action: () -> Void
    var body: some View {
        Button(action: { Haptics.selection(); action() }) {
            HStack {
                VStack(alignment: .leading, spacing: 1) {
                    Text(title).font(.ffBody).foregroundStyle(Palette.textPrimary)
                    if let subtitle { Text(subtitle).font(.ffCaption).foregroundStyle(Palette.textSecondary) }
                }
                Spacer()
                Image(systemName: isAdded ? "checkmark.circle.fill" : "plus.circle")
                    .foregroundStyle(isAdded ? Palette.accent : Palette.textSecondary)
            }
            .padding(.vertical, Spacing.s)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

#Preview("Exercise prefs") {
    ScrollView { ExercisePrefsScreen(model: previewModel()).padding() }
        .background(Palette.background)
        .environment(\.appEnvironment, .preview())
}
