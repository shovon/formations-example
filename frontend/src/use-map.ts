import { useReducer, useRef } from "react";

export function useMap<K, V>(initialValues?: Iterable<[K, V]>) {
	const mapRef = useRef(new Map(initialValues || []));
	const [, update] = useReducer(() => ({}), {});

	return {
		get(key: K): V | undefined {
			return mapRef.current.get(key);
		},
		set(key: K, value: V) {
			mapRef.current.set(key, value);
			update();
		},
		*[Symbol.iterator](): Iterator<[K, V]> {
			yield* mapRef.current;
		},
	};
}
