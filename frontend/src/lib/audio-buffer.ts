export async function decodeAudioBuffer(buf: ArrayBuffer) {
	const audioContext = new AudioContext();

	return await audioContext.decodeAudioData(buf);
}
