self.onmessage = (msg) => {
	// Check if data was even given
	try {
		if (!msg.data) return;

		// Check if data is even array-like
		if (typeof msg.data.length !== "number") return;

		const d = Array.from<any>(msg.data);

		if (!d.some((item) => item && typeof item.length === "number")) return;

		const data: ArrayLike<number>[] = d;

		const minPCMLength = (data satisfies ArrayLike<number>[]).reduce(
			(min, channel) => (channel.length < min ? channel.length : min),
			Infinity
		);

		const pcm = new Float32Array(minPCMLength);

		for (let i = 0; i < minPCMLength; i++) {
			let sum = 0;
			for (const channel of data) {
				sum += channel[i];
			}
			pcm[i] = sum / data.length;
		}

		self.postMessage(pcm);
	} catch (e) {}
};

export {};
