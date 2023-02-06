import { css } from "@emotion/css";
import React, {
	useReducer,
	useRef,
	useState,
	ReactNode,
	useEffect,
} from "react";
import { LogarithmicValue } from "./logarithmic-value";
import {
	hadamard as hadamard2,
	scalarMul as scalarMul2,
	Vector2,
	sub as sub2,
	add as add2,
	distance as distance2,
	equals as equals2,
} from "./vector2";
import { Compute } from "./Compute";
import { start } from "./pipe";
import { scale2D, translate2D } from "./matrix";
import { array } from "vectorious";

const CIRCLE_RADIUS = 20;

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

	type CircleState =
		| "INACTIVE"
		| "PREACTIVE"
		| "ACTIVE"
		| "PRE_DEACTIVATE"
		| "MOVING";

	type Circle = {
		position: Vector2;
		color: string;
		name: string;
		state: CircleState;
	};

	type CirclesState = Circle[];

	// TODO: move the circle storage logic to a separate class
	const [circles, setCircles] = useState<CirclesState>([
		{ state: "INACTIVE", name: "A", color: "red", position: [-100, 100] },
		{ state: "INACTIVE", name: "B", color: "green", position: [100, 100] },
		{ state: "INACTIVE", name: "C", color: "blue", position: [-100, -100] },
		{ state: "INACTIVE", name: "D", color: "purple", position: [100, -100] },
		{ state: "INACTIVE", name: "E", color: "orange", position: [300, 0] },
	]);

	const circleMouseDown = (index: number) => {
		setCircles(
			circles.map((c, i) => {
				if (i !== index) return c;

				switch (c.state) {
					case "INACTIVE":
						return { ...c, state: "PREACTIVE" };
					case "ACTIVE":
						return { ...c, state: "PRE_DEACTIVATE" };
					case "PRE_DEACTIVATE":
					case "PREACTIVE":
					case "MOVING":
						return c;
				}
			})
		);
	};

	const circleMouseUp = (index: number) => {
		setCircles(
			circles.map((c, i) => {
				if (i !== index) {
					if (c.state === "MOVING") {
						return { ...c, state: "ACTIVE" };
					}
					return c;
				}

				switch (c.state) {
					case "INACTIVE":
					case "ACTIVE":
						return c;
					case "PREACTIVE":
						return { ...c, state: "ACTIVE" };
					case "PRE_DEACTIVATE":
						return { ...c, state: "INACTIVE" };
					case "MOVING":
						return { ...c, state: "ACTIVE" };
				}
			})
		);
	};

	const deactivateAllCircles = () => {
		setCircles(circles.map((c) => ({ ...c, state: "INACTIVE" })));
	};

	const getSvgDimensions = () => {
		const svg = svgRef.current;
		const clientRect = svg
			? svg.getBoundingClientRect()
			: { width: 1, height: 1 };
		return [clientRect.width, clientRect.height] satisfies Vector2;
	};

	const getTransform = () => {
		const svgDimensions = getSvgDimensions();
		return translate2D(hadamard2(svgDimensions, [0.5, 0.5]))
			.multiply(scale2D([1, -1]))
			.multiply(translate2D(scalarMul2(camera.position, -1)))
			.multiply(scale2D([camera.zoom.linear, camera.zoom.linear]));
	};

	const getCursorPosition = () => {
		const svgDimensions = getSvgDimensions();

		const cursorCenter = start(mousePositionRef.current)
			._((pos) => sub2(pos, scalarMul2(svgDimensions, 0.5)))
			._((pos) => hadamard2(pos, [1, -1])).value;

		return start(cursorCenter)
			._((pos) => add2(pos, camera.position))
			._((pos) => scalarMul2(pos, 1 / camera.zoom.linear)).value;
	};

	const getCollidingCircle = (): [number, Circle] | null => {
		const cursorPosition = getCursorPosition();

		for (const [i, circle] of circles.entries()) {
			const radius = CIRCLE_RADIUS;

			if (distance2(cursorPosition, circle.position) < radius) {
				return [i, circle];
			}
		}

		return null;
	};

	const moveEvent = ([dx, dy]: Vector2) => {
		const delta = scalarMul2([dx, -dy], 1 / camera.zoom.linear);

		if (circles.some((c) => c.state === "PREACTIVE")) {
			// when an inactive item is being moved…
			//
			// all the other active items will become inactive and only move that one
			// newly inactive item

			const index = circles.findIndex((c) => c.state === "PREACTIVE");
			setCircles(
				circles.map((c, i) =>
					i !== index
						? { ...c, state: "INACTIVE" }
						: { ...c, state: "MOVING", position: add2(c.position, delta) }
				)
			);
		} else if (
			circles.some((c) => c.state === "MOVING" || c.state === "PRE_DEACTIVATE")
		) {
			//
			// all active items will remain active, and move

			setCircles(
				circles.map((c) => {
					switch (c.state) {
						case "ACTIVE":
						case "PREACTIVE":
						case "MOVING":
						case "PRE_DEACTIVATE":
							return {
								...c,
								state: "MOVING",
								position: add2(c.position, delta),
							};
						case "INACTIVE":
							return c;
					}
				})
			);
		}
	};

	const onMouseUp = () => {
		const indexCircle = getCollidingCircle();

		if (indexCircle) {
			const [index] = indexCircle;
			circleMouseUp(index);
		} else {
			deactivateAllCircles();
		}
	};

	useEffect(() => {
		document.addEventListener("mouseup", onMouseUp);

		return () => {
			document.removeEventListener("mouseup", onMouseUp);
		};
	}, [circles]);

	return (
		<div
			ref={(ref) => {
				divRef.current = ref;
				if (!divRef.current) return;
			}}
		>
			<svg
				onMouseDown={() => {
					const indexCircle = getCollidingCircle();
					if (indexCircle) {
						const [index] = indexCircle;
						circleMouseDown(index);
						return;
					}
				}}
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
									._((pos) => sub2(pos, scalarMul2(dimensions, 0.5)))
									._((pos) => hadamard2(pos, [1, -1])).value;

								const newCameraPosition = start(cursorCenter)
									._((pos) => add2(pos, camera.position))
									._((pos) =>
										scalarMul2(pos, newZoom.linear / camera.zoom.linear)
									)
									._((pos) => sub2(pos, cursorCenter)).value;

								updateCamera({
									zoom: newZoom,
									position: newCameraPosition,
								});
							} else {
								const delta = [e.deltaX, -e.deltaY] satisfies Vector2;

								updateCamera({
									position: add2(camera.position, delta),
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

						const newMousePosition = sub2(clientXY, rectPos);
						if (!equals2(newMousePosition, mousePositionRef.current)) {
							mousePositionRef.current = newMousePosition;
							setMousePosition(mousePositionRef.current);

							moveEvent([e.movementX, e.movementY]);
						}
					}
				}}
				className={css`
					display: block;
					/* border: 1px solid black; */
					box-sizing: border-box;
					width: 100vw;
					height: 100vh;
					text {
						-webkit-user-select: none;
						-moz-user-select: none;
						-ms-user-select: none;
						user-select: none;
					}
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

						const transform = getTransform();

						return (
							<>
								{circles.map(({ position: [x, y], color, name, state }, i) => (
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

											const isActive = (state: CircleState): boolean => {
												switch (state) {
													case "ACTIVE":
													case "MOVING":
													case "PREACTIVE":
													case "PRE_DEACTIVATE":
														return true;
													case "INACTIVE":
														return false;
												}
											};

											return (
												<>
													<circle
														fill={"white"}
														stroke={color}
														strokeWidth={`${
															camera.zoom.linear * 3 * (isActive(state) ? 2 : 1)
														}`}
														cx={xt}
														cy={yt}
														r={`${camera.zoom.linear * 20}`}
													/>
													<text
														x={`${xt}`}
														y={`${yt + 1.75 * camera.zoom.linear}`}
														fill={color}
														fontSize={`${camera.zoom.linear}em`}
														dominantBaseline="middle"
														textAnchor="middle"
													>
														{name}
													</text>
												</>
											);
										}}
									</Compute>
								))}

								<Compute>
									{() => {
										const cursorPosition = getCursorPosition();

										return (
											<text
												pointerEvents={"none"}
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
