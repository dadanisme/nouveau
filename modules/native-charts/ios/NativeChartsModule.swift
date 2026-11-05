import ExpoModulesCore
import ExpoUI

public final class NativeChartsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeCharts")

    // A SwiftUI view for an @expo/ui `Host` tree (e.g. a `Form` row), like `@expo/ui`'s own views.
    ExpoUIView(MonthlyBarChartView.self)
    ExpoUIView(CategoryBarChartView.self)
  }
}
