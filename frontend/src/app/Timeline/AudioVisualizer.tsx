import { useEffect } from "react";
import { useFetchArrayBuffer } from "../../hooks/use-fetch-array-buffer";

type AudioVisualizerProps = {
	audioSource: string;
	zoom: number;

	/**
	 * The start time in milliseconds.
	 */
	startTime: number;
};

export function AudioVisualizer({ audioSource }: AudioVisualizerProps) {
	const state = useFetchArrayBuffer(audioSource);

	useEffect(() => {}, [state]);

	if (state.type === "ERROR") {
		console.error(state.error);
		return <></>;
	}

	if (state.type === "LOADING") {
		return <></>;
	}

	return <></>;
}
