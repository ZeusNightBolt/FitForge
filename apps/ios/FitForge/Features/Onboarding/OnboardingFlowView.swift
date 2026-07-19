import SwiftUI

/// Hosts the paged onboarding flow: a progress bar, a back affordance, the
/// current step's screen, and a bottom-anchored primary CTA (§1.3/§2.2).
/// Back never loses data because all state lives in `OnboardingViewModel`.
struct OnboardingFlowView: View {
    @Environment(\.appEnvironment) private var env
    @Environment(SessionModel.self) private var session
    @State private var model: OnboardingViewModel

    init(resumeStep: String) {
        // A throwaway preview env is replaced in `.task` with the real one.
        _model = State(initialValue: OnboardingViewModel(env: .preview(), resumeStep: resumeStep))
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header
                ScrollView {
                    currentScreen
                        .padding(.top, Spacing.l)
                        .ffScreenPadding()
                        .padding(.bottom, Spacing.xxl)
                }
                footer
            }
            .background(Palette.background.ignoresSafeArea())
            .navigationBarBackButtonHidden(true)
        }
        .task {
            // Rebind to the live environment + wire completion.
            model.replaceEnvironment(env)
            model.onFinished = { session.completeOnboarding() }
            await model.onAppear()
        }
    }

    // MARK: Sub-views

    private var header: some View {
        VStack(spacing: Spacing.m) {
            HStack {
                if model.step != OnboardingStep.allCases.first {
                    Button { model.back() } label: {
                        Image(systemName: "chevron.left").font(.ffHeadline).foregroundStyle(Palette.textPrimary)
                    }
                } else {
                    Color.clear.frame(width: 24, height: 24)
                }
                Spacer()
                Text("Step \(stepIndex + 1) of \(OnboardingStep.allCases.count)")
                    .font(.ffCaption).foregroundStyle(Palette.textSecondary)
                Spacer()
                Color.clear.frame(width: 24, height: 24)
            }
            ProgressBarView(progress: model.step.progress)
        }
        .padding(.horizontal, Spacing.screenH)
        .padding(.top, Spacing.s)
    }

    @ViewBuilder
    private var currentScreen: some View {
        VStack(alignment: .leading, spacing: Spacing.l) {
            Text(model.step.title).font(.ffTitle).foregroundStyle(Palette.textPrimary)
            switch model.step {
            case .goals: GoalsScreen(model: model)
            case .experience: ExperienceScreen(model: model)
            case .schedule: ScheduleScreen(model: model)
            case .location: LocationScreen(model: model)
            case .equipment: EquipmentScreen(model: model)
            case .exercisePrefs: ExercisePrefsScreen(model: model)
            case .exclusions: ExclusionsScreen(model: model)
            case .bodyMetrics: BodyMetricsScreen(model: model)
            case .nutritionPrefs: NutritionPrefsScreen(model: model)
            case .targetsReview: TargetsReviewScreen(model: model)
            case .planPreview: PlanPreviewScreen(model: model)
            }
        }
    }

    private var footer: some View {
        VStack(spacing: Spacing.s) {
            if let error = model.errorMessage {
                Text(error).font(.ffFootnote).foregroundStyle(Palette.danger).multilineTextAlignment(.center)
            }
            if model.step == .planPreview {
                PrimaryButton("Start plan", systemImage: "checkmark", isEnabled: true, isLoading: model.isSaving) {
                    Task { await model.finish() }
                }
            } else {
                PrimaryButton(ctaTitle, isEnabled: model.canAdvance, isLoading: model.isSaving) {
                    Task { await model.advance() }
                }
            }
        }
        .padding(.horizontal, Spacing.screenH)
        .padding(.top, Spacing.s)
        .padding(.bottom, Spacing.l)
        .background(.ultraThinMaterial)
    }

    private var ctaTitle: String {
        switch model.step {
        case .schedule, .equipment, .bodyMetrics, .exercisePrefs, .exclusions: return "Continue"
        case .targetsReview: return "Looks right"
        default: return "Next"
        }
    }

    private var stepIndex: Int { OnboardingStep.allCases.firstIndex(of: model.step) ?? 0 }
}

#Preview("Onboarding — goals") {
    OnboardingFlowView(resumeStep: "goals")
        .environment(\.appEnvironment, .preview())
        .environment(SessionModel(env: .preview()))
}

#Preview("Onboarding — plan preview") {
    let vm = OnboardingViewModel(env: .preview(), resumeStep: "plan_preview")
    vm.generatedRoutine = Sample.routineTree
    return OnboardingFlowContainerPreview(model: vm)
}

/// Lightweight preview host that injects a pre-populated model.
struct OnboardingFlowContainerPreview: View {
    @State var model: OnboardingViewModel
    var body: some View {
        OnboardingFlowView(resumeStep: model.step.rawValue)
            .environment(\.appEnvironment, .preview())
            .environment(SessionModel(env: .preview()))
    }
}
