import { useEffect, useState } from "react";
import {
	State as FetchState,
	useFetchArrayBuffer,
} from "~/hooks/use-fetch-array-buffer";
import { useDecodeAudioBuffer } from "./use-decode-audio-buffer";
import { useGetAveragePCM } from "./use-get-pcm/use-get-pcm";
import Worker from "./worker?worker";

export function useGetVisualizationData(
	audioSource: string | null,
	startTime: number,
	duration: number,
	maxSamples: number
): ArrayLike<number> | null {
	const [samples, setSamples] = useState<ArrayLike<number> | null>(null);

	// TODO: using React hooks to load audio data like this is fucking stupid.
	//   Just define ONE hook, and a set of non-hook functions. That's it!

	const fetchState = useFetchArrayBuffer(audioSource);
	const audioBuffer = useDecodeAudioBuffer(
		fetchState.type === "LOADED" ? fetchState.data : null
	);
	const pcm = useGetAveragePCM(audioBuffer);

	useEffect(() => {
		let worker: Worker | null = null;

		if (!audioBuffer || !pcm) return;

		worker = new Worker();

		type Data = {
			startTime: number;
			duration: number;
			sampleRate: number;
			pcm: ArrayLike<number>;
			maxSamples: number;
		};

		const data: Data = {
			startTime,
			duration,
			sampleRate: audioBuffer.sampleRate,
			pcm,
			maxSamples,
		};

		worker.onmessage = (msg) => {
			// console.log(msg.data);
			setSamples(msg.data);
		};
		worker.postMessage(data);

		return () => {
			worker?.terminate();
		};
	}, [audioBuffer, pcm, startTime, duration]);

	return samples;
}
