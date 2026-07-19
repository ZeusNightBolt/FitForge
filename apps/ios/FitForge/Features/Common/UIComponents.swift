import SwiftUI

// MARK: - Reusable design-system primitives (mobile/thumb-first)

/// Bottom-anchored primary CTA (BLUEPRINT §1.3).
public struct PrimaryButton: View {
    let title: String
    var systemImage: String?
    var isEnabled: Bool
    var isLoading: Bool
    let action: () -> Void

    public init(_ title: String, systemImage: String? = nil, isEnabled: Bool = true,
                isLoading: Bool = false, action: @escaping () -> Void) {
        self.title = title; self.systemImage = systemImage; self.isEnabled = isEnabled
        self.isLoading = isLoading; self.action = action
    }

    public var body: some View {
        Button(action: { Haptics.impact(.medium); action() }) {
            HStack(spacing: Spacing.s) {
                if isLoading {
                    ProgressView().tint(Palette.textOnAccent)
                } else if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title).font(.ffHeadline)
            }
            .frame(maxWidth: .infinity, minHeight: 52)
            .foregroundStyle(Palette.textOnAccent)
            .background(Palette.accent, in: RoundedRectangle(cornerRadius: Radius.m, style: .continuous))
            .opacity(isEnabled && !isLoading ? 1 : 0.45)
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled || isLoading)
    }
}

