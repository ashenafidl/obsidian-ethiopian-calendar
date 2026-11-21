import { describe, expect, it } from 'vitest';
import { type BuildMonthOptions, type CalendarCell, buildMonth, shiftDays, shiftMonths, shiftYears } from '../src/utils/calendar';

const base: BuildMonthOptions = {
	language: 'english',
	weekStart: 1,
	today: { year: 2019, month: 3, day: 11 },
};

/** Days that belong to the displayed month. */
const days = (weeks: CalendarCell[][]) => weeks.flat().filter((c) => c.inMonth);

describe('buildMonth', () => {
	it('builds a 30-day month in rows of seven', () => {
		const m = buildMonth(2019, 3, base);
		expect(m.monthName).toBe('Hidar');
		expect(days(m.weeks)).toHaveLength(30);
		for (const week of m.weeks) expect(week).toHaveLength(7);
		expect(days(m.weeks).map((c) => c.ethiopian.day)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
	});

	it('places day 1 under the right weekday header', () => {
		const m = buildMonth(2019, 3, base);
		expect(m.headers[0]).toBe('Monday');
		const firstRow = m.weeks[0] ?? [];
		const col = firstRow.findIndex((c) => c.inMonth);
		expect(m.headers[col]).toBe(
			['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][firstRow[col]?.weekday ?? -1],
		);
	});

	it('honours the start-of-week setting', () => {
		expect(buildMonth(2019, 3, { ...base, weekStart: 0 }).headers[0]).toBe('Sunday');
		expect(buildMonth(2019, 3, { ...base, language: 'amharic', weekStart: 0 }).headers[0]).toBe('እሑድ');
	});

	it('pairs each day with its Gregorian equivalent', () => {
		const m = buildMonth(2019, 3, base);
		const d11 = days(m.weeks).find((c) => c.ethiopian.day === 11);
		expect(d11?.gregorian).toEqual({ year: 2026, month: 11, day: 20 });
		expect(m.gregorianLabel).toBe('November – December 2026');
	});

	it('labels months spanning two Gregorian years', () => {
		// Tahsas 2019 runs from December 2026 into January 2027.
		expect(buildMonth(2019, 4, base).gregorianLabel).toBe('December 2026 – January 2027');
	});

	it('fills empty cells with neighbouring-month days without adding rows', () => {
		for (const [y, m] of [[2019, 3], [2019, 13], [2018, 13], [2019, 1]] as const) {
			const grid = buildMonth(y, m, base);
			const all = grid.weeks.flat();
			const inMonth = all.filter((c) => c.inMonth);
			// Rows are exactly those spanned by the month's own days.
			expect(grid.weeks).toHaveLength(Math.ceil((all.indexOf(inMonth[0]!) + inMonth.length) / 7));
			expect(grid.weeks[0]?.some((c) => c.inMonth)).toBe(true);
			expect(grid.weeks[grid.weeks.length - 1]?.some((c) => c.inMonth)).toBe(true);
			// Consecutive days with no gaps, in weekday order.
			for (let i = 1; i < all.length; i++) {
				expect(all[i]?.weekday).toBe(((all[i - 1]?.weekday ?? 0) + 1) % 7);
			}
		}
		// Hidar 2019 starts on a Tuesday: Monday is Tikimt 30, and after Hidar 30 comes Tahsas 1.
		const hidar = buildMonth(2019, 3, base).weeks.flat();
		expect(hidar[0]).toMatchObject({ ethiopian: { year: 2019, month: 2, day: 30 }, inMonth: false });
		expect(hidar.find((c) => !c.inMonth && c.ethiopian.month === 4)?.ethiopian.day).toBe(1);
	});

	it('crosses from Pagume into the new year when padding', () => {
		const pagume = buildMonth(2019, 13, base).weeks.flat();
		const after = pagume.filter((c) => !c.inMonth && c.ethiopian.year === 2020);
		expect(after[0]?.ethiopian).toEqual({ year: 2020, month: 1, day: 1 });
		expect(after[0]?.gregorian).toEqual({ year: 2027, month: 9, day: 12 });
	});

	it('highlights only today', () => {
		const today = days(buildMonth(2019, 3, base).weeks).filter((c) => c.isToday);
		expect(today.map((c) => c.ethiopian.day)).toEqual([11]);
		expect(days(buildMonth(2019, 4, base).weeks).some((c) => c.isToday)).toBe(false);
	});

	it('gives Pagume 6 days in leap years and 5 otherwise (via Kenat)', () => {
		expect(days(buildMonth(2019, 13, base).weeks)).toHaveLength(6);
		expect(days(buildMonth(2018, 13, base).weeks)).toHaveLength(5);
		expect(buildMonth(2019, 13, base).monthName).toBe('Pagume');
	});

	it('rejects invalid months', () => {
		expect(() => buildMonth(2019, 14, base)).toThrow();
	});
});

describe('date navigation', () => {
	it('moves across Pagume and year boundaries', () => {
		expect(shiftMonths({ year: 2019, month: 13, day: 1 }, 1)).toEqual({ year: 2020, month: 1, day: 1 });
		expect(shiftMonths({ year: 2020, month: 1, day: 1 }, -1)).toEqual({ year: 2019, month: 13, day: 1 });
		expect(shiftDays({ year: 2019, month: 13, day: 6 }, 1)).toEqual({ year: 2020, month: 1, day: 1 });
		expect(shiftDays({ year: 2018, month: 13, day: 5 }, 1)).toEqual({ year: 2019, month: 1, day: 1 });
	});

	it('clamps the day when the target month is shorter', () => {
		const r = shiftMonths({ year: 2018, month: 12, day: 30 }, 1);
		expect(r.year).toBe(2018);
		expect(r.month).toBe(13);
		expect(r.day).toBeLessThanOrEqual(5);
	});

	it('moves by years', () => {
		expect(shiftYears({ year: 2019, month: 3, day: 11 }, -1)).toEqual({ year: 2018, month: 3, day: 11 });
	});
});
