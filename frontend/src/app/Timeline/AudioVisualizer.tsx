import { useEffect } from "react";

type AudioVisualizerProps = {
	audioSource: string;
	zoom: number;

	/**
	 * The start time in milliseconds.
	 */
	startTime: number;
};

export function AudioVisualizer({ audioSource }: AudioVisualizerProps) {}
