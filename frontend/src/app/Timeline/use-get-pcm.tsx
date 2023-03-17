import { useEffect, useReducer } from "react";
import { useFetchArrayBuffer } from "../../hooks/use-fetch-array-buffer";

type UseAudioProps = {
	audioSource: string;
};

type State =
	| { type: "LOADING" }
	| { type: "LOADED"; data: Float32Array }
	| { type: "ERROR"; error: Error };

type Action =
	| { type: "AUDIO_LOADING" }
	| { type: "LOADED"; payload: Float32Array }
	| { type: "ERROR"; payload: Error };

export function useAudio({ audioSource }: UseAudioProps) {
	const audioState = useFetchArrayBuffer(audioSource);

	const reducer = (state: State, action: Action): State => {
		switch (action.type) {
			case "AUDIO_LOADING":
				return { type: "LOADING" };
			case "LOADED":
				return { type: "LOADED", data: action.payload };
			case "ERROR":
				return { type: "ERROR", error: action.payload };
			default:
				return state;
		}
	};

	const [state, dispatch] = useReducer(reducer, { type: "LOADING" });

	useEffect(() => {
		switch (audioState.type) {
			case "LOADING":
				dispatch({ type: "AUDIO_LOADING" });
				break;
			case "LOADED":
				dispatch({ type: "AUDIO_LOADING" });
				// TODO: Decode audio
				break;
			case "ERROR":
				dispatch({ type: audioState.type, payload: audioState.error });
				break;
		}
	}, [audioState, audioSource]);

	useEffect(() => {
		switch (state.type) {
			case "LOADING":
				break;
			case "LOADED":
				break;
			case "ERROR":
				break;
		}
	}, [audioState, audioSource, state]);

	return audioState;
}
