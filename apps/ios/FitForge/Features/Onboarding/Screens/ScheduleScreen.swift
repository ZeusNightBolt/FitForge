import SwiftUI

/// Screen 4 — Schedule (§2.2): days/week stepper + weekday chips +
/// session-length chips. Defaults come from the goal×experience matrix (§7.2.5)
/// applied when leaving the experience screen; weekday chips are pre-selected to
/// an evenly-spaced pattern.
struct ScheduleScreen: View {
    @Bindable var model: OnboardingViewModel

    private static let weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    private let sessionOptions = [30, 45, 60, 75, 90]

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xl) {
            if let d = model.defaults {
                InfoBanner(text: "Suggested: \(d.splitName) — \(d.daysPerWeek) days, \(d.sessionMinutes) min.")
            }

            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Days per week").ffSectionHeader()
                CountStepper(title: "Training days", value: Binding(
                    get: { model.daysPerWeek },
                    set: { newValue in
                        model.daysPerWeek = newValue
                        model.preferredDays = OnboardingViewModel.evenlySpacedDays(count: newValue)
                    }), range: 1...7)
                .ffCard()
            }

            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Which days?").ffSectionHeader()
                FlowChips(Array(0..<7)) { day in
                    CapsuleChip(Self.weekdayLabels[day], isOn: model.preferredDays.contains(day)) {
                        if model.preferredDays.contains(day) {
                            model.preferredDays.remove(day)
                        } else {
                            model.preferredDays.insert(day)
                        }
                    }
                }
                Text("Pick roughly \(model.daysPerWeek). We spaced them out for recovery.")
                    .font(.ffCaption).foregroundStyle(Palette.textSecondary)
            }

            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Session length").ffSectionHeader()
                FlowChips(sessionOptions) { minutes in
                    CapsuleChip("\(minutes) min", isOn: model.sessionMinutes == minutes) {
                        model.sessionMinutes = minutes
                    }
                }
            }
        }
    }
}

#Preview("Schedule") {
    ScrollView { ScheduleScreen(model: previewModel()).padding() }
        .background(Palette.background)
}
