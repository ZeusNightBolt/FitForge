import SwiftUI

/// Calorie/macro ring for the Today dashboard and Targets review (§2.3).
/// Outer ring = calories consumed vs target; three inner bars = macros.
public struct MacroRing: View {
    let consumed: Macros
    let target: Macros
    var size: CGFloat = 180

    public init(consumed: Macros, target: Macros, size: CGFloat = 180) {
        self.consumed = consumed; self.target = target; self.size = size
    }

    private var kcalFraction: Double {
        target.kcal > 0 ? min(consumed.kcal / target.kcal, 1) : 0
    }

    public var body: some View {
        VStack(spacing: Spacing.l) {
            ZStack {
                Circle().stroke(Palette.separator, lineWidth: 14)
                Circle()
                    .trim(from: 0, to: kcalFraction)
                    .stroke(Palette.accent, style: StrokeStyle(lineWidth: 14, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 0) {
                    Text("\(Int(consumed.kcal.rounded()))")
                        .font(.ffMonoLarge).foregroundStyle(Palette.textPrimary)
                    Text("of \(Int(target.kcal.rounded())) kcal")
                        .font(.ffFootnote).foregroundStyle(Palette.textSecondary)
                }
            }
            .frame(width: size, height: size)
            .animation(.easeInOut, value: kcalFraction)

            HStack(spacing: Spacing.l) {
                macroBar("Protein", consumed.protein, target.protein, Palette.protein)
                macroBar("Carbs", consumed.carbs, target.carbs, Palette.carbs)
                macroBar("Fat", consumed.fat, target.fat, Palette.fat)
            }
        }
    }

    private func macroBar(_ label: String, _ value: Double, _ goal: Double, _ color: Color) -> some View {
        VStack(spacing: Spacing.xs) {
            Text(label).font(.ffCaption).foregroundStyle(Palette.textSecondary)
            GeometryReader { geo in
                ZStack(alignment: .bottom) {
                    Capsule().fill(Palette.separator)
                    Capsule().fill(color)
                        .frame(height: geo.size.height * (goal > 0 ? min(value / goal, 1) : 0))
                }
            }
            .frame(height: 40)
            Text("\(Int(value.rounded()))/\(Int(goal.rounded()))g")
                .font(.ffCaption.monospacedDigit()).foregroundStyle(Palette.textPrimary)
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview("MacroRing") {
    MacroRing(consumed: Macros(kcal: 1200, protein: 90, carbs: 120, fat: 35),
              target: Macros(kcal: 1750, protein: 120, carbs: 180, fat: 55))
        .padding()
        .background(Palette.background)
}
