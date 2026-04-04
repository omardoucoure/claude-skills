---
name: app-logs
description: Capture and view runtime logs from iOS/tvOS apps running on simulators or physical devices. Use when user says "check logs", "view logs", "capture logs", "run with logs", "see console output", "debug output", "watch logs", "app logs", or "runtime logs".
---

# App Logs - iOS/tvOS Runtime Log Capture

Capture and display runtime logs from apps running on iOS simulators or physical devices from the CLI.

## Critical — Build Cache Invalidation

**ALWAYS ensure the build contains your latest code changes before launching.**

When adding debug `print()` statements to pod/framework code (e.g., QubToolbox), `xcodebuild` may use a cached static library and skip recompilation. You MUST:

1. **Delete the cached build artifacts for the modified pod** before rebuilding:
```bash
# Find and delete the cached .build directory for the modified pod
rm -rf "$(find ~/Library/Developer/Xcode/DerivedData -path "*/<POD_NAME>.build" -type d | head -1)"
# Also delete the cached static library
find ~/Library/Developer/Xcode/DerivedData -name "lib<POD_NAME>.a" -delete
```

2. **Rebuild the app** — the pod will now be recompiled from source with your changes.

3. **Verify the build includes your changes** by checking the binary:
```bash
strings "path/to/lib<POD_NAME>.a" | grep "[YourTag]"
```
If the string is missing, the cache wasn't properly invalidated.

**Shortcut for Quebecor workspace:**
```bash
# Clean a specific pod's build cache (e.g., QubToolbox)
POD=QubToolbox
DD=$(xcodebuild -workspace Workspace/*.xcworkspace -scheme <SCHEME> -showBuildSettings 2>/dev/null | grep BUILD_DIR | head -1 | awk '{print $3}' | sed 's|/Build/Products||')
rm -rf "$DD/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/${POD}.build"
rm -f "$DD/Build/Products/Debug-iphonesimulator/${POD}/lib${POD}.a"
```

## Important

- **Simulator**: Use `xcrun simctl launch --console-pty` for `print()` / `stdout` capture
- **Physical device**: Use `xcrun devicectl device process launch --console` (Xcode 16+) for `stdout`/`stderr`
- **os_log / Logger**: Use `log stream` with predicates for structured logging (works on both)
- `print()` only goes to `stdout` — it is NOT captured by `os_log` or the system log. You must use `--console-pty` (simulator) or `--console` (device) to see it.

## Full Workflow: Add Logs, Build, Launch, Capture

This is the recommended end-to-end workflow:

### Step 1: Add print() statements with a tag
```swift
print("[MyTag] some debug info: \(variable)")
```

### Step 2: Invalidate pod cache (if modified code is in a pod)
```bash
POD=QubToolbox  # or whatever pod was modified
rm -rf "$DD/Build/Intermediates.noindex/Pods.build/Debug-iphonesimulator/${POD}.build"
rm -f "$DD/Build/Products/Debug-iphonesimulator/${POD}/lib${POD}.a"
```

### Step 3: Build
```bash
xcodebuild -workspace Workspace/*.xcworkspace -scheme <SCHEME> \
  -destination 'platform=iOS Simulator,id=<UDID>' build 2>&1 | tail -3
```

### Step 4: Verify changes are in the binary
```bash
strings "$DD/Build/Products/Debug-iphonesimulator/${POD}/lib${POD}.a" | grep "[MyTag]"
```

### Step 5: Terminate old app, install, launch with log capture
```bash
xcrun simctl terminate <UDID> <BUNDLE_ID> 2>/dev/null
xcrun simctl install <UDID> "path/to/App.app"
xcrun simctl launch --console-pty <UDID> <BUNDLE_ID> > /tmp/app-logs.txt 2>&1 &
```

### Step 6: User scrolls/interacts, then check logs
```bash
grep "[MyTag]" /tmp/app-logs.txt
```

### Step 7: Cleanup (before committing)
- Remove all temporary `print()` statements
- `git checkout -- path/to/modified/file.swift` to discard debug changes
- Kill background log process
- Remove temp log files

## Methods

### Method 1: Simulator — print() / stdout capture

Best for: Capturing `print()`, `NSLog()`, and `stdout` output from simulator apps.

```bash
# Launch app and capture ALL stdout/stderr to a file
xcrun simctl terminate booted <BUNDLE_ID> 2>/dev/null
xcrun simctl launch --console-pty booted <BUNDLE_ID> > /tmp/app-logs.txt 2>&1 &
LOG_PID=$!

# Let user interact with the app...
# Then read logs:
cat /tmp/app-logs.txt

# Filter for a specific tag:
grep "[MyTag]" /tmp/app-logs.txt

# Stop capture:
kill $LOG_PID 2>/dev/null
```

