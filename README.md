# Ethiopian Calendar for Obsidian

Brings the Ethiopian calendar (ቀን መቁጠሪያ) into Obsidian: insert today's Ethiopian date or the current time from the `/` menu, use Ethiopian date variables in your templates, and browse a full month calendar that shows Ethiopian and Gregorian dates side by side.

Date conversion and calendar grids come from the [Kenat](https://github.com/MelakuDemeke/kenat) library.


## Installation

From the community plugin catalog፡ open **Settings → Community plugins → Browse**, search for **Ethiopian Calendar**, then select **Install** and **Enable**.

Requires Obsidian 1.13.0 or later. Works on desktop and mobile.

## Slash commands

All commands are registered through Obsidian's command system, so they appear both in the **Command palette** and in the editor's `/` menu. The `/` menu needs the core **Slash commands** plugin, which you can turn on in **Settings → Core plugins → Slash commands**.

Type `/` in a note, then start typing the command name, for example `/ethiopian date` or `/time`.

| Type in the `/` menu | Command | Command ID | Action |
| --- | --- | --- | --- |
| `/ethiopian date` | **Insert current Ethiopian date** | `ethiopian-calendar:insert-current-ethiopian-date` | Inserts today's Ethiopian date at the cursor, for example `Meskerem 8, 2019` |
| `/time` | **Insert current time** | `ethiopian-calendar:insert-current-time` | Inserts your local time at the cursor, for example `14:35` or `2:35 ማታ` |
| `/template variables` | **Replace Ethiopian template variables in note or selection** | `ethiopian-calendar:replace-template-variables` | Resolves the [template variables](#template-variables) below |
| — | **Open calendar** | `ethiopian-calendar:open-calendar` | Opens the calendar tab |

Text is inserted at the cursor. If text is selected, only the selection is replaced, the same way Obsidian's core "Insert current date" works. The editor commands only appear while a Markdown editor is active.

Output follows the **Date format**, **Time format** and **Language** settings.

## Template variables

Write these placeholders in any note or template, then run **Replace Ethiopian template variables in note or selection**. If text is selected, only the selection is processed. Otherwise the whole note is, in a single undoable step.

| Variable | Example output | Description |
| --- | --- | --- |
| `{{ethiopianDate}}` | `Meskerem 8, 2019` | Current Ethiopian date, in your configured date format and language |
| `{{ethiopianDate:YYYY-MM-DD}}` | `2019-01-08` | Current Ethiopian date with a custom format |
| `{{ethiopianTime}}` | `14:35` | Current local time, in your configured time format |
| `{{ethiopianTime:HH:mm}}` | `14:35` | Current local time with a custom format |

This follows the convention of Obsidian's core Templates plugin (`{{date:YYYY-MM-DD}}`). Everything after the first colon is the format, so `{{ethiopianTime:HH:mm:ss}}` works. Whitespace just inside the braces is allowed (`{{ ethiopianDate }}`).

**Workflow with core Templates:** put the variables in your template file, insert the template with core Templates, then run the replace command. Core `{{date}}`, `{{time}}` and `{{title}}` are left alone for core Templates to handle.

**Unknown variables are never removed silently.** Placeholders from other plugins stay unchanged. If a placeholder starts with `ethiopian` but isn't supported (for example a typo like `{{ethiopianDat}}`), it stays unchanged too, and you get a notice plus a warning in the developer console.

## Calendar tab

Open it from the ribbon icon (**Open Ethiopian calendar**) or with the **Ethiopian Calendar: Open calendar** command. It opens as a tab in the main area. If it's already open, it gets focused.

- The title shows the Ethiopian month, with the year in your accent color, and the Gregorian month span underneath (for example _Hidar **2019**_, _November – December 2026_).
- The month grid shows Ethiopian day numbers, with the Gregorian date under each one. Turn this on or off with the **Show Gregorian dates** setting.
- Weekday headers follow your **First day of the week** setting.
- Empty cells in the first and last week show the neighbouring months' days, faded. Selecting one moves to that month. No extra rows are added.
- Today is shown in your theme's accent color, and the selected day is highlighted.
- Buttons are Obsidian's own components, and the styling uses only theme variables, so the calendar follows your theme (light or dark, accent color, fonts) when you switch.
- Navigation buttons: previous/next year, previous/next month, and **Today**.
- In narrow panes, such as the sidebar or a phone, the navigation controls move below the title and spread across the full width.
- All 13 months are supported, including Pagume with 5 or 6 days depending on the leap year. Kenat does every calculation, so nothing is hard-coded.

**Keyboard:** **Tab** moves to the selected day. **←/→** move one day, **↑/↓** move one week, **Page Up/Page Down** move one month, and **Shift+Page Up/Page Down** move one year. **Enter** or **Space** selects a day. Every icon-only button has an accessible label.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| **Language** | English | Month and weekday names in English or Amharic, or Amharic names with Ge'ez numerals |
| **Date format** | `MMMM D, YYYY` | Presets (`MMMM D, YYYY`, `dddd, MMMM D, YYYY`, `D MMMM YYYY`, `YYYY-MM-DD`, `DD/MM/YYYY`) or **Custom** |
| **Custom date format** | `YYYY-MM-DD` | Shown when **Date format** is **Custom** ([tokens](#date-format-tokens-ethiopian-calendar)) |
| **Time format** | 24-hour | 24-hour (`HH:mm`), 12-hour with ጠዋት/ማታ (`h:mm A`, e.g. `2:35 ማታ`), or **Custom** |
| **Custom time format** | `HH:mm` | Shown when **Time format** is **Custom** ([tokens](#time-format-tokens-local-time)) |
| **First day of the week** | Monday | First column of the calendar grid |
| **Show Gregorian dates** | On | Show the Gregorian day under each Ethiopian day in the calendar tab |

The date and time settings show a live preview. All settings can be found with Obsidian's settings search. Settings are saved in the plugin's `data.json` and apply to open calendar tabs right away.

## Development

Requires Node.js 18 or later and npm.

```bash
npm install        # install dependencies
npm run dev        # watch mode; rebuilds main.js on change
npm run build      # typecheck + production bundle
npm run typecheck  # TypeScript only
npm run lint       # ESLint with eslint-plugin-obsidianmd
npm test           # unit tests (Vitest)
```

Project layout:

```
src/
  main.ts               plugin lifecycle: settings, view, ribbon, commands
  settings.ts           settings interface, defaults, validation
  commands/index.ts     command registration
  commands/insert.ts    date/time text and cursor insertion
  ui/calendar-view.ts   calendar tab (ItemView)
  ui/settings-tab.ts    settings tab
  utils/date-format.ts  conversion and date/time formatting (wraps Kenat)
  utils/template.ts     template variable resolver
  utils/calendar.ts     month grid model (wraps Kenat MonthGrid)
tests/                  Vitest unit tests
```

To test in a vault, build, then copy `main.js`, `manifest.json` and `styles.css` to `<vault>/.obsidian/plugins/ethiopian-calendar/` and reload Obsidian.

Releases: bump `version` in `manifest.json` and `package.json` (or run `npm version <x.y.z>`), update `versions.json`, and push a tag that exactly matches the version, without a leading `v`.

## Credits

- **[Kenat](https://github.com/MelakuDemeke/kenat)** by Melaku Demeke handles Ethiopian calendar conversion, formatting and calendar grids. Kenat is licensed under the **MIT License** (Copyright (c) 2025 Melaku Demeke). It is bundled into `main.js`, and its full license notice is kept at the top of that file.

## License

Copyright (c) 2026 ashenafidl

Released under the [MIT License](LICENSE).

Kenat is also MIT-licensed. Its copyright and license notice are kept in the bundled `main.js`.
