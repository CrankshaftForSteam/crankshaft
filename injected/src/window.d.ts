import { SMM } from "./SMM";

declare global {
	interface Window {
		smm?: SMM
		smmTabObserver?: MutationObserver;
	}
}