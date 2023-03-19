import { useEffect } from "react";
import {
	State as FetchState,
	useFetchArrayBuffer,
} from "~/hooks/use-fetch-array-buffer";
import { useDecodeAudioBuffer } from "./use-decode-audio-buffer";
import { useGetAveragePCM } from "./use-get-pcm/use-get-pcm";

type VisualizationData = {
	startTime: number;
	duration: number;
};

export function useGetVisualizationData(
	audioSource: string | null,
	startTime: number,
	duration: number
): ArrayLike<number> | null {
	// TODO: separating things into different hooks is just stupid. Consider
	//   refactoring this so that hooks are not used.

	console.log(startTime, duration);

	const fetchState = useFetchArrayBuffer(audioSource);
	const audioBuffer = useDecodeAudioBuffer(
		fetchState.type === "LOADED" ? fetchState.data : null
	);
	const pcm = useGetAveragePCM(audioBuffer);

	useEffect(() => {
		console.log(pcm);
	}, [pcm]);

	return null;
}
