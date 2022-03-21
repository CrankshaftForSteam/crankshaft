import { info, uuidv4 } from "./util";

export class SMM extends EventTarget {
	currentTab: 'home' | 'collections' | 'appDetails';
	currentAppId?: string;

	socket?: WebSocket;

	constructor() {
		super();

		this.currentTab = 'home';
		this.currentAppId = undefined;

		this.socket = undefined;
	}

	socketConnect() {
		return new Promise<void>((resolve) => {
			this.socket = new WebSocket('ws://localhost:8085/ws');
			this.socket.addEventListener('open', (event) => {
				this.socketSend({ type: 'connected' })
				resolve();
			});
		})
	}

	async socketSend(data: Object) {
		if (!this.socket) {
			await this.socketConnect();
		}
		this.socket?.send(JSON.stringify(data));
	}

	// wtf
	async socketSendGet(data: Object) {
		if (!this.socket) {
			await this.socketConnect();
		}

		return new Promise((resolve) => {
			const id = uuidv4();

			const handler = (event: any) => {
				const data = JSON.parse(event.data);
				if (data.id !== id) {
					return;
				}
				resolve(data);
				this.removeEventListener('message', handler);
			};

			this.socket?.addEventListener('message', handler);

			this.socketSend({ ...data, id });
		});
	}

	async fetch(url: string) {
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

	switchToAppDetails(appId: string) {
		if (this.currentTab === 'appDetails' && this.currentAppId === appId) {
			return;
		}

		info('Switched to app details for app', appId);
		this.currentTab = 'appDetails';
		this.currentAppId = appId;
		this.dispatchEvent(new CustomEvent('switchToAppDetails', { detail: { appId } }));
	}
}