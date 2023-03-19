self.onmessage = (msg) => {
	// Check if data was even given
	try {
		if (!msg.data) return;

		// Check if data is even array-like
		if (typeof msg.data.length !== "number") return;

		const data = Array.from<any>(msg.data);

		if (!data.some((item) => item && typeof item.length === "number")) return;

		const minPCM = (data satisfies ArrayLike<number>[]).reduce(
			(min, channel) => (channel.length < min ? channel.length : min),
			Infinity
		);

		for (let i = 0; i < minPCM; i++) {}
	} catch (e) {}
};

export {};
