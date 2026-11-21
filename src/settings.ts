import type { DisplayLanguage } from './utils/date-format';

export type TimeFormatMode = '24h' | '12h' | 'custom';

export const CUSTOM_PRESET = 'custom';

export const DATE_PRESETS: Record<string, string> = {
	'MMMM D, YYYY': 'Meskerem 8, 2019',
	'dddd, MMMM D, YYYY': 'Monday, Meskerem 8, 2019',
	'D MMMM YYYY': '8 Meskerem 2019',
	'YYYY-MM-DD': '2019-01-08',
	'DD/MM/YYYY': '08/01/2019',
};

export const TIME_FORMATS: Record<Exclude<TimeFormatMode, 'custom'>, string> = {
	'24h': 'HH:mm',
	'12h': 'h:mm A',
};

export interface EthiopianCalendarSettings {
	language: DisplayLanguage;
	/** A key of DATE_PRESETS, or CUSTOM_PRESET. */
	datePreset: string;
	customDateFormat: string;
	timeFormat: TimeFormatMode;
	customTimeFormat: string;
	/** 0 = Sunday … 6 = Saturday. */
	weekStart: number;
	showGregorian: boolean;
}

export const DEFAULT_SETTINGS: EthiopianCalendarSettings = {
	language: 'english',
	datePreset: 'MMMM D, YYYY',
	customDateFormat: 'YYYY-MM-DD',
	timeFormat: '24h',
	customTimeFormat: 'HH:mm',
	weekStart: 1,
	showGregorian: true,
};

const LANGUAGES: DisplayLanguage[] = ['english', 'amharic', 'geez'];
const TIME_MODES: TimeFormatMode[] = ['24h', '12h', 'custom'];

function pick<T>(value: unknown, allowed: readonly T[], fallback: T): T {
	return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Merges stored data over defaults, discarding invalid values. */
export function normalizeSettings(raw: unknown): EthiopianCalendarSettings {
	const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof EthiopianCalendarSettings, unknown>>;
	const d = DEFAULT_SETTINGS;
	const str = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() !== '' ? v : fallback);
	const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
	const weekStart = Number(data.weekStart);
	return {
		language: pick(data.language, LANGUAGES, d.language),
		datePreset: pick(data.datePreset, [...Object.keys(DATE_PRESETS), CUSTOM_PRESET], d.datePreset),
		customDateFormat: str(data.customDateFormat, d.customDateFormat),
		timeFormat: pick(data.timeFormat, TIME_MODES, d.timeFormat),
		customTimeFormat: str(data.customTimeFormat, d.customTimeFormat),
		weekStart: Number.isInteger(weekStart) && weekStart >= 0 && weekStart <= 6 ? weekStart : d.weekStart,
		showGregorian: bool(data.showGregorian, d.showGregorian),
	};
}

export function effectiveDateFormat(s: EthiopianCalendarSettings): string {
	return s.datePreset === CUSTOM_PRESET ? s.customDateFormat : s.datePreset;
}

export function effectiveTimeFormat(s: EthiopianCalendarSettings): string {
	return s.timeFormat === 'custom' ? s.customTimeFormat : TIME_FORMATS[s.timeFormat];
}
