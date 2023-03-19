import {
	State as FetchState,
	useFetchArrayBuffer,
} from "~/hooks/use-fetch-array-buffer";
import { useDecodeAudioBuffer } from "./use-decode-audio-buffer";
import { useGetAveragePCM } from "./use-get-pcm/use-get-pcm";

export function useGetVisualizationData(
	audioSource: string | null
): ArrayLike<number> | null {
	// TODO: separating things into different hooks is just stupid. Consider
	//   refactoring this so that hooks are not used.

	if (!audioSource) return null;
	const fetchState = useFetchArrayBuffer(audioSource);
	if (fetchState.type !== "LOADED") return null;
	const audioBuffer = useDecodeAudioBuffer(fetchState.data);
	if (!audioBuffer) return null;
	const pcm = useGetAveragePCM(audioBuffer);
}
