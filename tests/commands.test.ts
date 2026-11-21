import { describe, expect, it } from 'vitest';
import {
	type InsertTarget,
	currentEthiopianDateText,
	currentTimeText,
	insertAtCursor,
} from '../src/commands/insert';
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/settings';

/** Minimal editor double: a document with a cursor/selection range. */
class FakeEditor implements InsertTarget {
	constructor(
		public doc: string,
		public from: number,
		public to = from,
	) {}

	replaceSelection(text: string): void {
		this.doc = this.doc.slice(0, this.from) + text + this.doc.slice(this.to);
		this.from = this.to = this.from + text.length;
	}
}

const now = new Date(2026, 8, 18, 14, 35); // Meskerem 8, 2019

describe('insert commands', () => {
	it('inserts the default Ethiopian date and time', () => {
		expect(currentEthiopianDateText(DEFAULT_SETTINGS, now)).toBe('Meskerem 8, 2019');
		expect(currentTimeText(DEFAULT_SETTINGS, now)).toBe('14:35');
	});

	it('respects date, language and time settings', () => {
		const s = { ...DEFAULT_SETTINGS, language: 'amharic' as const, datePreset: 'YYYY-MM-DD', timeFormat: '12h' as const };
		expect(currentEthiopianDateText(s, now)).toBe('2019-01-08');
		expect(currentTimeText(s, now)).toBe('2:35 ማታ');
		const custom = { ...DEFAULT_SETTINGS, datePreset: 'custom', customDateFormat: 'dddd D MMMM', timeFormat: 'custom' as const, customTimeFormat: 'HH[h]mm' };
		expect(currentEthiopianDateText(custom, now)).toBe('Friday 8 Meskerem');
		expect(currentTimeText(custom, now)).toBe('14h35');
	});

	it('inserts at the cursor without touching surrounding text', () => {
		const editor = new FakeEditor('Today is . Done.', 9);
		insertAtCursor(editor, currentEthiopianDateText(DEFAULT_SETTINGS, now));
		expect(editor.doc).toBe('Today is Meskerem 8, 2019. Done.');
		expect(editor.from).toBe(25);
	});

	it('replaces only the selected text', () => {
		const editor = new FakeEditor('Time: XX:XX!', 6, 11);
		insertAtCursor(editor, currentTimeText(DEFAULT_SETTINGS, now));
		expect(editor.doc).toBe('Time: 14:35!');
	});
});

describe('normalizeSettings', () => {
	it('returns defaults for missing or corrupt data', () => {
		expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
		// Keys from older versions (e.g. removed holiday settings) are dropped.
		expect(normalizeSettings({ showHolidays: true, holidayFilter: 'all' })).toEqual(DEFAULT_SETTINGS);
		expect(normalizeSettings({ language: 'klingon', weekStart: 9, showGregorian: 'yes', customDateFormat: '' })).toEqual(
			DEFAULT_SETTINGS,
		);
	});

	it('keeps valid stored values', () => {
		const s = normalizeSettings({ language: 'geez', weekStart: 0, timeFormat: '12h', showGregorian: false });
		expect(s).toMatchObject({ language: 'geez', weekStart: 0, timeFormat: '12h', showGregorian: false });
	});
});
