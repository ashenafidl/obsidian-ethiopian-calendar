import { type DisplayLanguage, formatEthiopianDate, formatTime, toEthiopian } from './date-format';

export interface TemplateContext {
	now: Date;
	language: DisplayLanguage;
	defaultDateFormat: string;
	defaultTimeFormat: string;
}

export interface TemplateReplacement {
	/** Offset of the first character of the placeholder. */
	from: number;
	/** Offset just past the placeholder. */
	to: number;
	value: string;
}

export interface TemplateScan {
	replacements: TemplateReplacement[];
	/** Placeholders that look like ours (`{{ethiopian…}}`) but are not supported; left unchanged. */
	unknown: string[];
}

/** Matches `{{name}}` or `{{name:format}}`; the format may itself contain colons. */
const PLACEHOLDER = /\{\{\s*([A-Za-z][\w-]*)(?::([^}]*))?\s*\}\}/g;

export const SUPPORTED_VARIABLES = ['ethiopianDate', 'ethiopianTime'] as const;

function renderVariable(name: string, format: string | undefined, ctx: TemplateContext): string | null {
	switch (name) {
		case 'ethiopianDate':
			return formatEthiopianDate(toEthiopian(ctx.now), format || ctx.defaultDateFormat, ctx.language);
		case 'ethiopianTime':
			return formatTime(ctx.now, format || ctx.defaultTimeFormat);
		default:
			return null;
	}
}

/** Finds every supported placeholder in `text` and computes its value. */
export function scanTemplate(text: string, ctx: TemplateContext): TemplateScan {
	const replacements: TemplateReplacement[] = [];
	const unknown: string[] = [];
	for (const match of text.matchAll(PLACEHOLDER)) {
		const [raw, name = '', format] = match;
		const value = renderVariable(name, format, ctx);
		if (value === null) {
			// Other plugins' variables (e.g. core {{date}}) are none of our business;
			// only report names that look like a typo of ours.
			if (/^ethiopian/i.test(name)) unknown.push(raw);
			continue;
		}
		const from = match.index ?? 0;
		replacements.push({ from, to: from + raw.length, value });
	}
	return { replacements, unknown };
}

/** Replaces supported placeholders in `text`; everything else is left as-is. */
export function resolveTemplate(text: string, ctx: TemplateContext): string {
	const { replacements } = scanTemplate(text, ctx);
	let out = '';
	let last = 0;
	for (const r of replacements) {
		out += text.slice(last, r.from) + r.value;
		last = r.to;
	}
	return out + text.slice(last);
}