public struct SecondaryButton: View {
    let title: String
    let action: () -> Void
    public init(_ title: String, action: @escaping () -> Void) { self.title = title; self.action = action }
    public var body: some View {
        Button(action: action) {
            Text(title).font(.ffHeadline)
                .frame(maxWidth: .infinity, minHeight: 52)
                .foregroundStyle(Palette.textPrimary)
                .background(Palette.surfaceElevated, in: RoundedRectangle(cornerRadius: Radius.m, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}

/// Capsule multi-select chip (equipment, allergies, weekdays, body areas).
public struct CapsuleChip: View {
    let title: String
    var systemImage: String?
    let isOn: Bool
    let action: () -> Void

    public init(_ title: String, systemImage: String? = nil, isOn: Bool, action: @escaping () -> Void) {
        self.title = title; self.systemImage = systemImage; self.isOn = isOn; self.action = action
    }

    public var body: some View {
        Button(action: { Haptics.selection(); action() }) {
            HStack(spacing: Spacing.xs) {
                if let systemImage { Image(systemName: systemImage).font(.ffFootnote) }
                Text(title).font(.ffSubheadline.weight(.medium))
            }
            .padding(.horizontal, Spacing.l)
            .padding(.vertical, Spacing.s + 2)
            .foregroundStyle(isOn ? Palette.textOnAccent : Palette.textPrimary)
            .background(isOn ? Palette.accent : Palette.surfaceElevated,
                        in: Capsule(style: .continuous))
            .overlay(Capsule().strokeBorder(isOn ? .clear : Palette.separator, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

/// A large tappable selection card (goals, experience, location, diet).
public struct SelectableCard: View {
    let title: String
    var subtitle: String?
    var systemImage: String?
    let isSelected: Bool
    let action: () -> Void

    public init(title: String, subtitle: String? = nil, systemImage: String? = nil,
                isSelected: Bool, action: @escaping () -> Void) {
        self.title = title; self.subtitle = subtitle; self.systemImage = systemImage
        self.isSelected = isSelected; self.action = action
    }

    public var body: some View {
        Button(action: { Haptics.selection(); action() }) {
            HStack(spacing: Spacing.l) {
                if let systemImage {
                    Image(systemName: systemImage)
                        .font(.title2)
                        .foregroundStyle(isSelected ? Palette.accent : Palette.textSecondary)
                        .frame(width: 32)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.ffHeadline).foregroundStyle(Palette.textPrimary)
                    if let subtitle {
                        Text(subtitle).font(.ffFootnote).foregroundStyle(Palette.textSecondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: 0)
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(isSelected ? Palette.accent : Palette.separator)
            }
            .padding(Spacing.l)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: Radius.m, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Radius.m, style: .continuous)
                    .strokeBorder(isSelected ? Palette.accent : Palette.separator, lineWidth: isSelected ? 2 : 1)
            )
        }
        .buttonStyle(.plain)
    }
}

/// Thin onboarding progress bar.
public struct ProgressBarView: View {
    let progress: Double // 0…1
    public init(progress: Double) { self.progress = max(0, min(1, progress)) }
    public var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(Palette.separator)
                Capsule().fill(Palette.accent).frame(width: geo.size.width * progress)
            }
        }
        .frame(height: 6)
        .animation(.easeInOut(duration: 0.25), value: progress)
    }
}

/// Stepper for integer values (days/week, meals/day).
public struct CountStepper: View {
    let title: String
    @Binding var value: Int
    let range: ClosedRange<Int>
    var suffix: String = ""

    public init(title: String, value: Binding<Int>, range: ClosedRange<Int>, suffix: String = "") {
        self.title = title; self._value = value; self.range = range; self.suffix = suffix
    }

    public var body: some View {
        HStack {
            Text(title).font(.ffBody)
            Spacer()
            HStack(spacing: Spacing.l) {
                stepButton("minus") { if value > range.lowerBound { value -= 1; Haptics.selection() } }
                Text("\(value)\(suffix)").font(.ffHeadline.monospacedDigit()).frame(minWidth: 44)
                stepButton("plus") { if value < range.upperBound { value += 1; Haptics.selection() } }
            }
        }
    }

    private func stepButton(_ icon: String, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon).font(.ffHeadline)
                .frame(width: 34, height: 34)
                .background(Palette.surfaceElevated, in: Circle())
                .foregroundStyle(Palette.textPrimary)
        }
        .buttonStyle(.plain)
    }
}

/// A debounced search field used by every type-ahead screen.
public struct SearchField: View {
    let placeholder: String
    @Binding var text: String
    public init(_ placeholder: String, text: Binding<String>) { self.placeholder = placeholder; self._text = text }
    public var body: some View {
        HStack(spacing: Spacing.s) {
            Image(systemName: "magnifyingglass").foregroundStyle(Palette.textSecondary)
            TextField(placeholder, text: $text)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .font(.ffBody)
            if !text.isEmpty {
                Button { text = "" } label: {
                    Image(systemName: "xmark.circle.fill").foregroundStyle(Palette.textSecondary)
                }.buttonStyle(.plain)
            }
        }
        .padding(.horizontal, Spacing.m)
        .frame(height: 46)
        .background(Palette.surfaceElevated, in: RoundedRectangle(cornerRadius: Radius.m, style: .continuous))
    }
}

/// Empty / loading / error state wrapper for async content.
public struct LoadableContent<T, Content: View>: View {
    let state: LoadState<T>
    let content: (T) -> Content
    var retry: (() -> Void)?

    public init(_ state: LoadState<T>, retry: (() -> Void)? = nil, @ViewBuilder content: @escaping (T) -> Content) {
        self.state = state; self.retry = retry; self.content = content
    }

    public var body: some View {
        switch state {
        case .idle, .loading:
            ProgressView().frame(maxWidth: .infinity, minHeight: 120)
        case .loaded(let value):
            content(value)
        case .failed(let message):
            VStack(spacing: Spacing.m) {
                Image(systemName: "exclamationmark.triangle").font(.title).foregroundStyle(Palette.warning)
                Text(message).font(.ffFootnote).foregroundStyle(Palette.textSecondary).multilineTextAlignment(.center)
                if let retry { Button("Try again", action: retry).font(.ffHeadline).foregroundStyle(Palette.accent) }
            }
            .frame(maxWidth: .infinity, minHeight: 120)
            .padding()
        }
    }
}

public enum LoadState<T> {
    case idle
    case loading
    case loaded(T)
    case failed(String)

    public var value: T? { if case .loaded(let v) = self { return v }; return nil }
}

extension LoadState: Equatable where T: Equatable {
    public static func == (lhs: LoadState<T>, rhs: LoadState<T>) -> Bool {
        switch (lhs, rhs) {
        case (.idle, .idle), (.loading, .loading): return true
        case (.loaded(let a), .loaded(let b)): return a == b
        case (.failed(let a), .failed(let b)): return a == b
        default: return false
        }
    }
}
