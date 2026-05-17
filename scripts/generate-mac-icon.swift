import AppKit
import Foundation

let arguments = CommandLine.arguments

guard arguments.count == 3 else {
  FileHandle.standardError.write(Data("Usage: swift scripts/generate-mac-icon.swift <source.png> <output.icns>\n".utf8))
  exit(1)
}

let sourceURL = URL(fileURLWithPath: arguments[1])
let outputURL = URL(fileURLWithPath: arguments[2])
let iconsetURL = outputURL.deletingPathExtension().appendingPathExtension("iconset")
let fileManager = FileManager.default

guard let sourceImage = NSImage(contentsOf: sourceURL) else {
  FileHandle.standardError.write(Data("Failed to read source image: \(sourceURL.path)\n".utf8))
  exit(1)
}

try? fileManager.removeItem(at: iconsetURL)
try fileManager.createDirectory(at: iconsetURL, withIntermediateDirectories: true)
try fileManager.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)

let icons: [(name: String, pixels: Int)] = [
  ("icon_16x16.png", 16),
  ("icon_16x16@2x.png", 32),
  ("icon_32x32.png", 32),
  ("icon_32x32@2x.png", 64),
  ("icon_128x128.png", 128),
  ("icon_128x128@2x.png", 256),
  ("icon_256x256.png", 256),
  ("icon_256x256@2x.png", 512),
  ("icon_512x512.png", 512),
  ("icon_512x512@2x.png", 1024),
]

func writePNG(name: String, pixels: Int) throws {
  guard
    let bitmap = NSBitmapImageRep(
      bitmapDataPlanes: nil,
      pixelsWide: pixels,
      pixelsHigh: pixels,
      bitsPerSample: 8,
      samplesPerPixel: 4,
      hasAlpha: true,
      isPlanar: false,
      colorSpaceName: .deviceRGB,
      bytesPerRow: 0,
      bitsPerPixel: 0
    )
  else {
    throw NSError(domain: "IconGeneration", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to create bitmap"])
  }

  bitmap.size = NSSize(width: pixels, height: pixels)

  guard let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
    throw NSError(domain: "IconGeneration", code: 2, userInfo: [NSLocalizedDescriptionKey: "Failed to create graphics context"])
  }

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = context
  NSColor.clear.setFill()
  NSRect(x: 0, y: 0, width: pixels, height: pixels).fill()
  sourceImage.draw(
    in: NSRect(x: 0, y: 0, width: pixels, height: pixels),
    from: NSRect(origin: .zero, size: sourceImage.size),
    operation: .sourceOver,
    fraction: 1
  )
  NSGraphicsContext.restoreGraphicsState()

  guard let data = bitmap.representation(using: .png, properties: [:]) else {
    throw NSError(domain: "IconGeneration", code: 3, userInfo: [NSLocalizedDescriptionKey: "Failed to encode PNG"])
  }

  try data.write(to: iconsetURL.appendingPathComponent(name))
}

for icon in icons {
  try writePNG(name: icon.name, pixels: icon.pixels)
}

let process = Process()
process.executableURL = URL(fileURLWithPath: "/usr/bin/iconutil")
process.arguments = ["--convert", "icns", "--output", outputURL.path, iconsetURL.path]
try process.run()
process.waitUntilExit()

if process.terminationStatus != 0 {
  exit(process.terminationStatus)
}
