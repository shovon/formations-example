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
import { start } from "./pipe";
import { scale2D, translate2D } from "./matrix";
import { array } from "vectorious";
import { SvgWrapper, SvgWrapperObject } from "./SvgWrapper";
import { ENTITY_DIAMETER_IN_PIXELS } from "./constants";

const CIRCLE_RADIUS = ENTITY_DIAMETER_IN_PIXELS / 2;

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
	const drawingAreaRef = useRef<SvgWrapperObject | null>(null);
	const mousePositionRef = useRef<Vector2>([0, 0]);
	const [mousePosition, setMousePosition] = useState<[number, number]>([0, 0]);
	const [, update] = useReducer(() => ({}), {});

	type GlobalMouseState =
		| { type: "MOUSE_INACTIVE" }
		| { type: "MOUSE_ACTIVE"; startPosition: [number, number] };

	const [globalMouseState, setGlobalMouseState] = useState<GlobalMouseState>({
		type: "MOUSE_INACTIVE",
	});

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

	const getDrawingAreaDimensions = () => {
		const svg = drawingAreaRef.current;
		const clientRect = svg
			? svg.getBoundingClientRect()
			: { width: 1, height: 1 };
		return [clientRect.width, clientRect.height] satisfies Vector2;
	};

	const getTransform = () => {
		const drawingAreaDimensions = getDrawingAreaDimensions();
		return translate2D(hadamard2(drawingAreaDimensions, [0.5, 0.5]))
			.multiply(scale2D([1, -1]))
			.multiply(translate2D(scalarMul2(camera.position, -1)))
			.multiply(scale2D([camera.zoom.linear, camera.zoom.linear]));
	};

	const screenToSpace = (position: Vector2): Vector2 => {
		const svgDimensions = getDrawingAreaDimensions();

		const cursorCenter = start(position)
			._((pos) => sub2(pos, scalarMul2(svgDimensions, 0.5)))
			._((pos) => hadamard2(pos, [1, -1])).value;

		return start(cursorCenter)
			._((pos) => add2(pos, camera.position))
			._((pos) => scalarMul2(pos, 1 / camera.zoom.linear)).value;
	};

	const getCursorPosition = () => screenToSpace(mousePositionRef.current);

	const getViewportBounds = () => {
		const [width, height] = start(getDrawingAreaDimensions())._((d) =>
			scalarMul2(d, 1 / camera.zoom.linear)
		).value;

		// In the real space, pixels move at a rate proportional to the zoom.
		// So it's best to divide the pixel position by the zoom
		const left = camera.position[0] / camera.zoom.linear - width / 2;
		const top = camera.position[1] / camera.zoom.linear + height / 2;
		const right = camera.position[0] / camera.zoom.linear + width / 2;
		const bottom = camera.position[1] / camera.zoom.linear - height / 2;

		return { width, height, left, top, right, bottom };
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

	// TODO:

	return (
		<div>
			<SvgWrapper
				onMouseUp={() => {
					const indexCircle = getCollidingCircle();

					if (indexCircle) {
						const [index] = indexCircle;
						circleMouseUp(index);
					}

					setGlobalMouseState({ type: "MOUSE_INACTIVE" });
				}}
				onMouseDown={() => {
					const indexCircle = getCollidingCircle();
					if (indexCircle) {
						const [index] = indexCircle;
						circleMouseDown(index);
						return;
					} else {
						deactivateAllCircles();
						setGlobalMouseState({
							type: "MOUSE_ACTIVE",
							startPosition: [...mousePositionRef.current],
						});
					}
				}}
				onWheel={(e) => {
					const [x, y] = getDrawingAreaDimensions();
					const dimensions = [x, y] satisfies Vector2;

					if (e.ctrlKey) {
						const newZoom = camera.zoom.addLogarithmic(-e.deltaY * 0.01);

						const cursorCenter = start(mousePosition)
							._((pos) => sub2(pos, scalarMul2(dimensions, 0.5)))
							._((pos) => hadamard2(pos, [1, -1])).value;

						const newCameraPosition = start(cursorCenter)
							._((pos) => add2(pos, camera.position))
							._((pos) => scalarMul2(pos, newZoom.linear / camera.zoom.linear))
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
				}}
				ref={(ref) => {
					if (ref === null) {
						return;
					}
					const currentRef = drawingAreaRef.current;
					drawingAreaRef.current = ref;

					if (currentRef === ref) return;

					update();
				}}
				onMouseMove={({ x, y, ...e }) => {
					const newMousePosition = [x, y] satisfies [number, number];

					if (!equals2(newMousePosition, mousePositionRef.current)) {
						mousePositionRef.current = newMousePosition;
						setMousePosition(mousePositionRef.current);

						moveEvent([e.movementX, e.movementY]);
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
				<>
					{(() => {
						const { top, bottom } = getViewportBounds();

						const [startX, startY] = start([0, top])._(([x, y]) =>
							(
								getTransform()
									.multiply(array([[x], [y], [1]]))
									.toArray() as number[][]
							).flat()
						).value;

						const [, endY] = start([0, bottom])._(([x, y]) =>
							(
								getTransform()
									.multiply(array([[x], [y], [1]]))
									.toArray() as number[][]
							).flat()
						).value;

						return <path d={`M${startX} ${startY} V ${endY}`} stroke="black" />;
					})()}
					{(() => {
						const { left, right } = getViewportBounds();

						const [startX, startY] = start([left, 0])._(([x, y]) =>
							(
								getTransform()
									.multiply(array([[x], [y], [1]]))
									.toArray() as number[][]
							).flat()
						).value;

						const [endX] = start([right, 0])._(([x, y]) =>
							(
								getTransform()
									.multiply(array([[x], [y], [1]]))
									.toArray() as number[][]
							).flat()
						).value;

						return <path d={`M${startX} ${startY} H ${endX}`} stroke="black" />;
					})()}
					{circles
						.slice()
						.reverse()
						.map(({ position: [x, y], color, name, state }) => {
							const coordinates = (
								getTransform()
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
									{isActive(state) ? (
										<circle
											stroke="black"
											fill="white"
											strokeWidth={`${1}`}
											cx={xt}
											cy={yt}
											r={`${camera.zoom.linear * (CIRCLE_RADIUS + 4)}`}
										></circle>
									) : null}
									<circle
										fill={"white"}
										stroke={color}
										strokeWidth={`${camera.zoom.linear * 3}`}
										cx={xt}
										cy={yt}
										r={`${camera.zoom.linear * CIRCLE_RADIUS}`}
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
						})}

					{(() => {
						if (globalMouseState.type === "MOUSE_INACTIVE") return null;

						const { startPosition } = globalMouseState;
						const endPosition = mousePositionRef.current;

						const width = Math.abs(startPosition[0] - endPosition[0]);
						const height = Math.abs(startPosition[1] - endPosition[1]);

						return (
							<rect
								x={`${Math.min(
									globalMouseState.startPosition[0],
									endPosition[0]
								)}`}
								y={`${Math.min(
									globalMouseState.startPosition[1],
									endPosition[1]
								)}`}
								width={width}
								height={height}
								style={{ fill: "#5566ff", fillOpacity: 0.5 }}
							/>
						);
					})()}

					{(() => {
						const cursorPosition = getCursorPosition();

						return (
							<text
								pointerEvents={"none"}
								x={`${mousePositionRef.current[0] + 50}`}
								y={`${mousePositionRef.current[1]}`}
							>
								{`(${cursorPosition[0]}, ${cursorPosition[1]})`}
							</text>
						);
					})()}
				</>

				<text x="10" y="20">{`(${camera.position[0] / camera.zoom.linear}, ${
					camera.position[1] / camera.zoom.linear
				})`}</text>
			</SvgWrapper>

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
