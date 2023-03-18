import { useEffect, useState } from "react";
import Worker from "./worker?worker";

/**
 * Given a multi-channel audio buffer, get an array of PCM data, containing
 * the average of the two channels.
 * @param audioBuffer An audio buffer containing raw multi-channel audio data.
 * @returns Null if AudioBuffer is null or if it hasn't been averaged yet;
 *   otherwise returns an array of PCM data.
 */
export function useGetAveragePCM(audioBuffer: AudioBuffer | null) {
	const [audioPcm, setAudioPcm] = useState<Float32Array | null>(null);

	useEffect(() => {
		let worker: Worker | null = null;
		if (audioBuffer && !audioPcm) {
			worker = new Worker();
			worker.onmessage = (event) => {
				console.log(event.data);
			};
		} else if (!audioBuffer) {
			setAudioPcm(null);
		}

		return () => {
			worker?.terminate();
		};
	}, [audioBuffer, audioPcm]);

	return audioPcm;
}