Key points:
- `--console-pty` captures `print()` output (stdout + stderr)
- `--console` (without `-pty`) also works but may buffer differently
- Always redirect to a file first, then grep — piping through grep directly can lose buffered output
- Use `booted` or a specific device UDID

### Method 2: Simulator — os_log / Logger stream

Best for: Capturing `os_log`, `Logger`, and `NSLog` messages with filtering.

```bash
# Stream all logs from a specific app process
xcrun simctl spawn booted log stream --level debug \
  --predicate 'processImagePath contains "<APP_NAME>"' \
  > /tmp/app-oslog.txt 2>&1 &

# Stream logs filtered by subsystem
xcrun simctl spawn booted log stream --level debug \
  --predicate 'subsystem == "com.example.myapp"' \
  > /tmp/app-oslog.txt 2>&1 &

# Stream with predicate matching a message pattern
xcrun simctl spawn booted log stream --level debug \
  --predicate 'processImagePath contains "<APP_NAME>" AND eventMessage contains "Card10"' \
  > /tmp/app-oslog.txt 2>&1 &
```

Key points:
- `print()` is NOT captured by `log stream` — only `os_log` / `Logger` / `NSLog`
- Use `--level debug` to include debug-level messages
- Predicates use NSPredicate syntax
- Common predicates: `processImagePath contains`, `subsystem ==`, `category ==`, `eventMessage contains`

### Method 3: Physical device — stdout capture (Xcode 16+)

Best for: Capturing `print()` output from a physical device.

```bash
# Launch with console output
xcrun devicectl device process launch --console \
  --device <DEVICE_UDID> <BUNDLE_ID> > /tmp/device-logs.txt 2>&1 &
```

Key points:
- Requires Xcode 16+ and iOS 17+
- The `--console` flag blocks and prints stdout/stderr to terminal
- Sandbox issues: if `devicectl` fails with error 3002, copy the `.app` to `/tmp/` first before installing

### Method 4: Physical device — os_log stream

Best for: Structured logging from physical devices.

```bash
# Stream device logs (requires device to be connected)
log stream --device <DEVICE_UDID> --level debug \
  --predicate 'processImagePath contains "<APP_NAME>"' \
  > /tmp/device-oslog.txt 2>&1 &
```

## Quick Reference

| Scenario | Command |
|----------|---------|
| Clean pod cache | `rm -rf "DD/Build/Intermediates.noindex/Pods.build/*/POD.build"; rm -f "DD/Build/Products/*/POD/libPOD.a"` |
| Verify binary | `strings "path/to/libPOD.a" \| grep "[Tag]"` |
| Simulator + print() | `xcrun simctl launch --console-pty booted BUNDLE > /tmp/logs.txt 2>&1 &` |
| Simulator + os_log | `xcrun simctl spawn booted log stream --level debug --predicate 'PRED' > /tmp/logs.txt 2>&1 &` |
| Device + print() | `xcrun devicectl device process launch --console --device UDID BUNDLE > /tmp/logs.txt 2>&1 &` |
| Device + os_log | `log stream --device UDID --level debug --predicate 'PRED' > /tmp/logs.txt 2>&1 &` |
| Read logs | `cat /tmp/logs.txt` |
| Filter logs | `grep "[Tag]" /tmp/logs.txt` |
| Live tail | `tail -f /tmp/logs.txt` |

## Troubleshooting

### print() not showing in logs
- **Cause**: Using `log stream` instead of `--console-pty`. `print()` goes to stdout, not the system log.
- **Fix**: Use `xcrun simctl launch --console-pty` for simulator or `xcrun devicectl ... --console` for device.

### Logs file is empty
- **Cause**: Piping through `grep` with line buffering issues, or app launched in a separate process.
- **Fix**: Always redirect ALL output to file first (`> /tmp/logs.txt 2>&1`), then grep the file after.

### Debug prints not appearing despite rebuild
- **Cause**: xcodebuild used cached pod build artifacts and didn't recompile the modified pod.
- **Fix**: Delete the pod's `.build` directory and `.a` file from DerivedData before rebuilding. Verify with `strings`.

### devicectl install fails with error 3002 (sandbox)
- **Cause**: CLI sandbox can't create bookmark data for files in DerivedData.
- **Fix**: Copy `.app` to `/tmp/` first: `cp -R "path/to/App.app" /tmp/App.app`, then install from `/tmp/`.

### No logs from physical device
- **Cause**: Xcode version too old or device not paired.
- **Fix**: Requires Xcode 16+ for `--console` support. Ensure device is trusted and paired.
