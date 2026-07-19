import Foundation
import Supabase

// MARK: - Live Supabase repositories
//
// Thin adapters over `supabase-swift`. All user reads/writes rely on RLS
// (BLUEPRINT §4.4) — the client never passes another user's id. Intelligence
// lives behind the §5.3 RPCs; these just call them.

// MARK: Auth

public final class LiveAuthRepository: AuthRepository {
    private let client: SupabaseClient
    public init(client: SupabaseClient) { self.client = client }

    public var authState: AsyncStream<UUID?> {
        AsyncStream { continuation in
            let task = Task {
                for await (_, session) in client.auth.authStateChanges {
                    continuation.yield(session?.user.id)
                }
                continuation.finish()
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    public func currentUserId() async -> UUID? { await client.currentUserId }

    public func signInWithApple(idToken: String, nonce: String) async throws -> UUID {
        let session = try await client.auth.signInWithIdToken(
            credentials: .init(provider: .apple, idToken: idToken, nonce: nonce)
        )
        return session.user.id
    }

    public func signOut() async throws { try await client.auth.signOut() }

    public func deleteAccount() async throws {
        // Edge Function verifies the JWT and service-role-deletes auth.users (§5.4).
        _ = try await client.functions.invoke("delete-account")
        try? await client.auth.signOut()
    }
}

// MARK: Catalog

public final class LiveCatalogRepository: CatalogRepository {
    private let client: SupabaseClient
    public init(client: SupabaseClient) { self.client = client }

    public func allEquipment() async throws -> [Equipment] {
        try await client.from("equipment").select().order("category").order("name").execute().value
    }

    public func allMuscleGroups() async throws -> [MuscleGroup] {
        try await client.from("muscle_groups").select().order("display_order").execute().value
    }

    public func allMuscles() async throws -> [Muscle] {
        try await client.from("muscles").select().order("name").execute().value
    }

    public func allCategories() async throws -> [ExerciseCategory] {
        try await client.from("exercise_categories").select().order("display_order").execute().value
    }

    public func exerciseFull(slug: String) async throws -> ExerciseFull {
        try await client.from("v_exercise_full").select().eq("slug", value: slug).single().execute().value
    }

    public func browseExercises(categorySlug: String?) async throws -> [ExerciseFull] {
        var query = client.from("v_exercise_full").select()
        if let categorySlug {
            query = query.eq("category_slug", value: categorySlug)
        }
        return try await query.order("popularity", ascending: false).execute().value
    }

    public func food(id: UUID) async throws -> Food {
        try await client.from("foods").select().eq("id", value: id).single().execute().value
    }

    public func searchExercises(_ params: SearchExercisesParams) async throws -> [ExerciseSearchResult] {
        try await client.rpc("search_exercises", params: params).execute().value
    }

    public func suggestionChips(experience: ExperienceLevel) async throws -> [ExerciseSearchResult] {
        // Screen 7: empty-query variant, equipment-filtered, top 8 (§7.3).
        let params = SearchExercisesParams(q: "", pLimit: 8, filterEquipment: true, categorySlug: nil)
        return try await client.rpc("search_exercises", params: params).execute().value
    }

    public func suggestSubstitutes(_ params: SuggestSubstitutesParams) async throws -> [SubstituteResult] {
        try await client.rpc("suggest_substitutes", params: params).execute().value
    }
}

// MARK: Onboarding

public final class LiveOnboardingRepository: OnboardingRepository {
    private let client: SupabaseClient
    public init(client: SupabaseClient) { self.client = client }

    private func uid() async throws -> UUID {
        guard let id = await client.currentUserId else { throw RepositoryError.notAuthenticated }
        return id
    }

    public func loadProfile() async throws -> Profile {
        let id = try await uid()
        return try await client.from("profiles").select().eq("id", value: id).single().execute().value
    }

    public func patchProfile(_ patch: ProfilePatch) async throws -> Profile {
        let id = try await uid()
        return try await client.from("profiles")
            .update(patch)
            .eq("id", value: id)
            .select()
            .single()
            .execute()
            .value
    }

    public func setEquipment(slugs: [String]) async throws {
        // Transactional replace via RPC (§5.3 set_user_equipment).
        try await client.rpc("set_user_equipment", params: SetUserEquipmentParams(equipmentSlugs: slugs)).execute()
    }

    public func loadUserEquipmentSlugs() async throws -> [String] {
        let id = try await uid()
        struct Row: Decodable { let equipment: EqSlug; struct EqSlug: Decodable { let slug: String } }
        let rows: [Row] = try await client.from("user_equipment")
            .select("equipment(slug)")
            .eq("user_id", value: id)
            .execute()
            .value
        return rows.map(\.equipment.slug)
    }

    public func upsertExercisePreferences(_ prefs: [UserExercisePreference]) async throws {
        guard !prefs.isEmpty else { return }
        let id = try await uid()
        // Stamp the authenticated user id so the row satisfies RLS
        // (`with check (user_id = auth.uid())`) — the view model uses a placeholder.
        let rows = prefs.map {
            UserExercisePreference(userId: id, exerciseId: $0.exerciseId, preference: $0.preference,
                                   exclusionReason: $0.exclusionReason, preferredSubstituteId: $0.preferredSubstituteId)
        }
        try await client.from("user_exercise_preferences")
            .upsert(rows, onConflict: "user_id,exercise_id")
            .execute()
    }

    public func upsertMovementExclusions(_ rows: [UserMovementExclusion]) async throws {
        guard !rows.isEmpty else { return }
        let id = try await uid()
        let stamped = rows.map {
            UserMovementExclusion(userId: id, movementPattern: $0.movementPattern,
                                  reason: $0.reason, sourceBodyArea: $0.sourceBodyArea)
        }
        try await client.from("user_movement_exclusions")
            .upsert(stamped, onConflict: "user_id,movement_pattern")
            .execute()
    }

    public func upsertNutritionProfile(_ profile: NutritionProfile) async throws {
        let id = try await uid()
        var stamped = profile
        stamped.userId = id
        try await client.from("nutrition_profiles")
            .upsert(stamped, onConflict: "user_id")
            .execute()
    }

    public func suggestDefaults(_ params: SuggestDefaultsParams) async throws -> OnboardingDefaults {
        try await client.rpc("suggest_onboarding_defaults", params: params).execute().value
    }

    public func suggestNutritionTargets() async throws -> NutritionTargets {
        try await client.rpc("suggest_nutrition_targets").execute().value
    }

    public func onboardingStatus() async throws -> OnboardingStatus {
        try await client.rpc("onboarding_status").execute().value
    }

    public func generateStarterRoutine(name: String?) async throws -> UUID {
        try await client.rpc("generate_starter_routine", params: GenerateRoutineParams(pName: name)).execute().value
    }
}

// MARK: Routines

public final class LiveRoutineRepository: RoutineRepository {
    private let client: SupabaseClient
    public init(client: SupabaseClient) { self.client = client }

    private static let treeSelect =
        "*,routine_days(*,routine_exercises(*,exercises(name,slug,image_path)))"

    public func activeRoutine() async throws -> RoutineTree? {
        let rows: [RoutineTree] = try await client.from("routines")
            .select(Self.treeSelect)
            .eq("is_active", value: true)
            .execute()
            .value
        return rows.first
    }

    public func allRoutines() async throws -> [Routine] {
        try await client.from("routines").select().order("created_at", ascending: false).execute().value
    }

    public func routineTree(id: UUID) async throws -> RoutineTree {
        try await client.from("routines")
            .select(Self.treeSelect)
            .eq("id", value: id)
            .single()
            .execute()
            .value
    }

    public func updateRoutineExercise(_ row: RoutineExercise) async throws {
        // Only the mutable prescription columns — never the id / FK.
        struct Patch: Encodable {
            let position: Int
            let sets: Int
            let rep_min: Int
            let rep_max: Int
            let target_rpe: Double?
            let rest_seconds: Int
            let superset_group: Int?
            let notes: String?
        }
        let patch = Patch(position: row.position, sets: row.sets, rep_min: row.repMin,
                          rep_max: row.repMax, target_rpe: row.targetRpe, rest_seconds: row.restSeconds,
                          superset_group: row.supersetGroup, notes: row.notes)
        try await client.from("routine_exercises").update(patch).eq("id", value: row.id).execute()
    }

    public func activate(routineId: UUID) async throws {
        guard let uid = await client.currentUserId else { throw RepositoryError.notAuthenticated }
        // Deactivate all, then activate one (the partial unique index enforces ≤1 active).
        struct ActiveFlag: Encodable { let is_active: Bool }
        try await client.from("routines").update(ActiveFlag(is_active: false)).eq("user_id", value: uid).execute()
        try await client.from("routines").update(ActiveFlag(is_active: true)).eq("id", value: routineId).execute()
    }
}

// MARK: Workouts

public final class LiveWorkoutRepository: WorkoutRepository {
    private let client: SupabaseClient
    public init(client: SupabaseClient) { self.client = client }

    private func uid() async throws -> UUID {
        guard let id = await client.currentUserId else { throw RepositoryError.notAuthenticated }
        return id
    }

    public func startSession(routineDayId: UUID?) async throws -> WorkoutSession {
        let id = try await uid()
        struct NewSession: Encodable {
            let user_id: UUID
            let routine_day_id: UUID?
        }
        return try await client.from("workout_sessions")
            .insert(NewSession(user_id: id, routine_day_id: routineDayId))
            .select()
            .single()
            .execute()
            .value
    }

    public func previousSets(exerciseId: UUID) async throws -> [PreviousSet] {
        try await client.rpc("previous_sets", params: PreviousSetsParams(pExerciseId: exerciseId)).execute().value
    }

    public func logSet(_ set: SetLog) async throws -> SetLog {
        try await client.from("set_logs").insert(set).select().single().execute().value
    }

    public func completeSession(id: UUID, perceivedEffort: Int?, notes: String?) async throws {
        struct Complete: Encodable { let completed_at: Date; let perceived_effort: Int?; let notes: String? }
        try await client.from("workout_sessions")
            .update(Complete(completed_at: Date(), perceived_effort: perceivedEffort, notes: notes))
            .eq("id", value: id)
            .execute()
    }

    public func recentSessions(limit: Int) async throws -> [WorkoutSession] {
        let id = try await uid()
        return try await client.from("workout_sessions")
            .select()
            .eq("user_id", value: id)
            .order("started_at", ascending: false)
            .limit(limit)
            .execute()
            .value
    }
}

// MARK: Nutrition

public final class LiveNutritionRepository: NutritionRepository {
    private let client: SupabaseClient
    public init(client: SupabaseClient) { self.client = client }

    private func uid() async throws -> UUID {
        guard let id = await client.currentUserId else { throw RepositoryError.notAuthenticated }
        return id
    }

    public func searchFoods(_ params: SearchFoodsParams) async throws -> [FoodSearchResult] {
        try await client.rpc("search_foods", params: params).execute().value
    }

    public func logFood(_ params: LogFoodParams) async throws -> UUID {
        try await client.rpc("log_food", params: params).execute().value
    }

    public func quickAdd(_ log: NutritionLog) async throws -> NutritionLog {
        var stamped = log
        stamped.userId = try await uid()   // satisfy RLS
        return try await client.from("nutrition_logs").insert(stamped).select().single().execute().value
    }

    public func logs(on day: DateOnly) async throws -> [NutritionLog] {
        let id = try await uid()
        return try await client.from("nutrition_logs")
            .select()
            .eq("user_id", value: id)
            .eq("logged_on", value: day.description)
            .order("created_at")
            .execute()
            .value
    }

    public func dailyTotals(on day: DateOnly) async throws -> DailyNutrition? {
        let id = try await uid()
        let rows: [DailyNutrition] = try await client.from("v_daily_nutrition")
            .select()
            .eq("user_id", value: id)
            .eq("logged_on", value: day.description)
            .execute()
            .value
        return rows.first
    }

    public func deleteLog(id: UUID) async throws {
        try await client.from("nutrition_logs").delete().eq("id", value: id).execute()
    }

    public func nutritionProfile() async throws -> NutritionProfile? {
        let id = try await uid()
        let rows: [NutritionProfile] = try await client.from("nutrition_profiles")
            .select()
            .eq("user_id", value: id)
            .execute()
            .value
        return rows.first
    }
}

// MARK: Progress

public final class LiveProgressRepository: ProgressRepository {
    private let client: SupabaseClient
    public init(client: SupabaseClient) { self.client = client }

    private func uid() async throws -> UUID {
        guard let id = await client.currentUserId else { throw RepositoryError.notAuthenticated }
        return id
    }

    public func bodyMetrics(limit: Int) async throws -> [BodyMetric] {
        let id = try await uid()
        return try await client.from("body_metrics")
            .select()
            .eq("user_id", value: id)
            .order("measured_on", ascending: false)
            .limit(limit)
            .execute()
            .value
    }

    public func upsertBodyMetric(_ metric: BodyMetric) async throws -> BodyMetric {
        var stamped = metric
        stamped.userId = try await uid()   // satisfy RLS
        return try await client.from("body_metrics")
            .upsert(stamped, onConflict: "user_id,measured_on")
            .select()
            .single()
            .execute()
            .value
    }

    public func personalRecords() async throws -> [ExercisePR] {
        let id = try await uid()
        return try await client.from("v_exercise_prs")
            .select()
            .eq("user_id", value: id)
            .order("best_e1rm", ascending: false)
            .execute()
            .value
    }

    public func progressPhotos() async throws -> [ProgressPhoto] {
        let id = try await uid()
        return try await client.from("progress_photos")
            .select()
            .eq("user_id", value: id)
            .order("taken_on", ascending: false)
            .execute()
            .value
    }

    public func uploadPhoto(jpeg: Data, pose: PhotoPose, takenOn: DateOnly) async throws -> ProgressPhoto {
        let id = try await uid()
        let path = "\(id.uuidString.lowercased())/\(UUID().uuidString.lowercased()).jpg"
        try await client.storage
            .from(AppConfig.progressPhotosBucket)
            .upload(path, data: jpeg, options: FileOptions(contentType: "image/jpeg", upsert: false))
        struct NewPhoto: Encodable {
            let user_id: UUID
            let taken_on: String
            let pose: PhotoPose
            let storage_path: String
        }
        return try await client.from("progress_photos")
            .insert(NewPhoto(user_id: id, taken_on: takenOn.description, pose: pose, storage_path: path))
            .select()
            .single()
            .execute()
            .value
    }

    public func signedURL(for photo: ProgressPhoto) async throws -> URL {
        try await client.storage
            .from(AppConfig.progressPhotosBucket)
            .createSignedURL(path: photo.storagePath, expiresIn: 3600)
    }
}
