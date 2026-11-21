import { describe, expect, it } from 'vitest';
import {
	ethiopianWeekday,
	formatEthiopianDate,
	formatTime,
	toEthiopian,
	toGregorian,
} from '../src/utils/date-format';

describe('Ethiopian/Gregorian conversion', () => {
	it('converts Gregorian to Ethiopian using the local calendar day', () => {
		expect(toEthiopian(new Date(2026, 10, 20))).toEqual({ year: 2019, month: 3, day: 11 });
		// Late evening must not roll over to the next day (no UTC conversion).
		expect(toEthiopian(new Date(2026, 10, 20, 23, 59, 59))).toEqual({ year: 2019, month: 3, day: 11 });
		expect(toEthiopian(new Date(2026, 10, 21, 0, 0, 0))).toEqual({ year: 2019, month: 3, day: 12 });
	});

	it('handles Ethiopian New Year on both Sept 11 and Sept 12', () => {
		expect(toEthiopian(new Date(2023, 8, 12))).toEqual({ year: 2016, month: 1, day: 1 });
		expect(toEthiopian(new Date(2026, 8, 11))).toEqual({ year: 2019, month: 1, day: 1 });
	});

	it('converts Ethiopian to Gregorian', () => {
		expect(toGregorian({ year: 2016, month: 1, day: 1 })).toEqual({ year: 2023, month: 9, day: 12 });
		expect(toGregorian({ year: 2019, month: 3, day: 11 })).toEqual({ year: 2026, month: 11, day: 20 });
	});

	it('round-trips every day across a leap year boundary', () => {
		const start = new Date(2026, 8, 1);
		for (let i = 0; i < 400; i++) {
			const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
			const eth = toEthiopian(d);
			expect(toGregorian(eth)).toEqual({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
		}
	});

	it('accepts Pagume 6 only in leap years', () => {
		expect(toGregorian({ year: 2015, month: 13, day: 6 })).toEqual({ year: 2023, month: 9, day: 11 });
		expect(() => toGregorian({ year: 2016, month: 13, day: 6 })).toThrow();
	});

	it('rejects invalid input', () => {
		expect(() => toEthiopian(new Date('not a date'))).toThrow(RangeError);
		expect(() => toGregorian({ year: 2019, month: 14, day: 1 })).toThrow();
		expect(() => toGregorian({ year: 2019, month: 1, day: 31 })).toThrow();
	});

	it('computes the weekday', () => {
		// 20 Nov 2026 is a Friday.
		expect(ethiopianWeekday({ year: 2019, month: 3, day: 11 })).toBe(5);
	});
});

describe('formatEthiopianDate', () => {
	const date = { year: 2019, month: 1, day: 8 };

	it('uses the default "MMMM D, YYYY" style', () => {
		expect(formatEthiopianDate(date, 'MMMM D, YYYY', 'english')).toBe('Meskerem 8, 2019');
	});

	it('supports numeric tokens', () => {
		expect(formatEthiopianDate(date, 'YYYY-MM-DD', 'english')).toBe('2019-01-08');
		expect(formatEthiopianDate(date, 'D/M/YY', 'english')).toBe('8/1/19');
	});

	it('supports weekday tokens', () => {
		expect(formatEthiopianDate(date, 'dddd', 'english')).toBe('Friday');
		expect(formatEthiopianDate(date, 'ddd', 'english')).toBe('Fri');
		expect(formatEthiopianDate(date, 'dddd', 'amharic')).toBe('ዓርብ');
	});

	it('supports Amharic month names', () => {
		expect(formatEthiopianDate(date, 'MMMM D, YYYY', 'amharic')).toBe('መስከረም 8, 2019');
	});

	it('uses Geez numerals for unpadded numbers in Geez mode', () => {
		expect(formatEthiopianDate(date, 'MMMM D YYYY', 'geez')).toBe('መስከረም ፰ ፳፻፲፱');
		expect(formatEthiopianDate(date, 'YYYY-MM-DD', 'geez')).toBe('፳፻፲፱-01-08');
	});

	it('keeps bracketed literals', () => {
		expect(formatEthiopianDate(date, '[Day] D [of] MMMM', 'english')).toBe('Day 8 of Meskerem');
	});

	it('formats Pagume', () => {
		expect(formatEthiopianDate({ year: 2019, month: 13, day: 6 }, 'MMMM D', 'english')).toBe('Pagume 6');
	});
});

describe('formatTime', () => {
	const afternoon = new Date(2026, 10, 20, 14, 35, 7);

	it('formats 24-hour time', () => {
		expect(formatTime(afternoon, 'HH:mm')).toBe('14:35');
		expect(formatTime(afternoon, 'HH:mm:ss')).toBe('14:35:07');
		expect(formatTime(new Date(2026, 0, 1, 5, 4), 'H:mm')).toBe('5:04');
	});

	it('formats 12-hour time with ጠዋት/ማታ', () => {
		expect(formatTime(afternoon, 'h:mm A')).toBe('2:35 ማታ');
		expect(formatTime(afternoon, 'hh:mm a')).toBe('02:35 ማታ');
		expect(formatTime(new Date(2026, 0, 1, 0, 15), 'h:mm A')).toBe('12:15 ጠዋት');
		expect(formatTime(new Date(2026, 0, 1, 12, 0), 'h:mm A')).toBe('12:00 ማታ');
	});

	it('keeps bracketed literals', () => {
		expect(formatTime(afternoon, '[at] HH[h]mm')).toBe('at 14h35');
	});

	it('rejects invalid dates', () => {
		expect(() => formatTime(new Date(Number.NaN), 'HH:mm')).toThrow(RangeError);
	});
});
