import SwiftUI

// MARK: - Typography scale
//
// Built on the system font with Dynamic Type support (rounded design for a
// friendly, modern feel). Use these instead of ad-hoc `.font(...)` so text
// stays consistent across screens.

public extension Font {
    static let ffLargeTitle = Font.system(.largeTitle, design: .rounded).weight(.bold)
    static let ffTitle = Font.system(.title, design: .rounded).weight(.bold)
    static let ffTitle2 = Font.system(.title2, design: .rounded).weight(.semibold)
    static let ffTitle3 = Font.system(.title3, design: .rounded).weight(.semibold)
    static let ffHeadline = Font.system(.headline, design: .rounded)
    static let ffBody = Font.system(.body, design: .rounded)
    static let ffCallout = Font.system(.callout, design: .rounded)
    static let ffSubheadline = Font.system(.subheadline, design: .rounded)
    static let ffFootnote = Font.system(.footnote, design: .rounded)
    static let ffCaption = Font.system(.caption, design: .rounded)
    /// Tabular monospaced digits for timers and set numbers.
    static let ffMonoLarge = Font.system(size: 56, weight: .bold, design: .rounded).monospacedDigit()
    static let ffMono = Font.system(.body, design: .rounded).monospacedDigit()
}

public extension Text {
    func ffSectionHeader() -> some View {
        self.font(.ffFootnote.weight(.semibold))
            .foregroundStyle(Palette.textSecondary)
            .textCase(.uppercase)
            .kerning(0.5)
    }
}
