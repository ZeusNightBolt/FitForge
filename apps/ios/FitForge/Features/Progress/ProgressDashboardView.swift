import SwiftUI
import Charts
import PhotosUI

/// Progress tab (§2.3): weight & measurement charts (Swift Charts), PR list
/// (best e1RM per exercise), and a photo timeline uploading to `progress-photos`.
struct ProgressDashboardView: View {
    @Environment(\.appEnvironment) private var env
    @State private var metrics: [BodyMetric] = []
    @State private var prs: [ExercisePR] = []
    @State private var photos: [ProgressPhoto] = []
    @State private var showLogWeight = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: Spacing.l) {
                    weightChartCard
                    measurementCard
                    prCard
                    photoCard
                }
                .ffScreenPadding()
                .padding(.vertical, Spacing.l)
            }
            .background(Palette.background)
            .navigationTitle("Progress")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { showLogWeight = true } label: { Image(systemName: "plus") }
                }
            }
        }
        .sheet(isPresented: $showLogWeight) {
            LogBodyMetricView { await load() }
        }
        .task { await load() }
    }

    private var chartData: [BodyMetric] { metrics.sorted { $0.measuredOn < $1.measuredOn } }

    @ViewBuilder private var weightChartCard: some View {
        VStack(alignment: .leading, spacing: Spacing.m) {
            Text("Body weight").ffSectionHeader()
            if chartData.filter({ $0.weightKg != nil }).count >= 2 {
                Chart(chartData.filter { $0.weightKg != nil }) { m in
                    LineMark(x: .value("Date", m.measuredOn.date()),
                             y: .value("kg", m.weightKg ?? 0))
                        .foregroundStyle(Palette.accent)
                        .interpolationMethod(.catmullRom)
                    PointMark(x: .value("Date", m.measuredOn.date()),
                              y: .value("kg", m.weightKg ?? 0))
                        .foregroundStyle(Palette.accent)
                }
                .frame(height: 180)
            } else {
                Text("Log at least two weigh-ins to see a chart.").font(.ffFootnote).foregroundStyle(Palette.textSecondary)
            }
        }
        .ffCard()
    }

    @ViewBuilder private var measurementCard: some View {
        VStack(alignment: .leading, spacing: Spacing.m) {
            Text("Waist").ffSectionHeader()
            let waist = chartData.filter { $0.waistCm != nil }
            if waist.count >= 2 {
                Chart(waist) { m in
                    LineMark(x: .value("Date", m.measuredOn.date()), y: .value("cm", m.waistCm ?? 0))
                        .foregroundStyle(Palette.carbs)
                }
                .frame(height: 120)
            } else {
                Text("Track measurements to compare over time.").font(.ffFootnote).foregroundStyle(Palette.textSecondary)
            }
        }
        .ffCard()
    }

    @ViewBuilder private var prCard: some View {
        VStack(alignment: .leading, spacing: Spacing.m) {
            Text("Personal records").ffSectionHeader()
            if prs.isEmpty {
                Text("Log some workouts to build your PR list.").font(.ffFootnote).foregroundStyle(Palette.textSecondary)
            } else {
                ForEach(prs) { pr in
                    HStack {
                        Text(pr.exerciseName).font(.ffSubheadline)
                        Spacer()
                        VStack(alignment: .trailing, spacing: 0) {
                            Text(String(format: "%.0f kg", pr.bestWeightKg)).font(.ffSubheadline.monospacedDigit())
                            Text(String(format: "e1RM %.0f", pr.bestE1rm)).font(.ffCaption).foregroundStyle(Palette.textSecondary)
                        }
                    }
                    if pr.id != prs.last?.id { Divider() }
                }
            }
        }
        .ffCard()
    }

    @ViewBuilder private var photoCard: some View {
        VStack(alignment: .leading, spacing: Spacing.m) {
            HStack {
                Text("Photos").ffSectionHeader()
                Spacer()
                PhotoUploadButton { await load() }
            }
            if photos.isEmpty {
                Text("Add a progress photo to start your timeline.").font(.ffFootnote).foregroundStyle(Palette.textSecondary)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: Spacing.s) {
                        ForEach(photos) { photo in
                            RemotePhotoThumb(photo: photo)
                        }
                    }
                }
            }
        }
        .ffCard()
    }

    private func load() async {
        metrics = (try? await env.progress.bodyMetrics(limit: 60)) ?? []
        prs = (try? await env.progress.personalRecords()) ?? []
        photos = (try? await env.progress.progressPhotos()) ?? []
    }
}

/// A signed-URL-backed thumbnail for a stored progress photo.
struct RemotePhotoThumb: View {
    let photo: ProgressPhoto
    @Environment(\.appEnvironment) private var env
    @State private var url: URL?

    var body: some View {
        VStack(spacing: 4) {
            AsyncImage(url: url) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                RoundedRectangle(cornerRadius: Radius.s).fill(Palette.surfaceElevated)
            }
            .frame(width: 96, height: 128)
            .clipShape(RoundedRectangle(cornerRadius: Radius.s, style: .continuous))
            Text(photo.pose.displayName).font(.ffCaption).foregroundStyle(Palette.textSecondary)
        }
        .task { url = try? await env.progress.signedURL(for: photo) }
    }
}

/// PhotosPicker-driven upload button.
struct PhotoUploadButton: View {
    let onUploaded: () async -> Void
    @Environment(\.appEnvironment) private var env
    @State private var item: PhotosPickerItem?
    @State private var uploading = false

    var body: some View {
        PhotosPicker(selection: $item, matching: .images) {
            if uploading { ProgressView() } else { Image(systemName: "camera.fill").foregroundStyle(Palette.accent) }
        }
        .onChange(of: item) { _, newItem in
            guard let newItem else { return }
            uploading = true
            Task {
                if let data = try? await newItem.loadTransferable(type: Data.self) {
                    _ = try? await env.progress.uploadPhoto(jpeg: data, pose: .front, takenOn: .today())
                    await onUploaded()
                }
                uploading = false; item = nil
            }
        }
    }
}

#Preview("Progress") {
    ProgressDashboardView().environment(\.appEnvironment, .preview())
}
