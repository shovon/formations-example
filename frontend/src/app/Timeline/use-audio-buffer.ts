import { useEffect, useState } from "react";

export function useAudioBuffer(buf: ArrayBuffer) {
	const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
	useEffect(() => {
		(async () => {
			const audioCtx = new AudioContext();
			const audioBuffer = await audioCtx.decodeAudioData(buf);
			setAudioBuffer(audioBuffer);
		})();
	}, [buf]);
	return audioBuffer;
}
