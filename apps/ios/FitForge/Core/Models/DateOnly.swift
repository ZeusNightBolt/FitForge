import Foundation

/// A calendar date with no time component, matching a Postgres `date` column.
///
/// PostgREST serialises `date` as an ISO `yyyy-MM-dd` string; `Date` would drag
/// in a time zone. `DateOnly` round-trips the string form losslessly and offers
/// `Calendar`-based conversions when a `Date` is genuinely needed.
public struct DateOnly: Codable, Hashable, Comparable, Sendable, CustomStringConvertible {
    public var year: Int
    public var month: Int
    public var day: Int

    public init(year: Int, month: Int, day: Int) {
        self.year = year; self.month = month; self.day = day
    }

    public init(_ date: Date, calendar: Calendar = .current) {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        self.year = c.year ?? 1970; self.month = c.month ?? 1; self.day = c.day ?? 1
    }

    public static func today(_ calendar: Calendar = .current) -> DateOnly { DateOnly(Date(), calendar: calendar) }

    public var description: String { String(format: "%04d-%02d-%02d", year, month, day) }

    public func date(in calendar: Calendar = .current) -> Date {
        calendar.date(from: DateComponents(year: year, month: month, day: day)) ?? Date()
    }

    // MARK: Codable ("yyyy-MM-dd")
    public init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        let parts = raw.prefix(10).split(separator: "-")
        guard parts.count == 3, let y = Int(parts[0]), let m = Int(parts[1]), let d = Int(parts[2]) else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath,
                                                    debugDescription: "Invalid date: \(raw)"))
        }
        self.year = y; self.month = m; self.day = d
    }

    public func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        try c.encode(description)
    }

    public static func < (lhs: DateOnly, rhs: DateOnly) -> Bool {
        (lhs.year, lhs.month, lhs.day) < (rhs.year, rhs.month, rhs.day)
    }
}
