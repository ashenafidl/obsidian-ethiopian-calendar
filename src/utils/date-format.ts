import Kenat, { monthNames, toEC, toGC, toGeez } from 'kenat';

/** Display language for Ethiopian month/weekday names. `geez` = Amharic names + Ge'ez numerals. */
export type DisplayLanguage = 'english' | 'amharic' | 'geez';

export interface SimpleDate {
	year: number;
	month: number;
	day: number;
}

const WEEKDAYS: Record<'english' | 'amharic', string[]> = {
	english: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	amharic: ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'],
};

/** Kenat's language key for names (Ge'ez uses Amharic names). */
export function kenatLang(language: DisplayLanguage): 'english' | 'amharic' {
	return language === 'english' ? 'english' : 'amharic';
}

function assertValidDate(date: Date): void {
	if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
		throw new RangeError('Invalid date');
	}
}

/**
 * Converts a JS Date to an Ethiopian date using the date's *local* calendar day,
 * so the result matches what the user sees on their clock regardless of UTC offset.
 */
export function toEthiopian(date: Date): SimpleDate {
	assertValidDate(date);
	return toEC(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** Converts an Ethiopian date to Gregorian via Kenat. Throws on invalid input. */
export function toGregorian(eth: SimpleDate): SimpleDate {
	// Constructing a Kenat instance validates the date (e.g. rejects Pagume 6 in non-leap years).
	new Kenat({ ...eth });
	return toGC(eth.year, eth.month, eth.day);
}

/** Day of week (0 = Sunday) for an Ethiopian date. */
export function ethiopianWeekday(eth: SimpleDate): number {
	return new Kenat({ ...eth }).weekday();
}

export function weekdayName(weekday: number, language: DisplayLanguage): string {
	return WEEKDAYS[kenatLang(language)][weekday] ?? '';
}

export function ethiopianMonthName(month: number, language: DisplayLanguage): string {
	return monthNames[kenatLang(language)][month - 1] ?? '';
}

/** Renders a number in Arabic or Ge'ez numerals depending on the language. */
export function displayNumber(n: number, language: DisplayLanguage): string {
	return language === 'geez' ? toGeez(n) : String(n);
}

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

const DATE_TOKENS = /\[([^\]]*)\]|YYYY|YY|MMMM|MM|M|dddd|ddd|DD|D/g;

/**
 * Formats an Ethiopian date with a Moment-like token subset:
 * YYYY, YY, MMMM, MM, M, DD, D, dddd, ddd and `[literal]` escapes.
 * With `geez`, the unpadded numeric tokens (YYYY, M, D) use Ge'ez numerals.
 */
export function formatEthiopianDate(eth: SimpleDate, format: string, language: DisplayLanguage): string {
	const weekday = ethiopianWeekday(eth);
	return format.replace(DATE_TOKENS, (token, literal: string | undefined) => {
		if (literal !== undefined) return literal;
		switch (token) {
			case 'YYYY':
				return displayNumber(eth.year, language);
			case 'YY':
				return pad(eth.year % 100);
			case 'MMMM':
				return ethiopianMonthName(eth.month, language);
			case 'MM':
				return pad(eth.month);
			case 'M':
				return displayNumber(eth.month, language);
			case 'DD':
				return pad(eth.day);
			case 'D':
				return displayNumber(eth.day, language);
			case 'dddd':
				return weekdayName(weekday, language);
			case 'ddd': {
				const name = weekdayName(weekday, language);
				return language === 'english' ? name.slice(0, 3) : name;
			}
			default:
				return token;
		}
	});
}

/** Amharic period labels used in place of AM/PM. */
export const MERIDIEM = { am: 'ጠዋት', pm: 'ማታ' } as const;

const TIME_TOKENS = /\[([^\]]*)\]|HH|H|hh|h|mm|m|ss|s|A|a/g;

/**
 * Formats local clock time with tokens HH, H, hh, h, mm, m, ss, s and `[literal]` escapes.
 * `A` (or `a`) renders the period as ጠዋት (before noon) or ማታ (noon onwards).
 */
export function formatTime(date: Date, format: string): string {
	assertValidDate(date);
	const h24 = date.getHours();
	const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
	return format.replace(TIME_TOKENS, (token, literal: string | undefined) => {
		if (literal !== undefined) return literal;
		switch (token) {
			case 'HH':
				return pad(h24);
			case 'H':
				return String(h24);
			case 'hh':
				return pad(h12);
			case 'h':
				return String(h12);
			case 'mm':
				return pad(date.getMinutes());
			case 'm':
				return String(date.getMinutes());
			case 'ss':
				return pad(date.getSeconds());
			case 's':
				return String(date.getSeconds());
			case 'A':
			case 'a':
				return h24 < 12 ? MERIDIEM.am : MERIDIEM.pm;
			default:
				return token;
		}
	});
}

/** Formats a Gregorian date for display using the runtime locale. */
export function formatGregorianLong(greg: SimpleDate): string {
	return new Date(greg.year, greg.month - 1, greg.day).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

export function gregorianMonthName(month: number): string {
	return monthNames.gregorian[month - 1] ?? '';
}
