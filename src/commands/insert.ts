import { type EthiopianCalendarSettings, effectiveDateFormat, effectiveTimeFormat } from '../settings';
import { formatEthiopianDate, formatTime, toEthiopian } from '../utils/date-format';
import type { TemplateContext } from '../utils/template';

/** The slice of Obsidian's `Editor` these helpers need; keeps them unit-testable. */
export interface InsertTarget {
	replaceSelection(text: string): void;
}

export function currentEthiopianDateText(settings: EthiopianCalendarSettings, now = new Date()): string {
	return formatEthiopianDate(toEthiopian(now), effectiveDateFormat(settings), settings.language);
}

export function currentTimeText(settings: EthiopianCalendarSettings, now = new Date()): string {
	return formatTime(now, effectiveTimeFormat(settings));
}

export function templateContext(settings: EthiopianCalendarSettings, now = new Date()): TemplateContext {
	return {
		now,
		language: settings.language,
		defaultDateFormat: effectiveDateFormat(settings),
		defaultTimeFormat: effectiveTimeFormat(settings),
	};
}

/** Inserts at the cursor (replacing only the current selection, if any, like core "Insert current date"). */
export function insertAtCursor(editor: InsertTarget, text: string): void {
	editor.replaceSelection(text);
}
