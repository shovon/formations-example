// Taken from https://usehooks-ts.com/react-hook/use-fetch

import { useEffect, useReducer, useRef } from "react";

export type State<T> =
	| { type: "LOADING" }
	| { type: "LOADED"; data: T }
	| { type: "ERROR"; error: Error };

type Cache<T> = { [url: string]: T };

// discriminated union type
type Action<T> =
	| { type: "loading" }
	| { type: "fetched"; payload: T }
	| { type: "error"; payload: Error };

export function useFetchArrayBuffer(
	url?: string | null,
	options?: RequestInit
): State<ArrayBuffer> {
	const cache = useRef<Cache<ArrayBuffer>>({});

	// Used to prevent state update if the component is unmounted
	const cancelRequest = useRef<boolean>(false);

	const initialState: State<ArrayBuffer> = {
		type: "LOADING",
	};

	// Keep state logic separated
	const fetchReducer = (
		state: State<ArrayBuffer>,
		action: Action<ArrayBuffer>
	): State<ArrayBuffer> => {
		switch (action.type) {
			case "loading":
				return { type: "LOADING" };
			case "fetched":
				return { type: "LOADED", data: action.payload };
			case "error":
				return { type: "ERROR", error: action.payload };
			default:
				return state;
		}
	};

	const [state, dispatch] = useReducer(fetchReducer, initialState);

	useEffect(() => {
		// Do nothing if the url is not given
		if (!url) return;

		cancelRequest.current = false;

		const fetchData = async () => {
			dispatch({ type: "loading" });

			// If a cache exists for this url, return it
			if (cache.current[url]) {
				dispatch({ type: "fetched", payload: cache.current[url] });
				return;
			}

			try {
				const response = await fetch(url, options);
				if (!response.ok) {
					throw new Error(response.statusText);
				}

				const data = await response.arrayBuffer();
				cache.current[url] = data;
				if (cancelRequest.current) return;

				dispatch({ type: "fetched", payload: data });
			} catch (error) {
				if (cancelRequest.current) return;

				dispatch({ type: "error", payload: error as Error });
			}
		};

		void fetchData();

		// Use the cleanup function for avoiding a possibly...
		// ...state update after the component was unmounted
		return () => {
			cancelRequest.current = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [url]);

	return state;
}
