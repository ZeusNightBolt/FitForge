import SwiftUI

/// Logs a body_metrics row for today (§2.3 body weight/measurements). All fields
/// nullable; only entered values are sent.
struct LogBodyMetricView: View {
    let onSaved: () async -> Void
    @Environment(\.appEnvironment) private var env
    @Environment(\.dismiss) private var dismiss

    @State private var weight = ""
    @State private var waist = ""
    @State private var chest = ""
    @State private var arm = ""
    @State private var thigh = ""
    @State private var bodyFat = ""
    @State private var isSaving = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Weight & composition") {
                    numberField("Weight (kg)", $weight)
                    numberField("Body fat (%)", $bodyFat)
                }
                Section("Measurements (cm)") {
                    numberField("Waist", $waist)
                    numberField("Chest", $chest)
                    numberField("Arm", $arm)
                    numberField("Thigh", $thigh)
                }
            }
            .navigationTitle("Log measurements")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { Task { await save() } }.disabled(isSaving)
                }
            }
        }
    }

    private func numberField(_ label: String, _ text: Binding<String>) -> some View {
        HStack {
            Text(label)
            Spacer()
            TextField("—", text: text)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(width: 100)
        }
    }

    private func save() async {
        isSaving = true
        defer { isSaving = false }
        let metric = BodyMetric(id: UUID(), userId: Sample.userId, measuredOn: .today(),
                                weightKg: Double(weight), bodyFatPct: Double(bodyFat),
                                waistCm: Double(waist), chestCm: Double(chest),
                                armCm: Double(arm), thighCm: Double(thigh))
        _ = try? await env.progress.upsertBodyMetric(metric)
        Haptics.notify(.success)
        await onSaved()
        dismiss()
    }
}

#Preview("Log body metric") {
    LogBodyMetricView {}.environment(\.appEnvironment, .preview())
}
