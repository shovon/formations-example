import { css } from "@emotion/css";
import { useReducer, useRef, useState, ReactNode, useEffect } from "react";
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
		name: string;
		isActive: boolean;
	}[];

	const [circles, setCircles] = useState<CirclesState>([
		{ isActive: false, name: "A", color: "red", position: [-100, 100] },
		{ isActive: false, name: "B", color: "green", position: [100, 100] },
		{ isActive: false, name: "C", color: "blue", position: [-100, -100] },
		{ isActive: false, name: "D", color: "purple", position: [100, -100] },
		{ isActive: false, name: "E", color: "orange", position: [300, 0] },
	]);

	const activateCircle = (index: number) => {
		setCircles(
			circles.map((c, i) => (index === i ? { ...c, isActive: true } : c))
		);
	};

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
								const newZoom = camera.zoom.addLogarithmic(-e.deltaY * 0.01);

								const cursorCenter = start(mousePosition)
									._((pos) => subV2(pos, scalarMulV2(dimensions, 0.5)))
									._((pos) => hadamardV2(pos, [1, -1])).value;

								const newCameraPosition = start(cursorCenter)
									._((pos) => addV2(pos, camera.position))
									._((pos) =>
										scalarMulV2(pos, newZoom.linear / camera.zoom.linear)
									)
									._((pos) => subV2(pos, cursorCenter)).value;

								updateCamera({
									zoom: newZoom,
									position: newCameraPosition,
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

						const transform = translate2D(hadamardV2(svgDimensions, [0.5, 0.5]))
							.multiply(scale2D([1, -1]))
							.multiply(translate2D(scalarMulV2(camera.position, -1)))
							.multiply(scale2D([camera.zoom.linear, camera.zoom.linear]));

						return (
							<>
								{circles.map(
									({ position: [x, y], color, name, isActive }, i) => (
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
													<>
														<circle
															onClick={() => {
																activateCircle(i);
															}}
															fill={"white"}
															stroke={color}
															strokeWidth={`${
																camera.zoom.linear * 3 * (isActive ? 2 : 1)
															}`}
															cx={xt}
															cy={yt}
															r={`${camera.zoom.linear * 20}`}
														/>
														<text
															x={`${xt + 0.25 * camera.zoom.linear}`}
															y={`${yt + 1.5 * camera.zoom.linear}`}
															fill={color}
															fontSize={`${camera.zoom.linear}em`}
															dominant-baseline="middle"
															textAnchor="middle"
														>
															{name}
														</text>
													</>
												);
											}}
										</Compute>
									)
								)}

								<Compute>
									{() => {
										const cursorCenter = start(mousePosition)
											._((pos) => subV2(pos, scalarMulV2(svgDimensions, 0.5)))
											._((pos) => hadamardV2(pos, [1, -1])).value;

										const cursorPosition = start(cursorCenter)
											._((pos) => addV2(pos, camera.position))
											._((pos) =>
												scalarMulV2(pos, 1 / camera.zoom.linear)
											).value;

										return (
											<text
												x={`${mousePosition[0] + 50}`}
												y={`${mousePosition[1]}`}
											>
												{`(${cursorPosition[0]}, ${cursorPosition[1]})`}
											</text>
										);
									}}
								</Compute>
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
