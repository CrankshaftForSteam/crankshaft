export const info = (...args: any[]) => console.info('[SMM]', ...args);

// https://stackoverflow.com/a/2117523
// @ts-ignore
export const uuidv4 = () => ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
	(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
);

export const createEl = <T extends HTMLElement>(html: string) => {
	const tmpl = document.createElement('template');
	tmpl.innerHTML = html.trim();

	const el = tmpl.content.firstChild as T;
	el.dataset.smmTeplate = '';
	return el;
}
