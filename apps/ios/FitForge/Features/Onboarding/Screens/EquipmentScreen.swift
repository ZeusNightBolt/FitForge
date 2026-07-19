import SwiftUI

/// Screen 6 — Equipment (§2.2): preset already toggled on (from location), a
/// type-ahead search box, and equipment chips grouped by category. Dependency
/// nudges (§7.2.1) appear as one-tap suggestion chips.
struct EquipmentScreen: View {
    @Bindable var model: OnboardingViewModel
    @State private var query = ""

    private var filtered: [Equipment] {
        guard !query.searchNormalized.isEmpty else { return model.allEquipment }
        let q = query.searchNormalized
        return model.allEquipment.filter { $0.name.lowercased().contains(q) || $0.slug.contains(q) }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.l) {
            Text("We preselected a \(model.trainingLocation?.displayName.lowercased() ?? "") kit — tweak anything.")
                .font(.ffSubheadline).foregroundStyle(Palette.textSecondary)

            SearchField("Search equipment", text: $query)

            let suggestions = model.equipmentSuggestions
            if !suggestions.isEmpty {
                VStack(alignment: .leading, spacing: Spacing.s) {
                    Text("Suggested to add").ffSectionHeader()
                    FlowChips(suggestions) { slug in
                        CapsuleChip(name(for: slug), systemImage: "plus", isOn: false) {
                            model.equipmentSlugs.insert(slug)
                        }
                    }
                }
            }

            if query.searchNormalized.isEmpty {
                ForEach(EquipmentCategory.allCases.sorted { $0.displayOrder < $1.displayOrder }) { category in
                    let items = model.equipment(for: category)
                    if !items.isEmpty {
                        VStack(alignment: .leading, spacing: Spacing.s) {
                            Text(category.displayName).ffSectionHeader()
                            FlowChips(items) { eq in
                                CapsuleChip(eq.name, isOn: model.equipmentSlugs.contains(eq.slug)) {
                                    model.toggleEquipment(eq.slug)
                                }
                            }
                        }
                    }
                }
            } else {
                FlowChips(filtered) { eq in
                    CapsuleChip(eq.name, isOn: model.equipmentSlugs.contains(eq.slug)) {
                        model.toggleEquipment(eq.slug)
                    }
                }
            }

            Text("\(model.equipmentSlugs.count) selected")
                .font(.ffFootnote).foregroundStyle(Palette.textSecondary)
        }
    }

    private func name(for slug: String) -> String {
        model.allEquipment.first { $0.slug == slug }?.name ?? slug
    }
}

#Preview("Equipment") {
    ScrollView { EquipmentScreen(model: previewModel()).padding() }
        .background(Palette.background)
}
