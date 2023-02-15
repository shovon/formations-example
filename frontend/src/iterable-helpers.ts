export function map<T, V>(
	iterable: Iterable<T>,
	mapping: (x: T) => V
): Iterable<V> {
	return {
		*[Symbol.iterator]() {
			for (const it of iterable) {
				yield mapping(it);
			}
		},
	};
}

export function getKV<K, V>(it: Iterable<[K, V]>, key: K): V | undefined {
	if (it instanceof Map) {
		return it.get(key);
	}

	for (const [k, v] of it) {
		if (k === key) {
			return v;
		}
	}
}

export function setKV<K, V>(
	it: Iterable<[K, V]>,
	key: K,
	value: V
): Iterable<[K, V]> {
	return {
		*[Symbol.iterator]() {
			for (const [k, v] of it) {
				yield k === key ? [k, value] : [k, v];
			}
		},
	};
}

export function unionKV<K, V>(it1: Iterable<[K, V]>, it2: Iterable<[K, V]>) {
	return new Map([...it1, ...it2]);
}

export function hasKV<K>(it: Iterable<[K, unknown]>, key: K): boolean {
	if (it instanceof Map) {
		return it.has(key);
	}

	for (const [k] of it) {
		if (k === key) {
			return true;
		}
	}

	return false;
}
