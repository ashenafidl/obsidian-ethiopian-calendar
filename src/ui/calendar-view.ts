import { ButtonComponent, ExtraButtonComponent, ItemView, type WorkspaceLeaf } from 'obsidian';
import type EthiopianCalendarPlugin from '../main';
import { type CalendarCell, type CalendarMonth, buildMonth, sameDate, shiftDays, shiftMonths, shiftYears } from '../utils/calendar';
import {
	type SimpleDate,
	displayNumber,
	formatEthiopianDate,
	formatGregorianLong,
	gregorianMonthName,
	toEthiopian,
} from '../utils/date-format';

export const VIEW_TYPE_CALENDAR = 'ethiopian-calendar-view';

const TITLE_ID = `${VIEW_TYPE_CALENDAR}-title`;

const encodeDate = (d: SimpleDate) => `${d.year}-${d.month}-${d.day}`;
function decodeDate(value: string | undefined): SimpleDate | null {
	const parts = (value ?? '').split('-').map(Number);
	if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) return null;
	const [year = 0, month = 0, day = 0] = parts;
	return { year, month, day };
}

export class CalendarView extends ItemView {
	private today: SimpleDate = toEthiopian(new Date());
	private selected: SimpleDate = this.today;

	constructor(
		leaf: WorkspaceLeaf,
		private readonly plugin: EthiopianCalendarPlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_CALENDAR;
	}

	getDisplayText(): string {
		return 'Ethiopian calendar';
	}

	getIcon(): string {
		return 'calendar-days';
	}

	async onOpen(): Promise<void> {
		this.contentEl.addClass('ethcal-view');
		// Delegated day listeners on the persistent container survive re-renders and are
		// removed automatically when the view closes (registerDomEvent).
		this.registerDomEvent(this.contentEl, 'click', (evt) => this.onDayClick(evt));
		this.registerDomEvent(this.contentEl, 'keydown', (evt) => this.onKeyDown(evt));
		// Keep "today" correct across midnight.
		this.registerInterval(
			window.setInterval(() => {
				const now = toEthiopian(new Date());
				if (!sameDate(now, this.today)) {
					this.today = now;
					this.render();
				}
			}, 60_000),
		);
		this.render();
	}

	async onClose(): Promise<void> {
		this.contentEl.empty();
	}

	/** Called by the plugin after settings change. */
	applySettings(): void {
		this.render();
	}

	private get language() {
		return this.plugin.settings.language;
	}

	private select(date: SimpleDate, focus = false): void {
		this.selected = date;
		this.render(focus);
	}

	private goToToday(): void {
		this.today = toEthiopian(new Date());
		this.select(this.today, true);
	}

	private onDayClick(evt: MouseEvent): void {
		const target = evt.target instanceof HTMLElement ? evt.target.closest<HTMLElement>('[data-date]') : null;
		const date = decodeDate(target?.dataset.date);
		if (date) this.select(date);
	}

	private onKeyDown(evt: KeyboardEvent): void {
		if (!(evt.target instanceof HTMLElement) || !evt.target.dataset.date) return;
		const s = this.selected;
		let next: SimpleDate | null = null;
		switch (evt.key) {
			case 'ArrowLeft':
				next = shiftDays(s, -1);
				break;
			case 'ArrowRight':
				next = shiftDays(s, 1);
				break;
			case 'ArrowUp':
				next = shiftDays(s, -7);
				break;
			case 'ArrowDown':
				next = shiftDays(s, 7);
				break;
			case 'PageUp':
				next = evt.shiftKey ? shiftYears(s, -1) : shiftMonths(s, -1);
				break;
			case 'PageDown':
				next = evt.shiftKey ? shiftYears(s, 1) : shiftMonths(s, 1);
				break;
		}
		if (next) {
			evt.preventDefault();
			this.select(next, true);
		}
	}

	private render(focusSelected = false): void {
		let month: CalendarMonth;
		try {
			month = buildMonth(this.selected.year, this.selected.month, {
				language: this.language,
				weekStart: this.plugin.settings.weekStart,
				today: this.today,
			});
		} catch (e) {
			console.error('[ethiopian-calendar] Failed to build month', e);
			const today = toEthiopian(new Date());
			if (!sameDate(this.selected, today)) {
				// Recover by jumping back to today.
				this.selected = today;
				this.render(focusSelected);
			} else {
				this.contentEl.empty();
				this.contentEl.createEl('p', { text: 'Could not render the calendar. See the developer console for details.' });
			}
			return;
		}

		const root = this.contentEl;
		root.empty();
		const container = root.createDiv({ cls: 'ethcal' });
		this.renderHeader(container, month);

		this.renderGrid(container, month);

		if (focusSelected) {
			root.querySelector<HTMLElement>(`[data-date="${encodeDate(this.selected)}"]`)?.focus();
		}
	}

