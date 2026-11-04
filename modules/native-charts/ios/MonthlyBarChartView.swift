import Charts
import ExpoModulesCore
import ExpoUI
import SwiftUI

/// One month's bar. The strings come formatted from JS (`utils/monthly-chart.ts`), so the chart,
/// VoiceOver and Audio Graphs read the same localized amounts as the rest of the app.
struct MonthlyBar: Record {
  /// A unique category key for the x scale (the month index).
  @Field var id: String = ""
  /// The visible x-axis label, e.g. "J".
  @Field var axisLabel: String = ""
  /// The full month name, e.g. "January" (Audio Graphs categories).
  @Field var name: String = ""
  /// What VoiceOver reads for the bar, e.g. "January" or "November, This Month".
  @Field var accessibilityLabel: String = ""
  @Field var value: Double = 0
  /// The full amount, e.g. "Rp1.500.000".
  @Field var valueLabel: String = ""
  @Field var isHighlighted: Bool = false
}

/// A y-axis tick and its compact label, e.g. 500000 and "Rp500K".
struct AxisTick: Record {
  @Field var value: Double = 0
  @Field var label: String = ""
}

public final class MonthlyBarChartProps: UIBaseViewProps {
  @Field var bars: [MonthlyBar] = []
  @Field var ticks: [AxisTick] = []
  @Field var barColor: Color?
  @Field var highlightColor: Color?
  /// Audio Graphs title and summary, and the axis titles.
  @Field var title: String = ""
  @Field var summary: String = ""
  @Field var xAxisTitle: String = ""
  @Field var yAxisTitle: String = ""
  /// At the accessibility text sizes (from JS, `useIsAccessibilityTextSize`) the axes thin out.
  @Field var isAccessibilitySize: Bool = false
}

/// A Swift Charts bar chart of a year's monthly totals (#37). Bars start at zero, the y axis sits
/// on the trailing side with a few compact ticks, and one bar (the current month) can take the
/// accent. Every bar has a VoiceOver label and value, and the chart has an Audio Graph. No custom
/// animation, so Reduce Motion needs nothing extra.
public struct MonthlyBarChartView: ExpoSwiftUI.View {
  @ObservedObject public var props: MonthlyBarChartProps
  @Environment(\.colorScheme) private var colorScheme
  @Environment(\.colorSchemeContrast) private var colorSchemeContrast

  /// The plot's own height; the axis labels add theirs, so text never shrinks the bars.
  private var plotHeight: CGFloat { props.isAccessibilitySize ? 200 : 160 }

  public init(props: MonthlyBarChartProps) {
    self.props = props
  }

  private var upperBound: Double {
    max(props.ticks.map(\.value).max() ?? 0, props.bars.map(\.value).max() ?? 0, 1)
  }

  private var barColor: Color { props.barColor ?? Color(uiColor: .systemGray2) }
  private var highlightColor: Color { props.highlightColor ?? .accentColor }

  /// Every month at standard sizes; at accessibility sizes every third month, counted from the
  /// highlighted one so it keeps its bold label (color isn't its only cue), and the larger labels fit
  /// without overlapping (HIG: reduce the number of columns as text grows).
  private var labeledIds: Set<String> {
    guard props.isAccessibilitySize else { return Set(props.bars.map(\.id)) }
    let anchor = props.bars.firstIndex { $0.isHighlighted } ?? 0
    return Set(props.bars.enumerated().filter { ($0.offset - anchor) % 3 == 0 }.map(\.element.id))
  }

  /// All ticks at standard sizes; at accessibility sizes zero and the upper bound, so the larger
  /// labels neither collide nor take the plot's width.
  private var axisTicks: [Double] {
    let values = props.ticks.map(\.value)
    guard props.isAccessibilitySize, values.count > 2, let first = values.first, let last = values.last
    else { return values }
    return [first, last]
  }

  private func bar(for id: String?) -> MonthlyBar? {
    props.bars.first { $0.id == id }
  }

  private func tickLabel(for value: Double?) -> String {
    props.ticks.first { $0.value == value }?.label ?? ""
  }

  public var body: some View {
    Chart(props.bars, id: \.id) { bar in
      BarMark(
        x: .value(props.xAxisTitle, bar.id),
        y: .value(props.yAxisTitle, bar.value)
      )
      .foregroundStyle(bar.isHighlighted ? highlightColor : barColor)
      .cornerRadius(4)
      .accessibilityLabel(bar.accessibilityLabel)
      .accessibilityValue(bar.valueLabel)
    }
    .chartXScale(domain: props.bars.map(\.id))
    .chartYScale(domain: 0...upperBound)
    .chartXAxis {
      // A categorical axis marks every category, so the skipped months get an empty label.
      AxisMarks { value in
        let bar = bar(for: value.as(String.self))
        AxisValueLabel {
          Text(bar.map { labeledIds.contains($0.id) ? $0.axisLabel : "" } ?? "")
            .font(.caption)
            .fontWeight(bar?.isHighlighted == true ? .bold : .regular)
            .foregroundStyle(bar?.isHighlighted == true ? Color(uiColor: .label) : Color(uiColor: .secondaryLabel))
        }
      }
    }
    .chartYAxis {
      AxisMarks(position: .trailing, values: axisTicks) { value in
        AxisGridLine()
        AxisValueLabel {
          Text(tickLabel(for: value.as(Double.self)))
            .font(.caption)
            .foregroundStyle(Color(uiColor: .secondaryLabel))
        }
      }
    }
    .chartPlotStyle { plot in
      plot.frame(height: plotHeight)
    }
    .fixedSize(horizontal: false, vertical: true)
    // The y-axis labels keep the colors of the appearance they were first drawn in (seen on
    // iOS 27 after a live light-to-dark switch), so rebuild the chart when the appearance changes.
    .id("\(colorScheme)-\(colorSchemeContrast)")
    .accessibilityChartDescriptor(self)
  }
}

extension MonthlyBarChartView: AXChartDescriptorRepresentable {
  public func makeChartDescriptor() -> AXChartDescriptor {
    let bars = props.bars
    let ticks = props.ticks
    let xAxis = AXCategoricalDataAxisDescriptor(
      title: props.xAxisTitle,
      categoryOrder: bars.map(\.name)
    )
    let yAxis = AXNumericDataAxisDescriptor(
      title: props.yAxisTitle,
      range: 0...upperBound,
      gridlinePositions: ticks.map(\.value)
    ) { value in
      bars.first { $0.value == value }?.valueLabel
        ?? ticks.first { $0.value == value }?.label
        ?? value.formatted()
    }
    let series = AXDataSeriesDescriptor(
      name: props.yAxisTitle,
      isContinuous: false,
      dataPoints: bars.map { AXDataPoint(x: $0.name, y: $0.value, label: $0.valueLabel) }
    )
    return AXChartDescriptor(
      title: props.title,
      summary: props.summary,
      xAxis: xAxis,
      yAxis: yAxis,
      additionalAxes: [],
      series: [series]
    )
  }
}
