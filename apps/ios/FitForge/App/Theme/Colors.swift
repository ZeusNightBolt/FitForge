import SwiftUI

// MARK: - Color tokens
//
// Neutral surface + one accent, dark-mode-first (BLUEPRINT §1.3 "mobile-first").
// Colors are defined programmatically so the app needs no asset catalog to
// compile; swap to a `Color("…")` asset set later if a designer wants finer
// control. Each token adapts to light/dark via `UIColor` dynamic providers.

public enum Palette {
    /// Brand accent — a confident energetic orange.
    public static let accent = Color(hex: 0xFF6B35)
    public static let accentSoft = Color(hex: 0xFF6B35).opacity(0.16)

    public static let success = Color(hex: 0x30D158)
    public static let warning = Color(hex: 0xFFD60A)
    public static let danger = Color(hex: 0xFF453A)

    // Macro ring colors
    public static let protein = Color(hex: 0xFF6B35)
    public static let carbs = Color(hex: 0x0A84FF)
    public static let fat = Color(hex: 0xFFD60A)

    // Adaptive surfaces
    public static let background = adaptive(light: 0xF7F7F9, dark: 0x0B0B0F)
    public static let surface = adaptive(light: 0xFFFFFF, dark: 0x17171C)
    public static let surfaceElevated = adaptive(light: 0xFFFFFF, dark: 0x1F1F26)
    public static let separator = adaptive(light: 0xE3E3E8, dark: 0x2C2C33)

    public static let textPrimary = adaptive(light: 0x111114, dark: 0xF5F5F7)
    public static let textSecondary = adaptive(light: 0x6B6B72, dark: 0x9A9AA2)
    public static let textOnAccent = Color.white

    private static func adaptive(light: UInt32, dark: UInt32) -> Color {
        #if canImport(UIKit)
        Color(UIColor { trait in
            trait.userInterfaceStyle == .dark ? UIColor(rgb: dark) : UIColor(rgb: light)
        })
        #else
        Color(hex: light)
        #endif
    }
}

public extension Color {
    init(hex: UInt32, alpha: Double = 1) {
        self.init(.sRGB,
                  red: Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8) & 0xFF) / 255,
                  blue: Double(hex & 0xFF) / 255,
                  opacity: alpha)
    }
}

#if canImport(UIKit)
import UIKit
extension UIColor {
    convenience init(rgb: UInt32) {
        self.init(red: CGFloat((rgb >> 16) & 0xFF) / 255,
                  green: CGFloat((rgb >> 8) & 0xFF) / 255,
                  blue: CGFloat(rgb & 0xFF) / 255,
                  alpha: 1)
    }
}
#endif
