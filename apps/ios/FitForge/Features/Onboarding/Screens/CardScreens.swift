import SwiftUI

// MARK: Screen 2 — Goals (§2.2)

struct GoalsScreen: View {
    @Bindable var model: OnboardingViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.l) {
            Text("Pick a primary goal. You can add a secondary one too.")
                .font(.ffSubheadline).foregroundStyle(Palette.textSecondary)

            Text("Primary").ffSectionHeader()
            ForEach(GoalType.allCases) { goal in
                SelectableCard(title: goal.displayName, systemImage: goal.systemImage,
                               isSelected: model.primaryGoal == goal) {
                    model.primaryGoal = goal
                    if model.secondaryGoal == goal { model.secondaryGoal = nil }
                }
            }

            if let primary = model.primaryGoal {
                Text("Secondary (optional)").ffSectionHeader().padding(.top, Spacing.s)
                FlowChips(GoalType.allCases.filter { $0 != primary }) { goal in
                    CapsuleChip(goal.displayName, isOn: model.secondaryGoal == goal) {
                        model.secondaryGoal = (model.secondaryGoal == goal) ? nil : goal
                    }
                }
                if let goal = model.primaryGoal {
                    InfoBanner(text: "We've tuned your plan for \(goal.displayName.lowercased()).")
                }
            }
        }
    }
}

// MARK: Screen 3 — Experience (§2.2)

struct ExperienceScreen: View {
    @Bindable var model: OnboardingViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.l) {
            Text("Be honest — this sets your difficulty ceiling and volume.")
                .font(.ffSubheadline).foregroundStyle(Palette.textSecondary)
            ForEach(ExperienceLevel.allCases) { level in
                SelectableCard(title: level.displayName, subtitle: level.subtitle,
                               isSelected: model.experience == level) {
                    model.experience = level
                }
            }
        }
    }
}

// MARK: Screen 5 — Training location (§2.2)

struct LocationScreen: View {
    @Bindable var model: OnboardingViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.l) {
            Text("We'll preload the right equipment on the next screen.")
                .font(.ffSubheadline).foregroundStyle(Palette.textSecondary)
            ForEach(TrainingLocation.allCases) { loc in
                SelectableCard(title: loc.displayName, subtitle: loc.subtitle, systemImage: loc.systemImage,
                               isSelected: model.trainingLocation == loc) {
                    model.trainingLocation = loc
                }
            }
        }
    }
}

// MARK: - Small shared pieces

/// A wrapping row of chips (SwiftUI has no native flow layout on iOS 16, but iOS
/// 17+ ships `Layout`; we use a simple `FlowLayout`).
struct FlowChips<Data: RandomAccessCollection, Content: View>: View where Data.Element: Hashable {
    let data: Data
    let content: (Data.Element) -> Content
    init(_ data: Data, @ViewBuilder content: @escaping (Data.Element) -> Content) {
        self.data = data; self.content = content
    }
    var body: some View {
        FlowLayout(spacing: Spacing.s) {
            ForEach(Array(data), id: \.self) { content($0) }
        }
    }
}

struct InfoBanner: View {
    let text: String
    var systemImage: String = "sparkles"
    var body: some View {
        HStack(spacing: Spacing.s) {
            Image(systemName: systemImage).foregroundStyle(Palette.accent)
            Text(text).font(.ffFootnote).foregroundStyle(Palette.textPrimary)
            Spacer(minLength: 0)
        }
        .padding(Spacing.m)
        .background(Palette.accentSoft, in: RoundedRectangle(cornerRadius: Radius.s, style: .continuous))
    }
}

/// A minimal flow layout (iOS 16+) for wrapping chips.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var rows: [[LayoutSubviews.Element]] = [[]]
        var x: CGFloat = 0
        var totalHeight: CGFloat = 0
        var rowHeight: CGFloat = 0
        for sub in subviews {
            let size = sub.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, !rows[rows.count - 1].isEmpty {
                rows.append([]); totalHeight += rowHeight + spacing; x = 0; rowHeight = 0
            }
            rows[rows.count - 1].append(sub)
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        totalHeight += rowHeight
        return CGSize(width: maxWidth == .infinity ? x : maxWidth, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        for sub in subviews {
            let size = sub.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX; y += rowHeight + spacing; rowHeight = 0
            }
            sub.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

#Preview("Goals") {
    ScrollView { GoalsScreen(model: previewModel()).padding() }
        .background(Palette.background)
}
#Preview("Experience") {
    ScrollView { ExperienceScreen(model: previewModel()).padding() }
        .background(Palette.background)
}
#Preview("Location") {
    ScrollView { LocationScreen(model: previewModel()).padding() }
        .background(Palette.background)
}

@MainActor func previewModel() -> OnboardingViewModel {
    let m = OnboardingViewModel(env: .preview())
    m.primaryGoal = .fatLoss
    m.allEquipment = Sample.equipment
    m.trainingLocation = .home
    m.equipmentSlugs = ["dumbbell", "flat-bench", "resistance-bands"]
    m.favorites = [ExercisePick(id: Sample.uuid(403), slug: "dumbbell-bench-press", name: "Dumbbell Bench Press")]
    m.targets = Sample.nutritionTargets
    m.generatedRoutine = Sample.routineTree
    return m
}
