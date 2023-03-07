const listeners = new Set<() => void>();

export const mouseUpEvents = (() => {
	return Object.freeze({
		addListener: (event: () => void) => {
			listeners.add(event);
		},
		removeListener: (event: () => void) => {
			listeners.delete(event);
		},
	});
})();

document.addEventListener("mouseup", () => {
	for (const listener of listeners) {
		listener();
	}
});
