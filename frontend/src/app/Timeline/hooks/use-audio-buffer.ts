import { useEffect, useState } from "react";

/**
 *
 * @param buf An array buffer containing encoded audio data that needs to be
 *   decoded
 * @returns Null if the buf is null or cannot be decoded, otherwise an
 *   AudioBuffer is returned
 */
export function useAudioBuffer(buf: ArrayBuffer | null) {
	if (!buf) return null;

	const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
	useEffect(() => {
		(async () => {
			const audioCtx = new AudioContext();
			const audioBuffer = await audioCtx.decodeAudioData(buf);
			setAudioBuffer(audioBuffer);
		})().catch(console.error);
	}, [buf]);

	return audioBuffer;
}
