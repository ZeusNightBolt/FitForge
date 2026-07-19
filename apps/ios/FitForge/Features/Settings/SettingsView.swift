import SwiftUI

/// Settings (§2.3 "Profile & preferences"): every onboarding answer is editable;
/// editing equipment or exclusions offers "re-generate my plan?". Also account
/// actions (sign out, delete account per App Store rule §5.4).
struct SettingsView: View {
    @Environment(\.appEnvironment) private var env
    @Environment(SessionModel.self) private var session
    @State private var profile: Profile?
    @State private var nutrition: NutritionProfile?
    @State private var showRegeneratePrompt = false
    @State private var showDeleteConfirm = false

    var body: some View {
        NavigationStack {
            List {
                Section("Profile") {
                    row("Name", profile?.displayName ?? "—")
                    row("Goal", profile?.primaryGoal?.displayName ?? "—")
                    row("Experience", profile?.experienceLevel?.displayName ?? "—")
                    NavigationLink("Goal & experience") { EditGoalsView(profile: $profile) }
                }

                Section("Training") {
                    row("Days/week", profile?.daysPerWeek.map(String.init) ?? "—")
                    row("Session", profile?.sessionMinutes.map { "\($0) min" } ?? "—")
                    row("Location", profile?.trainingLocation?.displayName ?? "—")
                    Button("Edit equipment & exclusions") { showRegeneratePrompt = true }
                }

                Section("Nutrition") {
                    row("Diet", nutrition?.dietType.displayName ?? "—")
                    row("Calories", nutrition?.kcalTarget.map { "\($0) kcal" } ?? "—")
                    row("Protein", nutrition?.proteinGTarget.map { "\($0) g" } ?? "—")
                    row("Meals/day", nutrition?.mealsPerDay.map(String.init) ?? "—")
                }

                Section("Units & body") {
                    row("Units", profile?.unitSystem.displayName ?? "—")
                    row("Height", profile?.heightCm.map { String(format: "%.0f cm", $0) } ?? "—")
                    row("Sex", profile?.sex?.displayName ?? "—")
                }

                Section {
                    Button("Sign out") { session.signOut() }
                    Button("Delete account", role: .destructive) { showDeleteConfirm = true }
                } footer: {
                    Text("Deleting your account permanently removes all your data.")
                }

                Section {
                    HStack { Text("Version"); Spacer(); Text("1.0 (MVP)").foregroundStyle(Palette.textSecondary) }
                }
            }
            .navigationTitle("Settings")
            .confirmationDialog("Re-generate your plan?",
                                isPresented: $showRegeneratePrompt, titleVisibility: .visible) {
                Button("Re-generate plan") { Task { _ = try? await env.onboarding.generateStarterRoutine(name: nil) } }
                Button("Just edit, keep plan") {}
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Changing equipment or exclusions can rebuild your routine to match.")
            }
            .alert("Delete account?", isPresented: $showDeleteConfirm) {
                Button("Delete", role: .destructive) {
                    Task { try? await env.auth.deleteAccount(); session.signOut() }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This cannot be undone.")
            }
        }
        .task { await load() }
    }

    private func row(_ label: String, _ value: String) -> some View {
        HStack { Text(label); Spacer(); Text(value).foregroundStyle(Palette.textSecondary) }
    }

    private func load() async {
        profile = try? await env.onboarding.loadProfile()
        nutrition = try? await env.nutrition.nutritionProfile()
    }
}

/// A focused editor for the goal + experience answers, written back via PATCH.
struct EditGoalsView: View {
    @Binding var profile: Profile?
    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss
    @State private var goal: GoalType = .generalHealth
    @State private var experience: ExperienceLevel = .beginner

    var body: some View {
        Form {
            Section("Primary goal") {
                Picker("Goal", selection: $goal) { ForEach(GoalType.allCases) { Text($0.displayName).tag($0) } }
                    .pickerStyle(.inline).labelsHidden()
            }
            Section("Experience") {
                Picker("Experience", selection: $experience) {
                    ForEach(ExperienceLevel.allCases) { Text($0.displayName).tag($0) }
                }.pickerStyle(.inline).labelsHidden()
            }
        }
        .navigationTitle("Goal & experience")
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    Task {
                        var patch = ProfilePatch(); patch.primaryGoal = goal; patch.experienceLevel = experience
                        profile = try? await env.onboarding.patchProfile(patch)
                        dismiss()
                    }
                }
            }
        }
        .onAppear {
            goal = profile?.primaryGoal ?? .generalHealth
            experience = profile?.experienceLevel ?? .beginner
        }
    }
}

#Preview("Settings") {
    SettingsView()
        .environment(\.appEnvironment, .preview())
        .environment(SessionModel(env: .preview()))
}
