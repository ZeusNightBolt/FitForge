# FitForge — iOS (SwiftUI)

Native SwiftUI iPhone app for the FitForge MVP (iOS 17+). One backend (Supabase),
thin client: all intelligence lives in Postgres RPCs (BLUEPRINT §5.3/§7); this app
holds UI state only.

## Project generation

The Xcode project is **not** committed — `project.yml` (XcodeGen) is the reviewable
source of truth. Generate it with:

```bash
brew install xcodegen        # once
cd apps/ios
xcodegen generate            # writes FitForge.xcodeproj
open FitForge.xcodeproj
```

Swift Package dependency: [`supabase-swift`](https://github.com/supabase/supabase-swift)
(`Supabase` product), pinned `from: 2.5.1` in `project.yml`.

## Configuration

`AppConfig` reads `SUPABASE_URL` / `SUPABASE_ANON_KEY` from `Info.plist` (populate
from your `.env` via build settings). With them empty it falls back to the local
`supabase start` stack, so the simulator + previews work out of the box.

Sign in with Apple requires the `com.apple.developer.applesignin` entitlement
(`Resources/FitForge.entitlements`) and a Team ID in `project.yml`.

## Structure

```
FitForge/
├── App/            FitForgeApp, RootView, SessionModel, Theme/ (Colors, Typography, Spacing, Haptics)
├── Core/
│   ├── Config.swift  SupabaseClient+.swift
│   ├── Models/       Codable mirrors of §4 tables + §5.3 RPC payloads (+ DateOnly)
│   └── Repositories/ protocol + Live Supabase impl + Mocks/ preview mocks
├── Features/
│   ├── Onboarding/   full §2.2 flow (Auth → 11 paged screens → plan preview)
│   ├── Today/  Workout/  Routines/  Nutrition/  Progress/  Settings/   (§2.3)
│   └── Common/        shared UI primitives, MacroRing, Debouncer, SubstitutePickerSheet
├── Resources/       Info.plist, entitlements
└── Tests/           DecodingTests, RulesTests + Fixtures/ (JSON matching §4/§5)
```

## Tests

```bash
xcodebuild -scheme FitForge -destination 'platform=iOS Simulator,name=iPhone 15' build test
```

`Tests/DecodingTests.swift` decodes JSON fixtures shaped like the PostgREST/RPC
responses; `Tests/RulesTests.swift` covers the client-side helper rules
(meal-slot defaulting, plate math, evenly-spaced days, body-area exclusion map,
Epley e1RM, equipment presets/nudges). Every screen ships a `#Preview`.

> **Note:** this workstream was authored without a macOS/Xcode toolchain, so
> `xcodebuild` was not run here. Files are complete and internally consistent
> against the blueprint; see the integration notes in the handoff.
