Pod::Spec.new do |s|
  s.name           = 'NativeCharts'
  s.version        = '1.0.0'
  s.summary        = 'Swift Charts views for the Nouveau app (#37)'
  s.description    = 'A SwiftUI Chart view that renders inside an @expo/ui Host.'
  s.author         = ''
  s.homepage       = 'https://nouveau.my.id'
  s.platforms      = { :ios => '17.0' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'ExpoUI'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = '**/*.{h,m,swift}'
end
