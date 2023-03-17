import { useEffect } from "react";
import useFetch from "../../hooks/use-fetch";

type AudioVisualizerProps = {
	audioSource: string;
	zoom: number;

	/**
	 * The start time in milliseconds.
	 */
	startTime: number;
};

export function AudioVisualizer({ audioSource }: AudioVisualizerProps) {
	const { data, error } = useFetch(audioSource);

	useEffect(() => {
		console.log(error);
		console.log(data);
	}, [data]);

	if (error) {
		return <></>;
	}

	return <></>;
}
