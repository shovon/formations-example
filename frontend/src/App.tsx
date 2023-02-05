import { css } from "@emotion/css";
import { useReducer, useRef, useState, ReactNode } from "react";
import { LogarithmicValue } from "./logarithmic-value";
import { Vector2 } from "./vector2";
import { Compute } from "./Compute";

type Camera = {
	position: Vector2;
	zoom: LogarithmicValue;
};

function App() {
	const [camera, updateCamera] = useReducer<
		(state: Camera, partialState: Partial<Camera>) => Camera
	>((state, partialState) => ({ ...state, ...partialState }), {
		zoom: LogarithmicValue.logarithmic(0),
		position: new Vector2(0, 0),
	});
	const divRef = useRef<HTMLDivElement | null>();
	const svgRef = useRef<SVGSVGElement | null>(null);
	const mousePositionRef = useRef(new Vector2(0, 0));
	const [, update] = useReducer(() => ({}), {});

	return (
		<div
			onMouseMove={(e) => {
				if (divRef.current) {
					const rect = divRef.current.getBoundingClientRect();
					const rectPos = new Vector2(rect.left, rect.top);
					const clientXY = new Vector2(e.clientX, e.clientY);

					mousePositionRef.current = clientXY.sub(rectPos);
				}
			}}
			ref={(ref) => {
				divRef.current = ref;
				if (!divRef.current) return;
				divRef.current.addEventListener(
					"wheel",
					(e) => {
						e.preventDefault();

						if (!divRef.current) return;

						const rect = divRef.current.getBoundingClientRect();
						const dimensions = new Vector2(rect.width, rect.height);

						if (e.ctrlKey) {
							const newZoom = camera.zoom.addLogarithmic(-e.deltaY * 0.01);

							const mousePosCentered = mousePositionRef.current
								.sub(dimensions.scalar(1 / 2))
								.hadamard(new Vector2(1, -1));

							const mousePosScaled = mousePosCentered.scalar(
								newZoom.addLogarithmic(-camera.zoom.logarithmic).linear
							);

							const displacement = mousePosScaled.sub(mousePosCentered);

							const newPos = camera.position.add(
								displacement.scalar(newZoom.linear)
							);

							updateCamera({
								zoom: newZoom,
								position: newPos,
							});
						} else {
							const delta = new Vector2(e.deltaX, -e.deltaY);

							updateCamera({
								position: camera.position.add(delta),
							});
						}
					},
					{ passive: false }
				);
			}}
		>
			<svg
				ref={(ref) => {
					if (ref === null || svgRef.current === ref) return;
					svgRef.current = ref;

					const observer = new ResizeObserver(() => {});
					update();
				}}
				className={css`
					display: block;
					border: 1px solid black;
					box-sizing: border-box;
					width: 100vw;
					height: 100vh;
				`}
			>
				<Compute>
					{() => {
						const svg = svgRef.current;
						if (!svg) return null;

						const clientRect = svg.getBoundingClientRect();
						const svgDimensions = new Vector2(
							clientRect.width,
							clientRect.height
						);

						return (
							<Compute>
								{() => {
									return (
										<circle cx="50" cy="50" r={`${camera.zoom.linear * 50}`} />
									);
								}}
							</Compute>
						);
					}}
				</Compute>
			</svg>

			<div
				className={css`
					position: absolute;
					font-size: 0.85em;
					top: 0;
					right: 0;
					padding: 5px 10px;
					background: #bbb;
					border-bottom-left-radius: 5px;
				`}
			>
				Top Right
			</div>
		</div>
	);
}

export default App;
