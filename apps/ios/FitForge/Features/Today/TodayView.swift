import SwiftUI

/// Today (home tab) — §2.3: today's workout card (from active routine + weekday
/// mapping), calorie/macro ring (from today's nutrition logs), weight sparkline,
/// streak.
struct TodayView: View {
    @Environment(\.appEnvironment) private var env
    @State private var routine: RoutineTree?
    @State private var daily: DailyNutrition?
    @State private var targets: NutritionProfile?
    @State private var weights: [BodyMetric] = []
    @State private var sessions: [WorkoutSession] = []
    @State private var loaded = false
    @State private var activeSessionDay: RoutineDayTree?

    private var todaysDay: RoutineDayTree? {
        // Map current weekday (0=Mon…6=Sun) to a pinned routine day.
        let weekday = TodayView.mondayIndex(for: Date())
        return routine?.routineDays.first { $0.weekday == weekday }
            ?? routine?.routineDays.sorted { $0.dayIndex < $1.dayIndex }.first
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.l) {
                    workoutCard
                    nutritionCard
                    weightCard
                    streakCard
                }
                .ffScreenPadding()
                .padding(.vertical, Spacing.l)
            }
            .background(Palette.background)
            .navigationTitle("Today")
            .fullScreenCover(item: $activeSessionDay) { day in
                WorkoutPlayerView(day: day)
            }
        }
        .task { await load() }
    }

    // MARK: Cards

    @ViewBuilder private var workoutCard: some View {
        VStack(alignment: .leading, spacing: Spacing.m) {
            Text("Today's workout").ffSectionHeader()
            if let day = todaysDay {
                Text(day.name).font(.ffTitle3).foregroundStyle(Palette.textPrimary)
                Text("\(day.routineExercises.count) exercises").font(.ffSubheadline).foregroundStyle(Palette.textSecondary)
                PrimaryButton("Start workout", systemImage: "play.fill") { activeSessionDay = day }
            } else if loaded {
                Text("Rest day — no workout scheduled.").font(.ffSubheadline).foregroundStyle(Palette.textSecondary)
            } else {
                ProgressView()
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .ffCard()
    }

    @ViewBuilder private var nutritionCard: some View {
        VStack(alignment: .leading, spacing: Spacing.m) {
            Text("Nutrition").ffSectionHeader()
            MacroRing(consumed: daily?.macros ?? Macros(),
                      target: targetMacros, size: 150)
                .frame(maxWidth: .infinity)
        }
        .ffCard()
    }

    @ViewBuilder private var weightCard: some View {
        VStack(alignment: .leading, spacing: Spacing.m) {
            Text("Body weight").ffSectionHeader()
            if weights.count >= 2 {
                Sparkline(values: weights.reversed().compactMap(\.weightKg))
                    .frame(height: 48)
                if let latest = weights.first?.weightKg {
                    Text(String(format: "%.1f kg", latest)).font(.ffTitle3).foregroundStyle(Palette.textPrimary)
                }
            } else {
                Text("Log your weight to see a trend.").font(.ffSubheadline).foregroundStyle(Palette.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .ffCard()
    }

    @ViewBuilder private var streakCard: some View {
        HStack {
            Image(systemName: "flame.fill").foregroundStyle(Palette.accent)
            Text("\(streak)-day streak").font(.ffHeadline)
            Spacer()
            Text("\(sessions.count) recent sessions").font(.ffFootnote).foregroundStyle(Palette.textSecondary)
        }
        .ffCard()
    }

    private var targetMacros: Macros {
        Macros(kcal: Double(targets?.kcalTarget ?? 2000),
               protein: Double(targets?.proteinGTarget ?? 140),
               carbs: Double(targets?.carbsGTarget ?? 200),
               fat: Double(targets?.fatGTarget ?? 60))
    }

    /// Consecutive days with a completed session ending today or yesterday.
    private var streak: Int {
        let cal = Calendar.current
        let days = Set(sessions.compactMap { $0.completedAt }.map { cal.startOfDay(for: $0) })
        var count = 0
        var cursor = cal.startOfDay(for: Date())
        while days.contains(cursor) {
            count += 1
            cursor = cal.date(byAdding: .day, value: -1, to: cursor)!
        }
        return count
    }

    private func load() async {
        async let r = try? env.routines.activeRoutine()
        async let d = try? env.nutrition.dailyTotals(on: .today())
        async let np = try? env.nutrition.nutritionProfile()
        async let w = try? env.progress.bodyMetrics(limit: 30)
        async let s = try? env.workouts.recentSessions(limit: 30)
        routine = await r ?? nil
        daily = await d ?? nil
        targets = await np ?? nil
        weights = await w ?? []
        sessions = await s ?? []
        loaded = true
    }

    static func mondayIndex(for date: Date, calendar: Calendar = .current) -> Int {
        // Calendar weekday: 1=Sun…7=Sat → convert to 0=Mon…6=Sun.
        let wd = calendar.component(.weekday, from: date)
        return (wd + 5) % 7
    }
}

/// A tiny inline line chart for the weight trend.
struct Sparkline: View {
    let values: [Double]
    var body: some View {
        GeometryReader { geo in
            if let minV = values.min(), let maxV = values.max(), values.count > 1 {
                let range = max(maxV - minV, 0.001)
                Path { path in
                    for (i, v) in values.enumerated() {
                        let x = geo.size.width * CGFloat(i) / CGFloat(values.count - 1)
                        let y = geo.size.height * (1 - CGFloat((v - minV) / range))
                        if i == 0 { path.move(to: CGPoint(x: x, y: y)) }
                        else { path.addLine(to: CGPoint(x: x, y: y)) }
                    }
                }
                .stroke(Palette.accent, style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
            }
        }
    }
}

#Preview("Today") {
    TodayView().environment(\.appEnvironment, .preview())
}