	private renderHeader(container: HTMLElement, month: CalendarMonth): void {
		const header = container.createDiv({ cls: 'ethcal-header' });
		const titles = header.createDiv({ cls: 'ethcal-titles' });
		const title = titles.createEl('h2', { cls: 'ethcal-title', attr: { id: TITLE_ID, 'aria-live': 'polite' } });
		title.createSpan({ cls: 'ethcal-title-month', text: month.monthName });
		title.appendText(' ');
		title.createSpan({ cls: 'ethcal-title-year', text: displayNumber(month.year, this.language) });
		titles.createDiv({ cls: 'ethcal-subtitle', text: month.gregorianLabel });

		const nav = header.createEl('nav', { cls: 'ethcal-nav', attr: { 'aria-label': 'Calendar navigation' } });
		// Native Obsidian components, so the controls follow the active theme.
		const iconButton = (icon: string, label: string, onClick: () => void) =>
			new ExtraButtonComponent(nav).setIcon(icon).setTooltip(label).onClick(onClick);

		iconButton('chevrons-left', 'Previous year', () => this.select(shiftYears(this.selected, -1)));
		iconButton('chevron-left', 'Previous month', () => this.select(shiftMonths(this.selected, -1)));
		new ButtonComponent(nav)
			.setButtonText('Today')
			.setTooltip('Go to today')
			.setClass('clickable-icon')
			.setClass('ethcal-today')
			.onClick(() => this.goToToday());
		iconButton('chevron-right', 'Next month', () => this.select(shiftMonths(this.selected, 1)));
		iconButton('chevrons-right', 'Next year', () => this.select(shiftYears(this.selected, 1)));
	}

	private renderGrid(container: HTMLElement, month: CalendarMonth): void {
		// The `calendar` class is the convention themes (e.g. Minimal) use to skip their
		// markdown-table tweaks such as row numbers: they target `table:not(.calendar)`.
		const table = container.createEl('table', { cls: ['ethcal-grid', 'calendar'], attr: { 'aria-labelledby': TITLE_ID } });
		const headRow = table.createEl('thead').createEl('tr');
		for (const name of month.headers) {
			headRow.createEl('th', {
				text: this.language === 'english' ? name.slice(0, 3) : name,
				attr: { scope: 'col', abbr: name, title: name },
			});
		}

		const inMonth = month.weeks.flat().some((c) => c.inMonth && sameDate(c.ethiopian, this.selected));
		const tbody = table.createEl('tbody');
		let focusAssigned = false;
		for (const week of month.weeks) {
			const row = tbody.createEl('tr');
			for (const cell of week) {
				const td = row.createEl('td');
				const isSelected = sameDate(cell.ethiopian, this.selected);
				// Roving tabindex: exactly one day is tabbable.
				const tabbable: boolean = isSelected || (!inMonth && !focusAssigned && cell.inMonth);
				focusAssigned ||= tabbable;
				this.renderDay(td, cell, isSelected, tabbable);
			}
		}
	}

	private renderDay(td: HTMLElement, cell: CalendarCell, isSelected: boolean, tabbable: boolean): void {
		const lang = this.language;
		const g = cell.gregorian;
		const label = [
			formatEthiopianDate(cell.ethiopian, 'dddd, MMMM D, YYYY', lang),
			formatGregorianLong(g),
			cell.isToday ? 'today' : '',
		]
			.filter(Boolean)
			.join(' — ');

		const btn = td.createEl('button', {
			cls: 'ethcal-day',
			attr: {
				type: 'button',
				'data-date': encodeDate(cell.ethiopian),
				'aria-label': label,
				'aria-pressed': String(isSelected),
				tabindex: tabbable ? '0' : '-1',
			},
		});
		btn.toggleClass('is-today', cell.isToday);
		btn.toggleClass('is-active', isSelected);
		btn.toggleClass('is-faded', !cell.inMonth);
		if (cell.isToday) btn.setAttr('aria-current', 'date');

		btn.createSpan({ cls: 'ethcal-day-eth', text: displayNumber(cell.ethiopian.day, lang) });
		if (this.plugin.settings.showGregorian) {
			const showMonth = g.day === 1 || cell.ethiopian.day === 1;
			btn.createSpan({
				cls: 'ethcal-day-greg',
				text: showMonth ? `${gregorianMonthName(g.month).slice(0, 3)} ${g.day}` : String(g.day),
			});
		}
	}
}
