import { useEffect, useReducer, useRef, useState } from "react";
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

function Image({
	src,
	width,
	height,
	x,
	y,
}: {
	src: string;
	width: number;
	height: number;
	x: number;
	y: number;
}) {
	const previousSrc = useRef<string | null>(null);
	const [, update] = useReducer((obj) => ({}), {});

	useEffect(() => {
		previousSrc.current = src;
		update();
	}, [src]);

	if (previousSrc.current === null) {
		return <></>;
	}

	return (
		<>
			<image
				href={previousSrc.current}
				height={height}
				width={width}
				x={x}
				y={y}
				preserveAspectRatio="none"
				opacity={0}
			/>
			<image
				href={previousSrc.current}
				height={height}
				width={width}
				x={x}
				y={y}
				preserveAspectRatio="none"
			/>
		</>
	);
}

export function AudioVisualizer({
	audioSource,
	camera,
	width,
	height,
	x,
	y,
}: AudioVisualizerProps) {
	const avData = useGetVisualizationData(
		audioSource,

		// TODO: having to divide by the zoom is fucked.
		//
		//   We need to refactor the
		//   code in the entire render function to use absolute positions.
		camera.position / camera.zoom.linear,
		width / camera.zoom.linear,
		width,
		camera.zoom.linear
	);
	const [imageSource, setImageSource] = useState<string | null>(null);

	useEffect(() => {
		if (!avData) return;
		const canvas = document.createElement("canvas");

		canvas.height = height;
		canvas.width = width;

		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}

		for (const [i, sample] of Array.from(avData.samples).entries()) {
			ctx.beginPath();
			ctx.lineWidth = 1;
			ctx.strokeStyle = "rgb(128, 128, 128)";
			ctx.fillStyle = "rgb(200, 200, 200)";

			ctx.fillRect(
				i,
				(canvas.height - sample * canvas.height) / 2,
				1,
				sample * canvas.height
			);

			ctx.stroke();
		}

		setImageSource(canvas.toDataURL());
	}, [avData]);

	if (!imageSource || !avData) return null;

	return (
		<Image
			src={imageSource}
			height={height}
			width={(width * camera.zoom.linear) / avData.zoom}
			x={x - (camera.position - avData.startTime * camera.zoom.linear)}
			y={y}
		/>
	);
}
