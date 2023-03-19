import { useEffect, useState } from "react";
import { useFetchArrayBuffer } from "../../hooks/use-fetch-array-buffer";
import { LogarithmicValue } from "../../lib/logarithmic-value";
import { useGetVisualizationData } from "./hooks/use-get-visualization-data/use-get-visualization-data";

type AudioVisualizerProps = {
	audioSource: string;
	camera: Readonly<{
		position: number;
		zoom: LogarithmicValue;
	}>;

	/**
	 * THe width is in pixels
	 */
	width: number;
	height: number;

	x: number;
	y: number;
};

export function AudioVisualizer({
	audioSource,
	camera,
	width,
	height,
	x,
	y,
}: AudioVisualizerProps) {
	const samples = useGetVisualizationData(
		audioSource,

		// TODO: having to divide by the zoom is fucked.
		//
		//   We need to refactor the
		//   code in the entire render function to use absolute positions.
		camera.position / camera.zoom.linear,
		width / camera.zoom.linear,
		width
	);
	const [imageSource, setImageSource] = useState<string | null>(null);

	useEffect(() => {
		if (!samples) return;
		const canvas = document.createElement("canvas");

		canvas.height = height;
		canvas.width = width;

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}

		for (const [i, sample] of Array.from(samples).entries()) {
			ctx.beginPath();
			ctx.lineWidth = 1;

			ctx.fillRect(
				i,
				(canvas.height - sample * canvas.height) / 2,
				1,
				sample * canvas.height
			);

			ctx.stroke();
		}

		setImageSource(canvas.toDataURL());
	}, [samples]);

	if (!imageSource) return null;

	return <image href={imageSource} height={height} width={width} x={0} y={y} />;
}
