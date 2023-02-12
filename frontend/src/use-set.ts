import { useReducer, useRef } from "react";

export const useSet = <K>(initial?: Iterable<K>) => {
	const setRef = useRef<Set<K>>(new Set(initial));
	const [, update] = useReducer(() => ({}), {});

	return {
		add(...values: K[]) {
			for (const value of values) {
				setRef.current.add(value);
			}
			update();
		},
		has(value: K): boolean {
			return setRef.current.has(value);
		},
		clear() {
			setRef.current.clear();
			update();
		},
		custom(fn: (set: Set<K>) => void) {
			fn(setRef.current);
			update();
		},
	};
};
