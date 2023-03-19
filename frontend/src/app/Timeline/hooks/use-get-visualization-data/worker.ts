function maxAbs(a: number, b: number): number {
	return Math.max(Math.abs(a), Math.abs(b));
}

function downsample(samples: ArrayLike<number>, maxSamples: number) {
	const downsampledSamples = new Float32Array(maxSamples);

	const sampleRatio = Math.ceil(samples.length / maxSamples);

	let max = 0;
	let count = 0;

	for (let i = 0; i < samples.length; i++) {
		if (i !== 0 && i % sampleRatio === 0) {
			downsampledSamples[count] = max;
			count++;
			max = 0;
		} else {
			max = maxAbs(max, samples[i]);
		}
	}

	return downsampledSamples;
}

self.onmessage = (msg) => {
	try {
		type Data = {
			startTime: number;
			duration: number;
			sampleRate: number;
			pcm: ArrayLike<number>;
			maxSamples: number;
		};

		const data: Data = msg.data;

		const { startTime, duration, sampleRate, pcm, maxSamples } = data;

		const startSample = Math.floor(startTime * (sampleRate / 1000));
		const endSample = Math.floor((startTime + duration) * (sampleRate / 1000));

		self.postMessage(
			downsample(Array.from(pcm).slice(startSample, endSample), maxSamples)
		);
	} catch (e) {}
};

export {};
