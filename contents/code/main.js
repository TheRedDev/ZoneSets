// ZoneSets - KWin script for gTile-style cycling resize presets
// Config: ~/.config/zonesets.json

const CONFIG_PATH = QDir.homePath() + "/.config/zonesets.json";

let cycleState = {}; // bindName -> { lastTime, index, windowId }

function loadConfig() {
    const file = new QFile(CONFIG_PATH);
    if (!file.exists()) {
        createDefaultConfig();
        return loadConfig();
    }
    if (!file.open(QIODevice.ReadOnly | QIODevice.Text)) {
        print("ZoneSets: Failed to open config: " + CONFIG_PATH);
        return null;
    }
    const data = file.readAll().toString();
    file.close();
    try {
        return JSON.parse(data);
    } catch (e) {
        print("ZoneSets: JSON parse error: " + e);
        return null;
    }
}

function createDefaultConfig() {
    const dir = new QDir(QDir.homePath() + "/.config");
    if (!dir.exists()) dir.mkpath(".");
    const file = new QFile(CONFIG_PATH);
    if (file.open(QIODevice.WriteOnly | QIODevice.Text)) {
        const defaultConfig = {
            cycleCooldown: 3000,
            binds: [
                {
                    name: "ZoneSet1",
                    zones: [
                      "3x3 1:1 1:1",
                      "3x3 2:2 2:2",
                      "3x3 1:1 3:3"
                    ]
                },
                {
                    name: "ZoneSet2",
                    zones: [
                      "2x2 1:1 1:1",
                      "2x2 2:2 2:2"
                    ]
                }
            ]
        };
        file.write(JSON.stringify(defaultConfig, null, 2));
        file.close();
        print("ZoneSets: Created default config at " + CONFIG_PATH);
    }
}

function parseZone(str) {
    const parts = str.trim().split(/\s+/);
    if (parts.length !== 3) return null;
    const [grid, start, end] = parts;
    const gridParts = grid.split("x").map(Number);
    const startParts = start.split(":").map(Number);
    const endParts = end.split(":").map(Number);
    if (gridParts.length !== 2 || startParts.length !== 2 || endParts.length !== 2) return null;
    const [cols, rows] = gridParts;
    const [sc, sr] = startParts;
    const [ec, er] = endParts;
    if (cols <= 0 || rows <= 0 || sc < 1 || sr < 1 || ec < sc || er < sr || ec > cols || er > rows) return null;
    return { cols, rows, sc, sr, ec, er };
}

function applyZone(client, zoneStr) {
    const z = parseZone(zoneStr);
    if (!z) {
        print("ZoneSets: Invalid zone: " + zoneStr);
        return;
    }
    const area = workspace.clientArea(KWin.MaximizeArea, client);
    const xRel = (z.sc - 1) / z.cols;
    const yRel = (z.sr - 1) / z.rows;
    const wRel = (z.ec - (z.sc - 1)) / z.cols;
    const hRel = (z.er - (z.sr - 1)) / z.rows;

    const x = Math.round(area.x + xRel * area.width);
    const y = Math.round(area.y + yRel * area.height);
    const w = Math.round(wRel * area.width);
    const h = Math.round(hRel * area.height);

    // Unmaximize if needed
    if (client.maximizeMode !== 0) {
        client.setMaximize(false, false);
    }

    client.frameGeometry = Qt.rect(x, y, w, h);
}

function activateBind(bindName) {
    const config = loadConfig();
    if (!config || !config.binds) return;

    const bind = config.binds.find(b => b.name === bindName);
    if (!bind || !bind.zones || bind.zones.length === 0) {
        print("ZoneSets: Bind not found or empty: " + bindName);
        return;
    }

    const client = workspace.activeWindow;
    if (!client || !client.normalWindow) return;

    const now = Date.now();
    const cooldown = config.cycleCooldown || 3000;
    const state = cycleState[bindName] || { lastTime: 0, index: 0, windowId: null };

    let index = 0;
    if (state.windowId === client.internalId && (now - state.lastTime) < cooldown) {
        index = (state.index + 1) % bind.zones.length;
    }

    const zoneStr = bind.zones[index];
    applyZone(client, zoneStr);

    cycleState[bindName] = {
        lastTime: now,
        index: index,
        windowId: client.internalId
    };
}

function init() {
    print("ZoneSets: Initializing...");
    const config = loadConfig();
    if (!config || !config.binds || config.binds.length === 0) {
        print("ZoneSets: No valid config or binds found, no shortcuts registered");
        return;
    }

    print("ZoneSets: Found " + config.binds.length + " binds");

    config.binds.forEach((bind, idx) => {
        if (!bind.name) return;
        const shortcutName = "ZoneSets: " + bind.name;
        const description = "Cycle zones for " + bind.name;
        // Provide a default sequence so it reliably appears in the UI
        // User can reassign freely. Uses Ctrl+Alt + Numpad(1-based)
        const defaultKey = "Ctrl+Alt+Num+" + (idx + 1);
        const success = registerShortcut(shortcutName, description, defaultKey, function() {
            activateBind(bind.name);
        });
        print("ZoneSets: Registered '" + shortcutName + "' with default " + defaultKey + " (success=" + success + ")");
    });

    print("ZoneSets: Init complete. Look for 'ZoneSets:' under Shortcuts > KWin");
}

init();
