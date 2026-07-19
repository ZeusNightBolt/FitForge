import SwiftUI

/// Workouts tab landing: the active routine plus all routines. Tapping a routine
/// opens the editor (§2.3 routine editor).
struct RoutinesListView: View {
    @Environment(\.appEnvironment) private var env
    @State private var routines: [Routine] = []
    @State private var active: RoutineTree?
    @State private var loaded = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.l) {
                    if let active {
                        VStack(alignment: .leading, spacing: Spacing.m) {
                            Text("Active plan").ffSectionHeader()
                            NavigationLink(value: active.id) {
                                RoutineSummaryCard(name: active.name,
                                                   subtitle: active.description ?? "\(active.routineDays.count) days",
                                                   isActive: true)
                            }.buttonStyle(.plain)
                        }
                    }
                    if routines.filter({ !$0.isActive }).isEmpty == false {
                        VStack(alignment: .leading, spacing: Spacing.m) {
                            Text("Other routines").ffSectionHeader()
                            ForEach(routines.filter { !$0.isActive }) { r in
                                NavigationLink(value: r.id) {
                                    RoutineSummaryCard(name: r.name, subtitle: r.goal?.displayName ?? "Custom", isActive: false)
                                }.buttonStyle(.plain)
                            }
                        }
                    }
                    if loaded && routines.isEmpty {
                        ContentUnavailableView("No routines yet", systemImage: "dumbbell",
                                               description: Text("Complete onboarding to generate a starter plan."))
                    }
                }
                .ffScreenPadding()
                .padding(.vertical, Spacing.l)
            }
            .background(Palette.background)
            .navigationTitle("Workouts")
            .navigationDestination(for: UUID.self) { id in RoutineEditorView(routineId: id) }
        }
        .task { await load() }
    }

    private func load() async {
        active = try? await env.routines.activeRoutine()
        routines = (try? await env.routines.allRoutines()) ?? []
        loaded = true
    }
}

struct RoutineSummaryCard: View {
    let name: String
    let subtitle: String
    let isActive: Bool
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(.ffHeadline).foregroundStyle(Palette.textPrimary)
                Text(subtitle).font(.ffFootnote).foregroundStyle(Palette.textSecondary)
            }
            Spacer()
            if isActive {
                Text("Active").font(.ffCaption.weight(.semibold))
                    .padding(.horizontal, Spacing.s).padding(.vertical, 4)
                    .background(Palette.accentSoft, in: Capsule()).foregroundStyle(Palette.accent)
            }
            Image(systemName: "chevron.right").foregroundStyle(Palette.textSecondary)
        }
        .ffCard()
    }
}

#Preview("Routines list") {
    RoutinesListView().environment(\.appEnvironment, .preview())
}
