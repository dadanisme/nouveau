import Charts
import ExpoModulesCore
import ExpoUI
import SwiftUI

/// One category's share of a period's spending. The strings come formatted from JS
/// (`utils/category-bar.ts`), so the legend reads the same localized names and percents as VoiceOver.
struct CategoryBarSegment: Record {
  /// A unique key: the category id, or "others".
  @Field var id: String = ""
  /// The legend name, e.g. "Food" or "Others".
  @Field var name: String = ""
  @Field var value: Double = 0
  /// The share as a whole percent, e.g. "34%".
  @Field var shareLabel: String = ""
  @Field var color: Color?
}

public final class CategoryBarChartProps: UIBaseViewProps {
  @Field var segments: [CategoryBarSegment] = []
  /// What VoiceOver reads for the whole chart, e.g. "Spent Rp4.200.000: Food 34%, …".
  @Field var summary: String = ""
}

/// A storage-style category bar (#90), like Settings › General › iPhone Storage: one capsule split
/// into a segment per category, with a gap between segments (HIG charts#Color: "adding separators
/// between the marks can help people distinguish individual ones") and a legend of names and
/// percents below, so color is never the only cue. Swift Charts draws the segments as interval
/// `BarMark`s with no axes; the bar's height and the legend's dots grow with Dynamic Type, and the
/// legend wraps. VoiceOver reads the chart as one element, the `summary`.
public struct CategoryBarChartView: ExpoSwiftUI.View {
  @ObservedObject public var props: CategoryBarChartProps

  /// The capsule's height, like the iPhone Storage bar at the default text size.
  @ScaledMetric(relativeTo: .body) private var barHeight: CGFloat = 16
  @ScaledMetric(relativeTo: .footnote) private var dotSize: CGFloat = 8
  /// The gap that separates two segments.
  private let separatorWidth: CGFloat = 2
  /// The bar's measured width, to turn the separator's points into data units.
  @State private var barWidth: CGFloat = 0

  public init(props: CategoryBarChartProps) {
    self.props = props
  }

  private var total: Double {
    props.segments.reduce(0) { $0 + max($1.value, 0) }
  }

  /// Each segment's interval along the bar, in data units, with half a separator taken off each
  /// inner edge. A segment narrower than the separator keeps its full width rather than vanish.
  private var intervals: [SegmentInterval] {
    let gap = barWidth > 0 ? total * separatorWidth / barWidth : 0
    let last = props.segments.count - 1
    var start = 0.0
    var result: [SegmentInterval] = []
    for (index, segment) in props.segments.enumerated() {
      let end = start + max(segment.value, 0)
      let inset = end - start > gap ? gap / 2 : 0
      result.append(
        SegmentInterval(
          id: segment.id,
          color: color(for: segment),
          start: index == 0 ? start : start + inset,
          end: index == last ? end : end - inset
        )
      )
      start = end
    }
    return result
  }

  private func color(for segment: CategoryBarSegment) -> Color {
    segment.color ?? Color(uiColor: .systemGray)
  }

  public var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      Chart(intervals) { interval in
        BarMark(
          xStart: .value("Start", interval.start),
          xEnd: .value("End", interval.end)
        )
        .foregroundStyle(interval.color)
      }
      .chartXScale(domain: 0...max(total, 1))
      .chartXAxis(.hidden)
      .chartYAxis(.hidden)
      .chartLegend(.hidden)
      .frame(height: barHeight)
      .clipShape(Capsule())
      .onGeometryChange(for: CGFloat.self) { $0.size.width } action: { barWidth = $0 }

      FlowLayout(horizontalSpacing: 14, verticalSpacing: 6) {
        ForEach(props.segments, id: \.id) { segment in
          HStack(spacing: 6) {
            Circle()
              .fill(color(for: segment))
              .frame(width: dotSize, height: dotSize)
            Text(segment.name)
              .foregroundStyle(Color(uiColor: .label))
            Text(segment.shareLabel)
              .foregroundStyle(Color(uiColor: .secondaryLabel))
              .monospacedDigit()
          }
          .font(.footnote)
        }
      }
    }
    .fixedSize(horizontal: false, vertical: true)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(props.summary)
  }
}

/// A segment's place along the bar, in data units.
private struct SegmentInterval: Identifiable {
  let id: String
  let color: Color
  let start: Double
  let end: Double
}

/// Lays its subviews out left to right, wrapping onto a new line when the next one doesn't fit. A
/// subview wider than a line gets the full width, so a long legend name wraps instead of clipping.
private struct FlowLayout: Layout {
  var horizontalSpacing: CGFloat
  var verticalSpacing: CGFloat

  private struct Line {
    var items: [(index: Int, size: CGSize)] = []
    var width: CGFloat = 0
    var height: CGFloat = 0
  }

  private func lines(for subviews: Subviews, maxWidth: CGFloat) -> [Line] {
    var lines: [Line] = []
    var line = Line()
    for (index, subview) in subviews.enumerated() {
      let size = subview.sizeThatFits(ProposedViewSize(width: maxWidth, height: nil))
      let width = line.items.isEmpty ? size.width : line.width + horizontalSpacing + size.width
      if !line.items.isEmpty && width > maxWidth {
        lines.append(line)
        line = Line()
        line.width = size.width
      } else {
        line.width = width
      }
      line.items.append((index, size))
      line.height = max(line.height, size.height)
    }
    if !line.items.isEmpty { lines.append(line) }
    return lines
  }

  func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
    let maxWidth = proposal.width ?? .infinity
    let lines = lines(for: subviews, maxWidth: maxWidth)
    let height = lines.reduce(0) { $0 + $1.height } + verticalSpacing * CGFloat(max(lines.count - 1, 0))
    let width = lines.map(\.width).max() ?? 0
    return CGSize(width: proposal.width ?? width, height: height)
  }

  func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
    var y = bounds.minY
    for line in lines(for: subviews, maxWidth: bounds.width) {
      var x = bounds.minX
      for item in line.items {
        subviews[item.index].place(
          at: CGPoint(x: x, y: y + (line.height - item.size.height) / 2),
          proposal: ProposedViewSize(item.size)
        )
        x += item.size.width + horizontalSpacing
      }
      y += line.height + verticalSpacing
    }
  }
}
