import { type Editor, Notice } from 'obsidian';
import type EthiopianCalendarPlugin from '../main';
import { resolveTemplate, scanTemplate } from '../utils/template';
import { currentEthiopianDateText, currentTimeText, insertAtCursor, templateContext } from './insert';

function reportError(action: string, error: unknown): void {
	console.error(`[ethiopian-calendar] ${action} failed`, error);
	new Notice(`Could not ${action}. See the developer console for details.`);
}

function resolveVariablesInEditor(plugin: EthiopianCalendarPlugin, editor: Editor): void {
	const ctx = templateContext(plugin.settings);
	const selection = editor.getSelection();
	const source = selection || editor.getValue();
	const { replacements, unknown } = scanTemplate(source, ctx);

	if (unknown.length > 0) {
		console.warn('[ethiopian-calendar] Unsupported template variables left unchanged:', unknown);
		new Notice(`Unsupported variable left unchanged: ${[...new Set(unknown)].join(', ')}`);
	}
	if (replacements.length === 0) {
		if (unknown.length === 0) new Notice('No Ethiopian template variables found.');
		return;
	}

	if (selection) {
		editor.replaceSelection(resolveTemplate(selection, ctx));
		return;
	}
	// Apply targeted changes in one undoable transaction so the rest of the note is untouched.
	editor.transaction({
		changes: replacements.map((r) => ({
			from: editor.offsetToPos(r.from),
			to: editor.offsetToPos(r.to),
			text: r.value,
		})),
	});
}

export function registerCommands(plugin: EthiopianCalendarPlugin): void {
	// editorCallback: the commands only show up (palette and `/` slash menu) when a Markdown editor is active,
	// which is exactly the "no editor" case handled for free.
	plugin.addCommand({
		id: 'insert-current-ethiopian-date',
		name: 'Insert current Ethiopian date',
		editorCallback: (editor) => {
			try {
				insertAtCursor(editor, currentEthiopianDateText(plugin.settings));
			} catch (e) {
				reportError('insert the Ethiopian date', e);
			}
		},
	});

	plugin.addCommand({
		id: 'insert-current-time',
		name: 'Insert current time',
		editorCallback: (editor) => {
			try {
				insertAtCursor(editor, currentTimeText(plugin.settings));
			} catch (e) {
				reportError('insert the time', e);
			}
		},
	});

	plugin.addCommand({
		id: 'replace-template-variables',
		name: 'Replace Ethiopian template variables in note or selection',
		editorCallback: (editor) => {
			try {
				resolveVariablesInEditor(plugin, editor);
			} catch (e) {
				reportError('replace template variables', e);
			}
		},
	});

	plugin.addCommand({
		id: 'open-calendar',
		name: 'Open calendar',
		callback: () => {
			void plugin.activateCalendarView();
		},
	});
}
