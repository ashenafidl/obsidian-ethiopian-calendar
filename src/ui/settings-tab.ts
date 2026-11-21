import { type App, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import type EthiopianCalendarPlugin from '../main';
import { CUSTOM_PRESET, DATE_PRESETS, DEFAULT_SETTINGS, normalizeSettings } from '../settings';
import { currentEthiopianDateText, currentTimeText } from '../commands/insert';

const WEEKDAY_OPTIONS: Record<string, string> = {
	'0': 'Sunday',
	'1': 'Monday',
	'2': 'Tuesday',
	'3': 'Wednesday',
	'4': 'Thursday',
	'5': 'Friday',
	'6': 'Saturday',
};

const requireFormat = (value: string): string | void => {
	if (value.trim() === '') return 'Enter a format.';
};

/**
 * Declarative settings tab (Obsidian 1.13+), so every setting is indexed by
 * Obsidian's settings search.
 */
export class EthiopianCalendarSettingTab extends PluginSettingTab {
	private datePreviewEl: HTMLElement | null = null;
	private timePreviewEl: HTMLElement | null = null;

	constructor(
		app: App,
		private readonly plugin: EthiopianCalendarPlugin,
	) {
		super(app, plugin);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const settings = () => this.plugin.settings;

		const presetOptions: Record<string, string> = {};
		for (const [format, example] of Object.entries(DATE_PRESETS)) presetOptions[format] = `${example} (${format})`;
		presetOptions[CUSTOM_PRESET] = 'Custom';

		const items: SettingDefinitionItem[] = [
			{
				name: 'Language',
				desc: 'Language for Ethiopian month and weekday names. Ge’ez uses Amharic names with Ge’ez numerals.',
				aliases: ['Amharic', 'Geez', 'English', 'month names', 'አማርኛ', 'ግዕዝ'],
				control: {
					type: 'dropdown',
					key: 'language',
					defaultValue: DEFAULT_SETTINGS.language,
					options: { english: 'English', amharic: 'Amharic (አማርኛ)', geez: 'Ge’ez numerals (ግዕዝ)' },
				},
			},
			{
				type: 'group',
				heading: 'Inserting',
				items: [
					{
						name: 'Date format',
						desc: createFragment((f) => {
							f.appendText('Format used by the insert date command and {{ethiopianDate}}. ');
							this.datePreviewEl = f.createSpan({ cls: 'ethcal-setting-preview' });
						}),
						aliases: ['Ethiopian date', 'insert date', 'template'],
						control: {
							type: 'dropdown',
							key: 'datePreset',
							defaultValue: DEFAULT_SETTINGS.datePreset,
							options: presetOptions,
						},
					},
					{
						name: 'Custom date format',
						desc: 'Tokens: YYYY, YY, MMMM, MM, M, DD, D, dddd, ddd. Wrap literal text in [brackets].',
						visible: () => settings().datePreset === CUSTOM_PRESET,
						control: {
							type: 'text',
							key: 'customDateFormat',
							defaultValue: DEFAULT_SETTINGS.customDateFormat,
							placeholder: 'YYYY-MM-DD',
							validate: requireFormat,
						},
					},
					{
						name: 'Time format',
						desc: createFragment((f) => {
							f.appendText('Format used by the insert time command and {{ethiopianTime}}. ');
							this.timePreviewEl = f.createSpan({ cls: 'ethcal-setting-preview' });
						}),
						aliases: ['clock', '12-hour', '24-hour', 'ጠዋት', 'ማታ'],
						control: {
							type: 'dropdown',
							key: 'timeFormat',
							defaultValue: DEFAULT_SETTINGS.timeFormat,
							options: { '24h': '24-hour (14:35)', '12h': '12-hour (2:35 ማታ)', custom: 'Custom' },
						},
					},
					{
						name: 'Custom time format',
						desc: 'Tokens: HH, H, hh, h, mm, m, ss, s, A (ጠዋት/ማታ). Wrap literal text in [brackets].',
						visible: () => settings().timeFormat === 'custom',
						control: {
							type: 'text',
							key: 'customTimeFormat',
							defaultValue: DEFAULT_SETTINGS.customTimeFormat,
							placeholder: 'HH:mm',
							validate: requireFormat,
						},
					},
				],
			},
			{
				type: 'group',
				heading: 'Calendar view',
				items: [
					{
						name: 'First day of the week',
						aliases: ['week start'],
						control: {
							type: 'dropdown',
							key: 'weekStart',
							defaultValue: String(DEFAULT_SETTINGS.weekStart),
							options: WEEKDAY_OPTIONS,
						},
					},
					{
						name: 'Show Gregorian dates',
						desc: 'Show the Gregorian day under each Ethiopian day in the calendar.',
						aliases: ['Gregorian', 'western calendar'],
						control: { type: 'toggle', key: 'showGregorian', defaultValue: DEFAULT_SETTINGS.showGregorian },
					},
				],
			},
		];
		this.refreshPreviews();
		return items;
	}

	getControlValue(key: string): unknown {
		const value: unknown = (this.plugin.settings as unknown as Record<string, unknown>)[key];
		// Dropdown options are strings; weekStart is stored as a number.
		return key === 'weekStart' ? String(value) : value;
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const next: Record<string, unknown> = { ...this.plugin.settings, [key]: key === 'weekStart' ? Number(value) : value };
		this.plugin.settings = normalizeSettings(next);
		await this.plugin.saveSettings();
		this.refreshPreviews();
		// Re-evaluate `visible` predicates (custom format fields).
		this.refreshDomState();
	}

	private refreshPreviews(): void {
		const settings = this.plugin.settings;
		const preview = (el: HTMLElement | null, text: () => string) => {
			if (!el) return;
			try {
				el.setText(`Preview: ${text()}`);
			} catch {
				el.setText('Preview unavailable: invalid format.');
			}
		};
		preview(this.datePreviewEl, () => currentEthiopianDateText(settings));
		preview(this.timePreviewEl, () => currentTimeText(settings));
	}
}
