self.onmessage = (msg) => {
	try {
		if (!msg.data) return;

		type Data = {
			startTime: number;
			duration: number;
			sampleRate: number;
			pcm: ArrayLike<number>;
		};
	} catch (e) {}
};

export {};
