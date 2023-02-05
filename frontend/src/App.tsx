import { css } from "@emotion/css";
import { useReducer, useRef, useState, ReactNode } from "react";
import { LogarithmicValue } from "./logarithmic-value";
import {
	hadamard as hadamardV2,
	scalarMul as scalarMulV2,
	Vector2,
	sub as subV2,
	add as addV2,
	toColumnVector,
} from "./vector2";
import { Compute } from "./Compute";
import { start } from "./pipe";
import { scale2D, translate2D } from "./matrix";
import { array } from "vectorious";

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
	const [mousePosition, setMousePosition] = useState<[number, number]>([0, 0]);
	const [, update] = useReducer(() => ({}), {});

	type CirclesState = {
		position: Vector2;
		color: string;
	}[];

	const [circles, setCircles] = useState<CirclesState>([
		{ color: "red", position: [-100, 100] },
		{ color: "green", position: [100, 100] },
		{ color: "blue", position: [-100, -100] },
		{ color: "yellow", position: [100, -100] },
	]);

	return (
		<div
			ref={(ref) => {
				divRef.current = ref;
				if (!divRef.current) return;
			}}
		>
			<svg
				ref={(ref) => {
					if (ref === null) {
						return;
					}
					const currentRef = svgRef.current;
					svgRef.current = ref;

					svgRef.current.addEventListener(
						"wheel",
						(e) => {
							e.preventDefault();

							if (!svgRef.current) return;

							const rect = svgRef.current.getBoundingClientRect();
							const dimensions = [rect.width, rect.height] satisfies Vector2;

							if (e.ctrlKey) {
								// Our new zoom
								const newZoom = camera.zoom.addLogarithmic(-e.deltaY * 0.01);

								const c = start(camera.position)._((pos) =>
									addV2(
										pos,
										start(hadamardV2(dimensions, [-0.5, -0.5]))
											._((t) => addV2(t, mousePositionRef.current))
											._((t) =>
												scalarMulV2(t, camera.zoom.linear - newZoom.linear)
											)
											._((t) => hadamardV2(t, [-1, 1])).value
									)
								).value;

								updateCamera({
									zoom: newZoom,
									position: c,
								});
							} else {
								const delta = [e.deltaX, -e.deltaY] satisfies Vector2;

								updateCamera({
									position: addV2(camera.position, delta),
								});
							}
						},
						{ passive: false }
					);

					if (currentRef === ref) return;

					update();
				}}
				onMouseMove={(e) => {
					if (divRef.current) {
						const rect = divRef.current.getBoundingClientRect();
						const rectPos = [rect.left, rect.top] satisfies Vector2;
						const clientXY = [e.clientX, e.clientY] satisfies Vector2;

						mousePositionRef.current = subV2(clientXY, rectPos);

						setMousePosition(mousePositionRef.current);
					}
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

						// This is going to be useful. Keep this code
						// const transform = translate2D(scalarMulV2(svgDimensions, 1 / 2))
						// 	.multiply(translate2D(camera.position))
						// 	.multiply(scale2D([camera.zoom.linear, -camera.zoom.linear]));

						const transform = translate2D(hadamardV2(svgDimensions, [0.5, 0.5]))
							.multiply(scale2D([1, -1]))
							.multiply(translate2D(scalarMulV2(camera.position, -1)))
							.multiply(scale2D([camera.zoom.linear, camera.zoom.linear]));
						// translate2D(hadamardV2(camera.position, [-1, 1]))
						// .multiply(scale2D([camera.zoom.linear, -camera.zoom.linear]))
						// .multiply(translate2D(scalarMulV2(svgDimensions, 0.5)));

						return (
							<>
								{circles.map(({ position: [x, y], color }, i) => (
									<Compute key={i.toString()}>
										{() => {
											const coordinates = (
												transform
													.multiply(array([[x], [y], [1]]))
													.toArray() as number[][]
											).flat();

											console.assert(
												coordinates.length >= 2,
												"Expected to get a 3d vector, but got something else"
											);
											const [xt, yt] = coordinates;

											return (
												<circle
													onClick={() => {
														alert("Entity clicked");
													}}
													fill={color}
													stroke="black"
													cx={xt}
													cy={yt}
													r={`${camera.zoom.linear * 50}`}
												/>
											);
										}}
									</Compute>
								))}

								{/* <Compute>
									{() => {
										const cursorPosition = start<Vector2>([
											mousePosition[0],
											mousePosition[1],
										])
											._((pos) => subV2(pos, scalarMulV2(svgDimensions, 0.5)))
											._((pos) => hadamardV2(pos, [1, -1]))
											._((pos) => scalarMulV2(pos, 1 / camera.zoom.linear))
											._((pos) =>
												addV2(
													pos,
													scalarMulV2(camera.position, 1 / camera.zoom.linear)
												)
											).value;

										return (
											<text x={`${mousePosition[0]}`} y={`${mousePosition[1]}`}>
												{`(${cursorPosition[0]}, ${cursorPosition[1]})`}
											</text>
										);
									}}
								</Compute> */}
							</>
						);
					}}
				</Compute>

				<text x="10" y="20">{`(${camera.position[0] / camera.zoom.linear}, ${
					camera.position[1] / camera.zoom.linear
				})`}</text>
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
