import { describe, expect, it } from 'vitest';
import { type TemplateContext, resolveTemplate, scanTemplate } from '../src/utils/template';

// Meskerem 8, 2019 at 14:35 local time.
const ctx: TemplateContext = {
	now: new Date(2026, 8, 18, 14, 35),
	language: 'english',
	defaultDateFormat: 'MMMM D, YYYY',
	defaultTimeFormat: 'HH:mm',
};

describe('resolveTemplate', () => {
	it('resolves the documented variables', () => {
		expect(resolveTemplate('{{ethiopianDate}}', ctx)).toBe('Meskerem 8, 2019');
		expect(resolveTemplate('{{ethiopianDate:YYYY-MM-DD}}', ctx)).toBe('2019-01-08');
		expect(resolveTemplate('{{ethiopianTime}}', ctx)).toBe('14:35');
		expect(resolveTemplate('{{ethiopianTime:HH:mm}}', ctx)).toBe('14:35');
		expect(resolveTemplate('{{ethiopianTime:h:mm A}}', ctx)).toBe('2:35 ማታ');
	});

	it('uses the configured defaults and language', () => {
		const am = { ...ctx, language: 'amharic' as const, defaultTimeFormat: 'h:mm a' };
		expect(resolveTemplate('{{ethiopianDate}} {{ethiopianTime}}', am)).toBe('መስከረም 8, 2019 2:35 ማታ');
	});

	it('replaces every occurrence and keeps surrounding text', () => {
		const text = '# {{ethiopianDate}}\nCreated {{ethiopianDate:D/M/YYYY}} at {{ethiopianTime}}.';
		expect(resolveTemplate(text, ctx)).toBe('# Meskerem 8, 2019\nCreated 8/1/2019 at 14:35.');
	});

	it('tolerates whitespace inside braces', () => {
		expect(resolveTemplate('{{ ethiopianDate }}', ctx)).toBe('Meskerem 8, 2019');
	});

	it('falls back to the default format for an empty suffix', () => {
		expect(resolveTemplate('{{ethiopianDate:}}', ctx)).toBe('Meskerem 8, 2019');
	});

	it('leaves other and unknown variables unchanged', () => {
		const text = '{{date}} {{title}} {{ethiopianDat}} {ethiopianDate}';
		expect(resolveTemplate(text, ctx)).toBe(text);
	});
});

describe('scanTemplate', () => {
	it('reports offsets for each replacement', () => {
		const text = 'a {{ethiopianTime}} b';
		const { replacements } = scanTemplate(text, ctx);
		expect(replacements).toEqual([{ from: 2, to: 19, value: '14:35' }]);
		expect(text.slice(2, 19)).toBe('{{ethiopianTime}}');
	});

	it('reports unsupported ethiopian* variables but ignores foreign ones', () => {
		const { unknown, replacements } = scanTemplate('{{ethiopianYear}} {{date:YYYY}} {{ethiopianDate}}', ctx);
		expect(unknown).toEqual(['{{ethiopianYear}}']);
		expect(replacements).toHaveLength(1);
	});
});
