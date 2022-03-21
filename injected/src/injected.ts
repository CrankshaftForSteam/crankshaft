import { loadProtonDBPlugin } from './protondb-plugin';
import { SELECTORS } from './selectors';
import { SMM } from './SMM';
import { createTabObserver } from './tab-observer';
import { createEl, info, uuidv4 } from './util';

{
	const start = () => {
		info('Successfully injected script');

		const smm = new SMM();
		window.smm = smm;

		const mainLibraryEl = document.querySelector<HTMLDivElement>('[class^=library_AppDetailsMain]')!;

		createTabObserver(smm, mainLibraryEl);

		loadProtonDBPlugin(smm);
	};

	start();
}