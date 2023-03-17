/**
 * Represents an object that has a getBoundingClientRect() method.
 */
export type WithBoundingClientRect = {
	getBoundingClientRect(): {
		left: number;
		top: number;
		right: number;
		bottom: number;
		width: number;
		height: number;
	};
};
