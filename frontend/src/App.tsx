import { css } from "@emotion/css";
import { useReducer, useRef, useState, ReactNode } from "react";
import { LogarithmicValue } from "./logarithmic-value";
import { hadamard, scalarMul as scalarMulV2, toColumnVector } from "./vector2";
import { Compute } from "./Compute";
import { scale2D, translate2D } from "./matrix";
import { array } from "vectorious";
import {
	Vector2,
	sub as subV2,
	hadamard as hadamardV2,
	add as addV2,
} from "./vector2";
import { start } from "./pipe";

type Camera = {
	position: [number, number];
	zoom: LogarithmicValue;
};

function App() {
	const [camera, updateCamera] = useReducer<
		(state: Camera, partialState: Partial<Camera>) => Camera
	>((state, partialState) => ({ ...state, ...partialState }), {
		zoom: LogarithmicValue.logarithmic(0),
		position: [0, 0],
	});
	const divRef = useRef<HTMLDivElement | null>();
	const svgRef = useRef<SVGSVGElement | null>(null);
	const mousePositionRef = useRef<Vector2>([0, 0]);
	const [, update] = useReducer(() => ({}), {});
	const [circles, setCircles] = useState<[number, number][]>([
		[-100, 100],
		[100, 100],
		[-100, -100],
		[100, -100],
	]);

	return (
		<div
			onMouseMove={(e) => {
				if (divRef.current) {
					const rect = divRef.current.getBoundingClientRect();
					const rectPos = [rect.left, rect.top] satisfies Vector2;
					const clientXY = [e.clientX, e.clientY] satisfies Vector2;

					mousePositionRef.current = subV2(clientXY, rectPos);
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
						const dimensions = [rect.width, rect.height] satisfies Vector2;

						if (e.ctrlKey) {
							const newZoom = camera.zoom.addLogarithmic(-e.deltaY * 0.01);

							const mousePositionCentered = start(mousePositionRef.current)
								._((pos) => subV2(pos, scalarMulV2(dimensions, 1 / 2)))
								._((pos) => hadamardV2(pos, [1, -1])).value;

							const mousePosScaled = scalarMulV2(
								mousePositionCentered,
								newZoom.addLogarithmic(-camera.zoom.logarithmic).linear
							);

							const displacement = subV2(mousePosScaled, mousePositionCentered);

							const newPos = addV2(
								camera.position,
								scalarMulV2(displacement, 1 / newZoom.linear)
							);

							updateCamera({
								zoom: newZoom,
								position: newPos,
							});
						} else {
							const delta = [-e.deltaX, -e.deltaY] satisfies Vector2;

							updateCamera({
								position: addV2(
									camera.position,
									scalarMulV2(delta, 1 / camera.zoom.linear)
								),
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

					update();
				}}
				className={css`
					display: block;
					/* border: 1px solid black; */
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
						const svgDimensions = [
							clientRect.width,
							clientRect.height,
						] satisfies Vector2;

						const transform = translate2D(scalarMulV2(svgDimensions, 1 / 2))
							.multiply(translate2D(camera.position))
							.multiply(scale2D([camera.zoom.linear, -camera.zoom.linear]));

						return (
							<>
								{circles.map(([x, y], i) => (
									<Compute key={i.toString()}>
										{() => {
											// const circlePosition = (
											// 	transform
											// 		.multiply(array([[x], [y], [1]]))
											// 		.toArray() as number[][]
											// ).flat();

											const circlePosition = start<Vector2>([x, y])
												._((pos) => addV2(pos, camera.position))
												._((pos) =>
													addV2(pos, scalarMulV2(svgDimensions, 1 / 2))
												)
												._((pos) => scalarMulV2(pos, camera.zoom.linear)).value;

											console.log(circlePosition);

											return (
												<circle
													fill="white"
													stroke="black"
													cx={circlePosition[0]}
													cy={circlePosition[1]}
													r={`${camera.zoom.linear * 50}`}
												/>
											);
										}}
									</Compute>
								))}
							</>
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
