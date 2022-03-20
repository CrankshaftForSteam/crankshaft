{
	const info = (...args) => console.info('[SMM]', ...args);

	// https://stackoverflow.com/a/2117523
	const uuidv4 = () => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
		(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);

	const createEl = (html) => {
		const tmpl = document.createElement('template');
		tmpl.innerHTML = html.trim();

		const el = tmpl.content.firstChild
		el.dataset.smmTeplate = '';
		return el;
	}
	
	// ===========================================================================

	class SMM extends EventTarget {
		constructor() {
			super();

			this.currentTab = 'home';
			this.currentAppId = undefined;

			this.socket = undefined;
		}

		socketConnect() {
			return new Promise((resolve) => {
				this.socket = new WebSocket('ws://localhost:8085');
				this.socket.addEventListener('open', (event) => {
					this.socketSend({ type: 'connected' })
					resolve();
				});
			})
		}

		socketSend(data) {
			if (!this.socket) {
				this.socketConnect();
			}
			this.socket.send(JSON.stringify(data));
		}

		// wtf
		async socketSendGet(data) {
			if (!this.socket) {
				await this.socketConnect();
			}

			return new Promise((resolve) => {
				const id = uuidv4();

				const handler = (event) => {
					const data = JSON.parse(event.data);
					if (data.id !== id) {
						return;
					}
					resolve(data);
					this.removeEventListener('message', handler);
				};

				this.socket.addEventListener('message', handler);

				this.socketSend({ ...data, id });
			});
		}

		async fetch(url) {
			console.info('fetch', url)
			return this.socketSendGet({ type: 'fetch', url });
		}

		switchToHome() {
			if (this.currentTab === 'home') {
				return;
			}

			info('Switched to home');
			this.currentTab = 'home';
			this.currentAppId = undefined;
			this.dispatchEvent(new CustomEvent('switchToHome'));
		}

		switchToCollections() {
			if (this.currentTab === 'collections') {
				return;
			}

			info('Switched to collections');
			this.currentTab = 'collections';
			this.currentAppId = undefined;
			this.dispatchEvent(new CustomEvent('switchToCollections'));
		}

		switchToAppDetails(appId) {
			if (this.currentTab === 'appDetails' && this.currentAppId === appId) {
				return;
			}

			info('Switched to app details for app', appId);
			this.currentTab = 'appDetails';
			this.currentAppId = appId;
			this.dispatchEvent(new CustomEvent('switchToAppDetails', { detail: { appId } }));
		}
	}

	// ===========================================================================

	const SELECTORS = {
		home: '[class*=libraryhome_Container]',
		collections: '[class*=allcollections_Container]',
		appDetails: '[class*=appdetails_Container]',
		appDetailsStoreLink: 'a[class^=appdetailsprimarylinkssection]',
		appDetailsHeader: '[class^="sharedappdetailsheader_TopCapsule"]',
	};

	const createTabObserver = (smm, mainLibraryEl) => {
		// Cleanup previous observer
		if (window.smmTabObserver) {
			window.smmTabObserver.disconnect();
			delete window.smmTabObserver;
		}

		const observer = new MutationObserver((mutationsList, observer) => {
	    // const addedNodes = mutationsList
	    // 	.filter((mutation) => mutation.target === mainLibraryEl)
	    // 	.map((mutation) => mutation.addedNodes);

	    // addedNodes.forEach(([node]) => {
	    // 	if (!node) {
	    // 		return;
	    // 	}

	    if (document.querySelector(SELECTORS.home)) {
	    	smm.switchToHome();
	    } else if (document.querySelector(SELECTORS.collections)) {
	    	smm.switchToCollections();
	    } else if (document.querySelector(SELECTORS.appDetails)) {
	    	const storeUrl = document.querySelector(SELECTORS.appDetailsStoreLink).href;
	    	const appId = (new URL(storeUrl)).pathname.split('/')[2];
	    	smm.switchToAppDetails(appId);
	    }
	  });
		observer.observe(mainLibraryEl, { subtree: true, childList: true,  });
		window.smmTabObserver = observer;
	}

	// ===========================================================================

	const start = () => {
		info('Successfully injected script');

		const smm = new SMM();
		window.smm = smm;

		const mainLibraryEl = document.querySelector('[class^=library_AppDetailsMain]');

		createTabObserver(smm, mainLibraryEl);

		// ===========================================================================

		// ProtonDB rating plugin

		const COLOURS = {
			borked: '#ff0000',
			bronze: '#cd7f32',
			silver: '#a6a6a6',
			gold: '#cfb53b',
			platinum: '#b4c7dc',
		}

		const protonDbCache = {};

		smm.addEventListener('switchToAppDetails', async (event) => {
			const { appId } = event.detail;
			let data = protonDbCache[appId];
			if (!data) {
				data = (await smm.fetch('https://www.protondb.com/api/v1/reports/summaries/' + appId + '.json'));
				protonDbCache[appId] = data;
			}
			const { tier } = data;

			document.querySelectorAll('[data-smm-protondb]').forEach((node) => node.remove());

			const indicator = createEl(`
				<a
					href="https://www.protondb.com/app/` + appId + `"
					style="
						position: absolute;
						top: 24px;
						left: 24px;

						display: flex;
						align-items: center;

						padding: 4px 8px;
						background-color: ` + COLOURS[tier] + `;
						color: rgba(0, 0, 0, 50%);
						font-size: 20px;
						text-decoration: none;
					"
					data-smm-protondb
				>
					<img
						src="http://localhost:8086/protondb-logo.svg"
						style="
							width: 20px;
							margin-right: 4px;
						"
					>
					<span>` + tier.charAt(0).toUpperCase() + tier.slice(1) + `</span>
				</a>
			`);

			document.querySelector(SELECTORS.appDetailsHeader).appendChild(indicator);
		});
	};

	start();
}