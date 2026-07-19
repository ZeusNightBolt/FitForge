import SwiftUI

// MARK: - Spacing, radius & layout tokens
//
// A 4-pt base scale. Screens target ≤430 pt wide iPhones; the bottom-anchored
// CTA and generous touch targets follow the thumb-first principle (§1.3).

public enum Spacing {
    public static let xs: CGFloat = 4
    public static let s: CGFloat = 8
    public static let m: CGFloat = 12
    public static let l: CGFloat = 16
    public static let xl: CGFloat = 24
    public static let xxl: CGFloat = 32
    public static let xxxl: CGFloat = 48

    /// Standard screen horizontal inset.
    public static let screenH: CGFloat = 20
    /// Minimum tap target.
    public static let tapTarget: CGFloat = 44
}

public enum Radius {
    public static let s: CGFloat = 8
    public static let m: CGFloat = 14
    public static let l: CGFloat = 20
    public static let pill: CGFloat = 999
}

public extension View {
    /// Standard card container: elevated surface, rounded, subtle border.
    func ffCard(padding: CGFloat = Spacing.l) -> some View {
        self.padding(padding)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.m, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Radius.m, style: .continuous)
                    .strokeBorder(Palette.separator, lineWidth: 1)
            )
    }

    /// Screen horizontal padding.
    func ffScreenPadding() -> some View { self.padding(.horizontal, Spacing.screenH) }
}
