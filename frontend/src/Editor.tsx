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
import { ReadOnlyMap } from "./readonly-map-set";
import { useSet } from "./use-set";

const CIRCLE_RADIUS = ENTITY_DIAMETER_IN_PIXELS / 2;

type Camera = {
	position: [number, number];
	zoom: LogarithmicValue;
};

type EditorProps = {
	circles: ReadOnlyMap<
		string,
		{ position: Vector2; color: string; name: string }
	>;
	onPositionsChange?: (changes: ReadOnlyMap<string, Vector2>) => void;
};

export function Editor(props: EditorProps) {
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

	type MouseState =
		| {
				type: "NOTHING";
		  }
		| {
				type: "MOUSE_DOWN";
				event:
					| {
							type: "ITEM";
							// Some boolean flag to determine whether the item being clicked
							// was previously selected. useful information to determine
							// whether to deselect the item when the user mouses up
							wasSelected: boolean;
							id: string;
					  }
					| {
							type: "BLANK_SPACE";
							startPosition: Vector2;
					  };
				hasMoved: boolean;
		  };

	const [mouseState, setMouseState] = useState<MouseState>({
		type: "NOTHING",
	});

	type Circle = {
		position: Vector2;
		color: string;
		name: string;
	};

	const selectedSet = useSet<string>();

	// TODO: move the circle storage logic to a separate class
	const [circles, setCircles] = useState<[string, Circle][]>([
		[
			"1",
			{
				name: "A",
				color: "red",
				position: [-100, 100],
			},
		],
		[
			"2",
			{
				name: "B",
				color: "green",
				position: [100, 100],
			},
		],
		[
			"3",
			{
				name: "C",
				color: "blue",
				position: [-100, -100],
			},
		],
		[
			"4",
			{
				name: "D",
				color: "purple",
				position: [100, -100],
			},
		],
		[
			"5",
			{
				name: "E",
				color: "orange",
				position: [300, 0],
			},
		],
	]);

	const circleMouseUp = (i: string) => {
		if (selectedSet.has(i)) {
			if (mouseState.type === "MOUSE_DOWN" && !mouseState.hasMoved) {
				const { event } = mouseState;
				if (event.type === "ITEM") {
					if (event.wasSelected) {
						selectedSet.delete(i);
					}
				}
			}
		}
	};

	const deactivateAllCircles = () => {
		selectedSet.clear();
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

	const getCircleUnerCursor = (): [string, Circle] | null => {
		const cursorPosition = getCursorPosition();

		for (const [, [index, circle]] of circles.entries()) {
			const radius = CIRCLE_RADIUS;

			if (distance2(cursorPosition, circle.position) < radius) {
				return [index, circle];
			}
		}

		return null;
	};

	const blankSpaceSelection = (startPosition: Vector2) => {
		const topLeft = screenToSpace([
			Math.min(startPosition[0], mousePositionRef.current[0]),
			Math.min(startPosition[1], mousePositionRef.current[1]),
		]);

		const bottomRight = screenToSpace([
			Math.max(startPosition[0], mousePositionRef.current[0]),
			Math.max(startPosition[1], mousePositionRef.current[1]),
		]);

		setCircles(
			circles.map(([index, c]) => {
				if (
					c.position[0] > topLeft[0] &&
					c.position[0] < bottomRight[0] &&
					c.position[1] < topLeft[1] &&
					c.position[1] > bottomRight[1]
				) {
				}
				return [index, { ...c, state: "INACTIVE" }];
			})
		);

		for (const [id, c] of circles) {
			if (
				c.position[0] > topLeft[0] &&
				c.position[0] < bottomRight[0] &&
				c.position[1] < topLeft[1] &&
				c.position[1] > bottomRight[1]
			) {
				selectedSet.add(id);
			}
		}

		return;
	};

	const moveEvent = ([dx, dy]: Vector2) => {
		if (mouseState.type === "MOUSE_DOWN") {
			setMouseState({ ...mouseState, hasMoved: true });

			if (mouseState.event.type === "BLANK_SPACE") {
				blankSpaceSelection(mouseState.event.startPosition);
			} else {
				if (!mouseState.event.wasSelected) {
					deactivateAllCircles();
					selectedSet.add(mouseState.event.id);
				}
				const delta = scalarMul2([dx, -dy], 1 / camera.zoom.linear);
				setCircles(
					circles.map(([id, c]) => {
						if (selectedSet.has(id)) {
							return [id, { ...c, position: add2(c.position, delta) }];
						}
						return [id, c];
					})
				);
			}
		}
	};

	// TODO:

	return (
		<div>
			<SvgWrapper
				onMouseUp={() => {
					const indexCircle = getCircleUnerCursor();

					if (indexCircle) {
						const [index] = indexCircle;
						circleMouseUp(index);
					}

					setMouseState({ type: "NOTHING" });
				}}
				onMouseDown={() => {
					const indexCircle = getCircleUnerCursor();
					if (indexCircle) {
						const [index] = indexCircle;
						setMouseState({
							type: "MOUSE_DOWN",
							event: {
								type: "ITEM",
								id: index,
								wasSelected: selectedSet.has(index),
							},
							hasMoved: false,
						});
						selectedSet.add(index);
						return;
					} else {
						deactivateAllCircles();
						setMouseState({
							type: "MOUSE_DOWN",
							event: {
								type: "BLANK_SPACE",
								startPosition: mousePositionRef.current,
							},
							hasMoved: false,
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

					{(() => {
						const [width, height] = getDrawingAreaDimensions();

						const mat = `translate(${-camera.position[0]}, ${
							camera.position[1]
						}) translate(${width / 2}, ${height / 2}) scale(${
							camera.zoom.linear
						})`;

						return (
							<g transform={mat}>
								{circles
									.slice()
									.reverse()
									.map(
										(
											[
												id,
												{
													position: [x, y],
													color,
													name,
												},
											],
											i
										) => {
											return (
												<g key={i}>
													{selectedSet.has(id) ? (
														<circle
															stroke="black"
															fill="white"
															strokeWidth={`${1}`}
															cx={x}
															cy={-y}
															r={`${CIRCLE_RADIUS + 4}`}
														></circle>
													) : null}
													<circle
														fill={"white"}
														stroke={color}
														strokeWidth={`3`}
														cx={x}
														cy={-y}
														r={`${CIRCLE_RADIUS}`}
													/>
													<text
														x={`${x}`}
														y={`${-y + 1.5}`}
														fill={color}
														fontSize={`${1}em`}
														dominantBaseline="middle"
														textAnchor="middle"
													>
														{name}
													</text>
												</g>
											);
										}
									)}
							</g>
						);
					})()}

					{(() => {
						if (mouseState.type !== "MOUSE_DOWN") return null;

						const { event } = mouseState;

						if (event.type !== "BLANK_SPACE") return null;

						const { startPosition } = event;
						const endPosition = mousePositionRef.current;

						const width = Math.abs(startPosition[0] - endPosition[0]);
						const height = Math.abs(startPosition[1] - endPosition[1]);

						return (
							<rect
								x={`${Math.min(startPosition[0], endPosition[0])}`}
								y={`${Math.min(startPosition[1], endPosition[1])}`}
								width={width}
								height={height}
								style={{ fill: "#5566ff", fillOpacity: 0.5 }}
							/>
						);
					})()}
				</>
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
