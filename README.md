# ZoneSets KWin Script

Configurable grid-zone snapping for the active window, with cycling on repeated shortcut presses (like gTile resize presets).

## Config

Edit `~/.config/zonesets.json` (created automatically on first run with examples).

```json
{
  "cycleCooldown": 3000,
  "binds": [
    {
      "name": "ZoneSet1",
      "zones": [
        "3x10 1:4 2:10",
        "10x10 1:4 4:10"
      ]
    },
    {
      "name": "Whatever",
      "zones": [
        "15x10 7:4 10:10",
        "3x10 2:4 2:10"
      ]
    }
  ]
}
```

### Zone syntax

`"15x10 7:4 10:10"` means:

- Divide the **work area** (screen minus panels) into a 15 columns × 10 rows grid.
- Place the window filling the rectangle from grid cell (7, 4) to (10, 10) (1-indexed, inclusive).

Relative coordinates:

- x start = (7-1)/15 = 6/15
- x end   = 10/15
- y start = (4-1)/10 = 3/10
- y end   = 10/10

## Installation

### From this folder

```bash
kpackagetool6 --type=KWin/Script -i /path/to/zonesets
```

Or zip it:

```bash
cd zonesets
zip -r ../zonesets.kwinscript .
```

Then in System Settings → Window Management → KWin Scripts → Import KWin script… and select the `.kwinscript`.

Enable the script and click Apply. You may need to log out/in or run:

```bash
qdbus org.kde.KWin /KWin reconfigure
```

### Assign shortcuts

System Settings → Keyboard → Shortcuts → search for "ZoneSets".

Each bind name appears as **ZoneSets: <name>**. Assign your desired keys (e.g. Ctrl+Alt+KP_1 etc.).

## Usage

Focus a normal window and press the shortcut for a bind.

- First press: snaps to the first zone in the list.
- Subsequent presses within `cycleCooldown` ms on the same window: cycle to the next zone.
- After the timeout or on a different window: starts over at the first zone.

## Notes

- Work area excludes panels/docks (`MaximizeArea`).
- Multi-monitor: uses the screen the window is currently on.
- Reloads config on every shortcut press (so edits take effect immediately, no restart needed for zone changes).
- New binds require restarting the script / logging out so shortcuts get registered.
- Works on Plasma 6 (tested conceptually against the KWin 6 scripting API).

## Uninstall

```bash
kpackagetool6 --type=KWin/Script -r zonesets
```

You may also need to clean leftover shortcuts:

```bash
qdbus org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.cleanUp
```
