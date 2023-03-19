import { useEffect, useState } from "react";

/**
 * Decodes an ArrayBuffer and returns either an AudioBuffer, or null if the
 * ArrayBuffer is null or cannot be decoded.
 * @param buf An array buffer containing encoded audio data that needs to be
 *   decoded
 * @returns Null if the buf is null or cannot be decoded, otherwise an
 *   AudioBuffer is returned
 */
export function useDecodeAudioBuffer(buf: ArrayBuffer): AudioBuffer | null {
	const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
	useEffect(() => {
		(async () => {
			const audioCtx = new AudioContext();
			const audioBuffer = await audioCtx.decodeAudioData(buf);
			setAudioBuffer(audioBuffer);

			// TODO: there needs to be a way to notify the client code that decoding
			//  failed for some reason,
		})().catch(console.error);
	}, [buf]);

	return audioBuffer;
}
