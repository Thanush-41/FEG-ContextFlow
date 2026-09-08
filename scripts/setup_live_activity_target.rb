#!/usr/bin/env ruby

require 'xcodeproj'

project_path = File.expand_path('../ios/FEGContextFlow.xcodeproj', __dir__)
project = Xcodeproj::Project.open(project_path)
app_target = project.targets.find { |target| target.name == 'FEGContextFlow' }
abort 'FEGContextFlow app target not found' unless app_target

extension_target = project.targets.find { |target| target.name == 'CounterLiveActivity' }
extension_target ||= project.new_target(
  :app_extension,
  'CounterLiveActivity',
  :ios,
  '16.2'
)

def file_reference(group, path)
  filename = File.basename(path)
  reference = group.files.find { |file| File.basename(file.path.to_s) == filename }
  reference ||= group.new_file(path)
  reference.path = path
  reference.name = filename
  reference
end

def add_source(target, reference)
  return if target.source_build_phase.files_references.include?(reference)

  target.source_build_phase.add_file_reference(reference)
end

shared_group = project.main_group.find_subpath('Shared', true)
app_group = project.main_group.find_subpath('FEGContextFlow', false)
extension_group = project.main_group.find_subpath('CounterLiveActivity', true)

shared_attributes = file_reference(shared_group, 'Shared/CounterActivityAttributes.swift')
bridge_swift = file_reference(app_group, 'FEGContextFlow/CounterLiveActivityModule.swift')
bridge_objc = file_reference(app_group, 'FEGContextFlow/CounterLiveActivityModule.m')
widget_bundle = file_reference(extension_group, 'CounterLiveActivity/CounterLiveActivityBundle.swift')
widget_view = file_reference(extension_group, 'CounterLiveActivity/CounterLiveActivityWidget.swift')
home_widget = file_reference(extension_group, 'CounterLiveActivity/CounterHomeWidget.swift')
file_reference(extension_group, 'CounterLiveActivity/Info.plist')
file_reference(extension_group, 'CounterLiveActivity/CounterLiveActivity.entitlements')
file_reference(app_group, 'FEGContextFlow/FEGContextFlow.entitlements')

add_source(app_target, shared_attributes)
add_source(app_target, bridge_swift)
add_source(app_target, bridge_objc)
add_source(extension_target, shared_attributes)
add_source(extension_target, widget_bundle)
add_source(extension_target, widget_view)
add_source(extension_target, home_widget)

frameworks = project.frameworks_group
framework_names = %w[ActivityKit WidgetKit SwiftUI UserNotifications]
framework_names.each do |name|
  path = "System/Library/Frameworks/#{name}.framework"
  reference = frameworks.files.find { |file| file.path == path }
  reference ||= frameworks.new_file(path)
  extension_target.frameworks_build_phase.add_file_reference(reference, true) unless
    extension_target.frameworks_build_phase.files_references.include?(reference)
end

activity_kit = frameworks.files.find do |file|
  file.path == 'System/Library/Frameworks/ActivityKit.framework'
end
app_target.frameworks_build_phase.add_file_reference(activity_kit, true) unless
  app_target.frameworks_build_phase.files_references.include?(activity_kit)

%w[WidgetKit UserNotifications].each do |name|
  reference = frameworks.files.find do |file|
    file.path == "System/Library/Frameworks/#{name}.framework"
  end
  app_target.frameworks_build_phase.add_file_reference(reference, true) unless
    app_target.frameworks_build_phase.files_references.include?(reference)
end

app_target.build_configurations.each do |config|
  config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'FEGContextFlow/FEGContextFlow.entitlements'
end

team = app_target.build_configurations
                 .map { |config| config.build_settings['DEVELOPMENT_TEAM'] }
                 .compact
                 .first

extension_target.build_configurations.each do |config|
  settings = config.build_settings
  settings['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
  settings['CODE_SIGN_STYLE'] = 'Automatic'
  settings['CODE_SIGN_ENTITLEMENTS'] = 'CounterLiveActivity/CounterLiveActivity.entitlements'
  settings['CURRENT_PROJECT_VERSION'] = '1'
  settings['DEVELOPMENT_TEAM'] = team if team
  settings['GENERATE_INFOPLIST_FILE'] = 'NO'
  settings['INFOPLIST_FILE'] = 'CounterLiveActivity/Info.plist'
  settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.2'
  settings['LD_RUNPATH_SEARCH_PATHS'] = '$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks'
  settings['MARKETING_VERSION'] = '1.0'
  settings['PRODUCT_BUNDLE_IDENTIFIER'] = 'com.fegcontextflow.counter.liveactivity'
  settings['PRODUCT_NAME'] = '$(TARGET_NAME)'
  settings['SKIP_INSTALL'] = 'YES'
  settings['SWIFT_VERSION'] = '5.0'
  settings['TARGETED_DEVICE_FAMILY'] = '1,2'
end

unless app_target.dependencies.any? { |dependency| dependency.target == extension_target }
  app_target.add_dependency(extension_target)
end

embed_phase = app_target.copy_files_build_phases.find do |phase|
  phase.name == 'Embed App Extensions'
end
embed_phase ||= app_target.new_copy_files_build_phase('Embed App Extensions')
embed_phase.dst_subfolder_spec = '13'
unless embed_phase.files_references.include?(extension_target.product_reference)
  embed_phase.add_file_reference(extension_target.product_reference, true)
end

project.save
puts 'CounterLiveActivity extension target is configured.'
