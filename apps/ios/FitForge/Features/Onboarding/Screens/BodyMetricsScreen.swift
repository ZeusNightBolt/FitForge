import SwiftUI

/// Screen 9 — Body metrics (§2.2): height, weight, birthdate, sex + unit toggle.
/// Wheel pickers are pre-scrolled to population medians (170 cm / 70 kg, adjusted
/// by sex); the unit system defaults from device locale. All optional, but we
/// note these power the calorie targets.
struct BodyMetricsScreen: View {
    @Bindable var model: OnboardingViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.xl) {
            Picker("Units", selection: $model.unitSystem) {
                ForEach(UnitSystem.allCases) { Text($0.displayName).tag($0) }
            }
            .pickerStyle(.segmented)
            .onChange(of: model.unitSystem) { _, _ in Haptics.selection() }

            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Sex").ffSectionHeader()
                FlowChips(SexType.allCases) { s in
                    CapsuleChip(s.displayName, isOn: model.sex == s) {
                        model.sex = s
                        // Nudge medians by sex (§7.2.4 fallbacks).
                        applyMedians(for: s)
                    }
                }
            }

            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Height").ffSectionHeader()
                if model.unitSystem == .metric {
                    WheelPicker(value: $model.heightCm, range: 120...220, step: 1, unit: "cm")
                } else {
                    HeightImperialPicker(heightCm: $model.heightCm)
                }
            }

            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Weight").ffSectionHeader()
                if model.unitSystem == .metric {
                    WheelPicker(value: $model.weightKg, range: 35...200, step: 0.5, unit: "kg")
                } else {
                    WheelPicker(value: Binding(
                        get: { model.weightKg * 2.2046226 },
                        set: { model.weightKg = $0 / 2.2046226 }), range: 80...440, step: 1, unit: "lb")
                }
            }

            VStack(alignment: .leading, spacing: Spacing.m) {
                Text("Birthdate").ffSectionHeader()
                DatePicker("Birthdate", selection: $model.birthdate,
                           in: ...Date(), displayedComponents: .date)
                    .datePickerStyle(.wheel)
                    .labelsHidden()
                    .frame(maxWidth: .infinity)
            }

            InfoBanner(text: "We only use these to calculate your calorie & protein targets.",
                       systemImage: "lock.fill")
        }
    }

    private func applyMedians(for sex: SexType) {
        // Only nudge if the user hasn't clearly customized (still at global median).
        switch sex {
        case .male:
            if model.heightCm == 170 { model.heightCm = 175 }
            if model.weightKg == 70 { model.weightKg = 82 }
        case .female:
            if model.heightCm == 175 { model.heightCm = 162 }
            if model.weightKg == 82 { model.weightKg = 70 }
        default: break
        }
    }
}

/// A numeric wheel picker over a stepped range.
struct WheelPicker: View {
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double
    let unit: String

    private var values: [Double] {
        stride(from: range.lowerBound, through: range.upperBound, by: step).map { $0 }
    }

    var body: some View {
        Picker("", selection: Binding(
            get: { closest(to: value) },
            set: { value = $0; Haptics.selection() })) {
            ForEach(values, id: \.self) { v in
                Text(step < 1 ? String(format: "%.1f %@", v, unit) : "\(Int(v)) \(unit)").tag(v)
            }
        }
        .pickerStyle(.wheel)
        .frame(height: 130)
        .clipped()
    }

    private func closest(to v: Double) -> Double {
        values.min(by: { abs($0 - v) < abs($1 - v) }) ?? range.lowerBound
    }
}

/// Feet/inches picker that writes back centimeters.
struct HeightImperialPicker: View {
    @Binding var heightCm: Double

    private var totalInches: Int { Int((heightCm / 2.54).rounded()) }
    private var feet: Int { totalInches / 12 }
    private var inches: Int { totalInches % 12 }

    var body: some View {
        HStack {
            Picker("ft", selection: Binding(
                get: { feet },
                set: { setHeight(feet: $0, inches: inches) })) {
                ForEach(3...7, id: \.self) { Text("\($0) ft").tag($0) }
            }.pickerStyle(.wheel).frame(maxWidth: .infinity, maxHeight: 130).clipped()
            Picker("in", selection: Binding(
                get: { inches },
                set: { setHeight(feet: feet, inches: $0) })) {
                ForEach(0...11, id: \.self) { Text("\($0) in").tag($0) }
            }.pickerStyle(.wheel).frame(maxWidth: .infinity, maxHeight: 130).clipped()
        }
    }

    private func setHeight(feet: Int, inches: Int) {
        heightCm = Double(feet * 12 + inches) * 2.54
        Haptics.selection()
    }
}

#Preview("Body metrics") {
    ScrollView { BodyMetricsScreen(model: previewModel()).padding() }
        .background(Palette.background)
}
