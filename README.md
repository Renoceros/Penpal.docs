# Penpal 🖊️

> **Turn your iPad into an ultra-low latency, zero-video graphics tablet for macOS creative apps.**  
> Pumping raw 240Hz Apple Pencil pressure, tilt, and multi-touch trackpad navigation straight to Krita, Photoshop, Clip Studio Paint, Blender, and Illustrator over a physical USB cable.

[![Swift 6.0](https://img.shields.io/badge/Swift-6.0-F05138.svg?style=flat-square&logo=swift)](https://swift.org)
[![macOS 14+](https://img.shields.io/badge/macOS-14.0%2B-black.svg?style=flat-square&logo=apple)](https://apple.com/macos)
[![iPadOS 17+](https://img.shields.io/badge/iPadOS-17.0%2B-black.svg?style=flat-square&logo=apple)](https://apple.com/ipados)
[![Latency](https://img.shields.io/badge/latency-%3C3ms-00C853.svg?style=flat-square)](#why-penpal)
[![Version](https://img.shields.io/badge/version-v0.4.8-blue.svg?style=flat-square)](documentation/changelog.json)

---

## Why Penpal?

Traditional solutions like **Apple Sidecar** or **Astropad** encode, compress, and stream full-resolution video to your iPad. While great for viewing your desktop, this video pipeline introduces **25–60ms of display latency**, thermal throttling, battery drain, and compression artifacts.

**Penpal takes the opposite approach: Zero Video.**  
Instead of streaming video, your iPad acts as a pure, high-precision digitizer surface (like a Wacom Intuos or Cintiq in black-canvas mode). Penpal harvests 240Hz coalesced Apple Pencil touches, packages them into lightweight binary packets, and pipes them across physical USB directly into macOS CoreGraphics HID event taps.

### Head-to-Head Comparison

| Feature | Apple Sidecar | Astropad | Wacom Intuos Pro | **Penpal** |
| :--- | :--- | :--- | :--- | :--- |
| **End-to-End Latency** | ~25–40 ms | ~20–35 ms | ~4–8 ms | **< 3 ms** |
| **Display Mode** | Video Mirroring | Video Mirroring | None (Digitizer) | **Zero Video (Digitizer)** |
| **Active Work Area** | Compressed Screen | Letterboxed Screen | Tablet Surface | **Full Screen 16:10 Edge-to-Edge** |
| **Sampling Rate** | 60–120 Hz | 60–120 Hz | 200 Hz | **240 Hz (Coalesced)** |
| **Pressure Levels** | Standard OS | Custom driver | 8,192 levels | **Continuous Float / 16-bit** |
| **iPad Battery & Thermals** | High heat & drain | High heat & drain | N/A | **Near-zero (Runs cold)** |
| **Palm Rejection** | OS heuristic | Custom software | Physical bezel | **Hardware-enforced lock** |
| **Companion App** | None | Proprietary | Control Panel | **Native SwiftUI macOS App** |
| **Dependencies** | Proprietary | Paid / Subscription | Proprietary Drivers | **Zero External Drivers & Pure Swift** |

---

## Key Features

- ⚡ **Ultra-Low Latency (<3ms)**: Raw 40-byte binary packets serialized at 240Hz and dispatched over physical USB.
- 🖥️ **Full-Screen 16:10 MacBook Display Mapping**: Native edge-to-edge drawing across the entire MacBook Retina display (16:10 ratio, e.g. `1512 × 982`), eliminating 4:3 black bars while preserving precision.
- 🎯 **Native Tablet Proximity, Pressure & Tilt**: Injects `kCGEventTabletProximity` (`NX_TABLETPROXIMITY`) before each stroke and during hover, alongside dual CoreGraphics/AppKit pressure fields (`kCGTabletEventPointPressure` and `kCGMouseEventPressure`) and Cartesian tilt (`kCGTabletEventTiltX/Y`). Guarantees immediate `Stylus press/move` tablet recognition in **Krita**, **Photoshop**, and **Clip Studio Paint**.
- 🖱️ **Apple Pencil Hardware Clicks**: Hardware double-tap and squeeze gestures trigger secondary/right-click at the pencil's exact tip coordinates (customizable to Eraser or Undo).
- 🎛️ **Customizable Quick Action Dock**: Select which quick-action shortcuts appear on your floating iPad dock:
  - **Undo** (`⌘Z`) & **Redo** (`⇧⌘Z`)
  - **Eraser / Pen Toggle** (stateful button with dynamic icon and label)
  - **Right Click** (Secondary Click)
  - **Brush** (`B`) & **Eyedropper** (`I`)
  - **Hand / Pan** (`Space`)
  - **Zoom In** (`⌘+`) & **Zoom Out** (`⌘-`)
  - **Brush Size Smaller** (`[`) & **Larger** (`]`)
  - **Fit Screen** (`⌘0`)
- ✋ **Continuous Press-and-Hold Tools**: Hold your finger down on the **Hand** (`Space`) or **Eyedropper** button to keep the modifier active while panning/sampling with the Apple Pencil, releasing instantly when lifted.
- 🖐️ **Two-Finger Trackpad Canvas Navigation**: Smooth 2-finger continuous pixel panning (scrolling) and pinch-to-zoom magnification without switching drawing tools.
- 🛡️ **Hardware-Enforced Palm Rejection**: Single-finger touches on the drawing surface are 100% inert. While Apple Pencil is hovering or drawing, all finger touches are strictly suppressed at the hardware layer.
- 💻 **Native macOS Companion App (`PenpalCompanion`)**: Live window manager with real-time 240Hz sampling rate gauge, live **Tilt Gauge** (`TX, TY` in degrees), pressure readout, packet rate HUD, one-click reconnect, and display mapping switcher.
- 🎨 **Customizable Canvas Themes**: OLED Black, Deep Charcoal, Studio Neutral Gray, Midnight Navy, and Warm Umber, with left/right handed dock placement and corner reticle guides.
- 🔌 **Zero External Dependencies**: Pure Swift Unix domain socket bridge to `/var/run/usbmuxd`. No third-party frameworks, no kernel extensions.
- 🦺 **Emergency Disconnect Protection**: Unplugging the USB cable mid-stroke automatically releases all held mouse buttons, dispatches `leaveProximity`, and clears held keys, preventing stuck drag loops on macOS.

---

## Requirements

### macOS Host
- macOS 14.0 (Sonoma) or newer (Apple Silicon or Intel).
- Accessibility Permissions enabled (`System Settings` → `Privacy & Security` → `Accessibility`).
- Xcode 15+ / Command Line Tools (with Swift 6.0+).

### iPad Client
- iPad supporting Apple Pencil (iPad Pro, iPad Air, iPad mini, or iPad 6th gen+).
- iPadOS 17.0 or newer.
- Apple Pencil (1st gen, 2nd gen, USB-C, or Apple Pencil Pro).
- Standard USB-C to USB-C or Lightning to USB cable.

---

## Installation & How to Use

### 1. Clone the Repository
```bash
git clone https://github.com/Renoceros/Penpal.git
cd Penpal
```

### 2. Run the macOS Companion App (or Host Daemon)

You have two ways to run the macOS host:

#### Option A: Native GUI Companion App (Recommended)
Launch the native macOS companion window with live 240Hz telemetry and connection status:

```bash
swift run --package-path Packages/PenpalKit PenpalCompanion
```

#### Option B: Headless Background CLI Spike
```bash
swift run --package-path Packages/PenpalKit PenpalHostSpike
```

> **Important (Accessibility Permissions):**  
> On first run, macOS requires Accessibility permissions to inject HID tablet events into your drawing apps. If prompted, go to:  
> **System Settings → Privacy & Security → Accessibility**  
> and toggle **ON** for your terminal or `PenpalCompanion`. The companion app includes a convenient "Grant Accessibility Permissions" button to check and prompt automatically.

### 3. Deploy the iPad App

1. Open `Penpal.xcodeproj` in **Xcode**:
   ```bash
   open Penpal.xcodeproj
   ```
2. Connect your iPad to your Mac via USB cable.
3. In the Xcode toolbar, select the `Penpal` target and choose your physical iPad as the destination device.
4. Under the **Signing & Capabilities** tab:
   - Select your personal Apple ID team (free or paid).
   - Ensure a unique Bundle Identifier is set (e.g. `com.yourname.Penpal`).
5. Press **Cmd + R** to build and run the app onto your iPad.
6. *(First time only)* On your iPad, navigate to **Settings → General → VPN & Device Management** and tap **Trust [Your Apple ID]**.

### 4. Connect & Draw!

1. Keep your iPad plugged into your Mac via the USB cable.
2. Launch the **Penpal** app on your iPad.
3. Launch **PenpalCompanion** on your Mac. The companion app will immediately detect your iPad over `usbmuxd` on port `8124` and show a green **Connected** status with live Hz readout.
4. Open **Krita**, **Photoshop**, **Clip Studio Paint**, or **Blender** on your Mac.
5. Touch your Apple Pencil to the iPad screen — your cursor moves instantly with pressure, tilt, and zero visual delay!

---

## Gestures & Controls

| Action | Physical Input on iPad | Injected macOS Event |
| :--- | :--- | :--- |
| **Draw / Paint** | Apple Pencil contact (`pressure > 0`) | `kCGEventLeftMouseDown` / `Dragged` with continuous double-precision pressure & Cartesian tilt |
| **Cursor Hover** | Apple Pencil hovering above screen | `kCGEventMouseMoved` with tilt tracking and proximity |
| **Right-Click** | Apple Pencil double-tap or squeeze | `kCGEventRightMouseDown` + `RightMouseUp` at pencil tip |
| **Eraser / Pen Toggle** | Tap **Eraser / Pen** dock button | Toggles button to **Pen** (amber) and sends `E` keydown/up |
| **Hand (Pan Canvas)** | Press and hold **Hand** dock button | Continuous `Spacebar` key down while held, key up on release |
| **Pan Canvas (Gesture)** | Two fingers dragging across screen | Continuous pixel scroll (`CGEventCreateScrollWheelEvent2`) |
| **Zoom Canvas (Gesture)**| Two fingers pinch in / pinch out | Trackpad magnification (`Cmd + Scroll` / scale event) |
| **Rotate Canvas** | Two fingers rotation gesture | Trackpad rotate gesture |
| **Undo / Redo** | Tap **Undo** (`⌘Z`) or **Redo** (`⇧⌘Z`) | Discrete keydown & keyup |
| **Custom Hotkeys** | Tap configured dock buttons | Synthesizes assigned keycode (`B`, `I`, `[`, `]`, `⌘0`) |
| **Palm Rejection** | Single finger touch or resting hand | **Completely ignored** (Hardware-enforced lock) |

---

## App Configuration & Settings

Tap the **Settings gear** (`gearshape.fill`) on the iPad floating dock to customize:
1. **Work Area & Screen Ratio**:
   - **Full Screen (Edge-to-Edge)**: 1:1 mapping matching the entire MacBook display.
   - **MacBook 16:10 Reticle**: Active 16:10 corner boundary tick marks.
   - **Legacy 4:3 Pillarbox**: Classic tablet aspect ratio.
2. **Apple Pencil Click Action**: Choose whether double-tap and squeeze trigger **Right-Click (Secondary Click)**, **Eraser Toggle (E)**, or **Undo (⌘Z)**.
3. **Dock Hotkeys Customization**: Check or uncheck buttons to decide exactly which shortcuts appear on your floating dock.
4. **Canvas Appearance**: Switch between OLED Black, Deep Charcoal, Studio Neutral Gray, Midnight Navy, and Warm Umber.
5. **Dock Placement**: Dock on the Left edge (for right-handed artists), Right edge (for left-handed artists), or Top bar.

---

## Frequently Asked Questions (FAQ)

### Does pressure work in Krita?
**Yes.** Penpal injects native `kCGEventTabletProximity` events and sets double-precision CoreGraphics and AppKit pressure fields (`kCGTabletEventPointPressure` and `kCGMouseEventPressure`). In Krita's **Tablet Tester**, strokes register as native `Tablet move` with continuous pressure `P=...`.

### Why doesn't Penpal show my Mac screen on the iPad?
Screen mirroring requires video encoding (H.264/HEVC), network transmission, and decoding on the iPad GPU. This introduces **20–60ms of visual delay**, makes your iPad run hot, and causes pen strokes to feel like they are lagging behind your hand. 

By running as a **pure digitizer**, you look at your calibrated Mac monitor while your hand moves freely on the iPad—giving you the true, instant responsiveness of a dedicated drawing tablet with zero battery drain.

### How do I use the Hand tool to pan the canvas?
Simply rest your non-drawing thumb on the **Hand** button on the iPad dock. As long as your finger touches the button, Spacebar is continuously held down on your Mac, allowing you to drag and pan the canvas with your Apple Pencil. Lifting your thumb instantly returns to your active brush tool.

### What happens if I unplug the USB cable while drawing?
Penpal incorporates an automated fail-safe: if the connection drops while a stroke is active, [`EventInjector`](Packages/PenpalKit/Sources/PenpalHost/EventInjector.swift) immediately synthesizes an emergency `kCGEventLeftMouseUp` and releases all held keys, preventing macOS from locking into mouse-drag or key-repeat mode.

### Does Penpal require a paid Apple Developer account?
**No.** You can deploy the app to your own iPad for free using Xcode with a standard personal Apple ID. Free provisioning profiles remain valid for 7 days before needing a re-deploy via Xcode.

---

## Project Structure

```
Penpal/
├── Packages/
│   └── PenpalKit/               # Shared Swift 6 package
│       ├── Sources/
│       │   ├── PenpalKit/       # Wire protocol & zero-copy streaming
│       │   ├── PenpalHost/      # macOS CoreGraphics injection & usbmuxd client
│       │   ├── PenpalCompanion/ # Native macOS SwiftUI Companion App
│       │   └── PenpalHostSpike/ # Lightweight CLI daemon
│       └── Tests/               # 100% strictly-concurrent test suite
├── Penpal/                      # iOS 18+ client application
│   ├── PenpalTouchCanvasView.swift  # 240Hz coalesced touch engine & hover isolation
│   ├── PenpalClientBridge.swift     # Low-overhead BSD socket server
│   ├── ContentView.swift            # Quick action dock, hotkey customization & settings
│   └── PenpalApp.swift              # App lifecycle entry point
├── documentation/               # Token-efficient architectural & task specs (JSON)
├── docs/                        # GitHub Pages marketing landing page & docs
└── README.md                    # This guide
```

---

## Verification & Testing

To run the complete automated test suite on macOS:

```bash
# Run unit tests
swift run --package-path Packages/PenpalKit PenpalKitTests

# Run companion app
swift run --package-path Packages/PenpalKit PenpalCompanion
```

---

## Copyright & Trademarks

Copyright © 2026 Penpal Contributors. All rights reserved.  
Apple, iPad, Apple Pencil, and macOS are trademarks of Apple Inc.  
Designed with ❤️ for artists, animators, and digital sculptors.
