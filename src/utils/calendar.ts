import Kenat, { MonthGrid, type MonthGridDay } from 'kenat';
import {
	type DisplayLanguage,
	type SimpleDate,
	ethiopianMonthName,
	ethiopianWeekday,
	gregorianMonthName,
	kenatLang,
	toGregorian,
} from './date-format';

export interface CalendarCell {
	ethiopian: SimpleDate;
	gregorian: SimpleDate;
	/** 0 = Sunday. */
	weekday: number;
	isToday: boolean;
	/** False for the faded days from the previous/next month that fill the grid. */
	inMonth: boolean;
}

export interface CalendarMonth {
	year: number;
	month: number;
	monthName: string;
	/** Weekday names, starting at the configured first day of the week. */
	headers: string[];
	/** Rows of 7 days; empty cells in the first and last row hold days from the neighbouring months. */
	weeks: CalendarCell[][];
	/** E.g. "November – December 2026" or "August 2026 – September 2027". */
	gregorianLabel: string;
}

export interface BuildMonthOptions {
	language: DisplayLanguage;
	weekStart: number;
	today: SimpleDate;
}

export function sameDate(a: SimpleDate | null | undefined, b: SimpleDate | null | undefined): boolean {
	return !!a && !!b && a.year === b.year && a.month === b.month && a.day === b.day;
}

function fromGridDay(day: MonthGridDay, today: SimpleDate): CalendarCell {
	// The grid is generated with Arabic numerals, so these are numbers.
	const ethiopian = { year: Number(day.ethiopian.year), month: Number(day.ethiopian.month), day: Number(day.ethiopian.day) };
	const { year, month, day: d } = day.gregorian;
	return {
		ethiopian,
		gregorian: { year, month, day: d },
		weekday: day.weekday,
		isToday: sameDate(ethiopian, today),
		inMonth: true,
	};
}

/** A neighbouring-month day, derived through Kenat. */
function adjacentCell(ethiopian: SimpleDate, today: SimpleDate): CalendarCell {
	return {
		ethiopian,
		gregorian: toGregorian(ethiopian),
		weekday: ethiopianWeekday(ethiopian),
		isToday: sameDate(ethiopian, today),
		inMonth: false,
	};
}

function gregorianLabel(first: SimpleDate, last: SimpleDate): string {
	const a = gregorianMonthName(first.month);
	const b = gregorianMonthName(last.month);
	if (first.year === last.year) {
		return first.month === last.month ? `${a} ${first.year}` : `${a} – ${b} ${first.year}`;
	}
	return `${a} ${first.year} – ${b} ${last.year}`;
}

/** Builds a month grid with Kenat (handles Pagume and leap years). Throws on invalid year/month. */
export function buildMonth(year: number, month: number, opts: BuildMonthOptions): CalendarMonth {
	const grid = MonthGrid.create({
		year,
		month,
		weekStart: opts.weekStart,
		useGeez: false,
		weekdayLang: kenatLang(opts.language),
	});

	const leading = grid.days.findIndex((d) => d !== null);
	const days = grid.days.filter((d): d is MonthGridDay => d !== null).map((d) => fromGridDay(d, opts.today));
	const first = days[0];
	const last = days[days.length - 1];
	if (!first || !last) throw new RangeError(`Empty month: ${year}/${month}`);

	const cells: CalendarCell[] = [];
	for (let i = leading; i > 0; i--) cells.push(adjacentCell(shiftDays(first.ethiopian, -i), opts.today));
	cells.push(...days);
	// Only complete the last row; never add extra rows.
	for (let i = 1; cells.length % 7 !== 0; i++) cells.push(adjacentCell(shiftDays(last.ethiopian, i), opts.today));

	const weeks: CalendarCell[][] = [];
	for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

	return {
		year,
		month,
		monthName: ethiopianMonthName(month, opts.language),
		headers: grid.headers,
		weeks,
		gregorianLabel: gregorianLabel(first.gregorian, last.gregorian),
	};
}

/** Moves an Ethiopian date by whole months (13 per year), clamping the day to the target month. */
export function shiftMonths(date: SimpleDate, delta: number): SimpleDate {
	return new Kenat({ ...date }).addMonths(delta).getEthiopian();
}

export function shiftYears(date: SimpleDate, delta: number): SimpleDate {
	return new Kenat({ ...date }).addYears(delta).getEthiopian();
}

export function shiftDays(date: SimpleDate, delta: number): SimpleDate {
	return new Kenat({ ...date }).addDays(delta).getEthiopian();
}
