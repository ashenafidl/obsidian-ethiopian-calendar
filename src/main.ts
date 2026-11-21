import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import { type EthiopianCalendarSettings, normalizeSettings } from './settings';
import { CalendarView, VIEW_TYPE_CALENDAR } from './ui/calendar-view';
import { EthiopianCalendarSettingTab } from './ui/settings-tab';

export default class EthiopianCalendarPlugin extends Plugin {
	settings!: EthiopianCalendarSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_CALENDAR, (leaf) => new CalendarView(leaf, this));
		this.addRibbonIcon('calendar-days', 'Open Ethiopian calendar', () => {
			void this.activateCalendarView();
		});
		registerCommands(this);
		this.addSettingTab(new EthiopianCalendarSettingTab(this.app, this));
	}

	async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.refreshCalendarViews();
	}

	/** Reveals the calendar tab, creating it in the main area if it isn't open yet. */
	async activateCalendarView(): Promise<void> {
		const { workspace } = this.app;
		const leaf = workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)[0] ?? workspace.getLeaf('tab');
		if (leaf.view.getViewType() !== VIEW_TYPE_CALENDAR) {
			await leaf.setViewState({ type: VIEW_TYPE_CALENDAR, active: true });
		}
		await workspace.revealLeaf(leaf);
	}

	private refreshCalendarViews(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_CALENDAR)) {
			if (leaf.view instanceof CalendarView) leaf.view.applySettings();
		}
	}
}
