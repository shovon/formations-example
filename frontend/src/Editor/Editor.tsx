import { css } from "@emotion/css";
import {
	useReducer,
	useRef,
	useState,
	useEffect,
	useCallback,
	useContext,
} from "react";
import { LogarithmicValue } from "../logarithmic-value";
import {
	hadamard as hadamard2,
	scalarMul as scalarMul2,
	Vector2,
	sub as sub2,
	add as add2,
	distance as distance2,
	equals as equals2,
} from "../vector2";
import { start } from "../pipe";
import { scale2D, translate2D } from "../matrix";
import { array } from "vectorious";
import { SvgWrapper, SvgWrapperObject } from "../SvgWrapper";
import { ENTITY_DIAMETER_IN_PIXELS } from "../constants";
import {
	EntityPlacement,
	FormationHelpers,
	joinPlacements,
	Performance,
} from "../performance-project";
import { getKV } from "../iterable-helpers";
import { getCurrentFormationIndex, TimelineState } from "../timeline-state";
import { useMouseUp } from "../use-mouse-up";
import { ThemeContext } from "../theme";

const CIRCLE_RADIUS = ENTITY_DIAMETER_IN_PIXELS / 2;

type Camera = {
	position: [number, number];
	zoom: LogarithmicValue;
};

export type Entity = { color: string; name: string };

const EntityObject = ({
	isSelected,
	x,
	y,
	color,
	name,
}: {
	isSelected: boolean;
	x: number;
	y: number;
	color: string;
	name: string;
}) => {
	return (
		<g>
			{isSelected ? (
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
				fill={color}
				stroke={color}
				strokeWidth={`3`}
				cx={x}
				cy={-y}
				r={`${CIRCLE_RADIUS}`}
			/>
			<text
				x={`${x}`}
				y={`${-y + 1.5}`}
				fill={"white"}
				fontSize={`${1}em`}
				dominantBaseline="middle"
				textAnchor="middle"
			>
				{name.slice(0, 1)}
			</text>
		</g>
	);
};

const Marker = ({ id, color }: { id: string; color: string }) => {
	return (
		<defs>
			<marker
				id={`arrowhead-${btoa(id)}`}
				markerWidth="10"
				markerHeight="7"
				refX="0"
				refY="3.5"
				orient="auto"
			>
				<polygon points="0 0, 10 3.5, 0 7" fill={color} />
			</marker>
		</defs>
	);
};

const StraightPath = ({
	id,
	color,
	from: [x1, y1],
	to: [x2, y2],
}: {
	id: string;
	color?: string;
	from: Vector2;
	to: Vector2;
}) => {
	return (
		<>
			<Marker id={id} color={color ?? "black"} />
			<path
				d={`M ${x1} ${-y1} L ${(x1 + x2) / 2} ${-(y1 + y2) / 2} L ${x2} ${-y2}`}
				stroke={color ?? "black"}
				fill="transparent"
				markerMid={`url(#arrowhead-${btoa(id)})`}
			/>
		</>
	);
};

type EditorProps = {
	performance: Performance;
	selections: Iterable<string>;
	onPositionsChange?: (
		changes: Iterable<[string, Vector2]>,
		formationIndex: number
	) => void;
	onSelectionsChange?: (changes: Iterable<string>) => void;
	onFormationIndexChange?: (newIndex: number) => void;
	style?: React.CSSProperties | undefined;

	timelineState: TimelineState;
};

// TODO: memoize the value of entities and selections.
// TODO: handle the edge case where there are no formations
// TODO: this code is beginning to look really ugly. Time to refactor things
// NOTE: is there too much dependence on the concept of a "project"?
//   Maybe there is. But one benefit of being given access to a project is that
//   it gives the editor some flexibility
export const Editor = ({
	performance,
	selections,
	onPositionsChange,
	onSelectionsChange,
	onFormationIndexChange,
	style,
	// currentFormationIndex,

	timelineState,
}: EditorProps) => {
	const [camera, updateCamera] = useReducer<
		(state: Camera, partialState: Partial<Camera>) => Camera
	>((state, partialState) => ({ ...state, ...partialState }), {
		zoom: LogarithmicValue.logarithmic(0.5),
		position: [0, 0],
	});
	const selectionsSet = new Set(selections);
	const { onMouseDown, onMouseUp: mouseUp } = useMouseUp();
	const { theme } = useContext(ThemeContext);

	const currentFormationIndex = getCurrentFormationIndex(
		performance,
		timelineState
	);

	const currentFormation = performance.getFormationIndex(currentFormationIndex);

	useEffect(() => {
		setLocalPlacements([...currentFormation.placements]);
	}, [performance, timelineState]);

	const drawingAreaRef = useRef<SvgWrapperObject | null>(null);
	const mousePositionRef = useRef<Vector2>([0, 0]);

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
							wasPreviouslySelected: boolean;
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
	const [localPlacements, setLocalPlacements] = useState<
		[string, EntityPlacement][]
	>([...currentFormation.placements]);

	// This thing exists in order to destroy React's virtual DOM structure
	// associated with the SVG and all the SVG elements. This is to help with
	// performance. Not sure of React's implementation details, but I suspect
	// that they are just adding stuff to the underlying VDOM structure, causing
	// massive amounts of iteration to occur in order to reconcile the VDOM with
	// the DOM
	const [isEditorHidden, setIsEditorHidden] = useState(false);

	// To keep things snappy
	useEffect(() => {
		setIsEditorHidden(true);
		const timeout = setTimeout(() => {
			setIsEditorHidden(false);
		}, 0);

		return () => {
			clearTimeout(timeout);
		};
	}, [timelineState.mode]);

	function combineEntityPlacements(
		formation: FormationHelpers
	): Iterable<[string, { entity: Entity; placement: EntityPlacement }]> {
		const getEntity = (id: string): EntityPlacement =>
			getKV(formation.placements, id) ?? {
				position: [0, 0] satisfies Vector2,
			};

		return new Map(
			[...performance.entities].map(([id, entity]) => [
				id,
				{ entity, placement: getEntity(id) },
			])
		);
	}

	function combineEntityPlacementAtTime(
		formation: FormationHelpers,
		time: number
	): Iterable<[string, { entity: Entity; placement: EntityPlacement }]> {
		const getEntity = (id: string): EntityPlacement =>
			getKV(formation.getPlacementAtTime(time), id) ?? {
				position: [0, 0] satisfies Vector2,
			};

		return new Map(
			[...performance.entities].map(([id, entity]) => [
				id,
				{ entity, placement: getEntity(id) },
			])
		);
	}

	const entityMouseUp = (i: string) => {
		if (selectionsSet.has(i)) {
			if (mouseState.type === "MOUSE_DOWN") {
				if (!mouseState.hasMoved) {
					const { event } = mouseState;
					if (event.type === "ITEM") {
						if (event.wasPreviouslySelected) {
							const s = new Set(selections);
							s.delete(i);
							onSelectionsChange?.(s);
						}
					}
				} else if (mouseState.hasMoved) {
					onPositionsChange?.(
						localPlacements.map(([index, { position }]) => [index, position]),
						currentFormationIndex
					);
					setLocalPlacements([...currentFormation.placements]);
				}
			}
		}
	};

	const deactivateAllEntities = () => {
		onSelectionsChange?.([]);
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

		const screenCenter = start(position)
			// Grab the center of the screen
			._((pos) => sub2(pos, scalarMul2(svgDimensions, 0.5)))

			// Flip the y axis
			._((pos) => hadamard2(pos, [1, -1])).value;

		return start(screenCenter)
			._((pos) => add2(pos, camera.position))
			._((pos) => scalarMul2(pos, 1 / camera.zoom.linear)).value;
	};

	const getCursorPosition = () => screenToSpace(mousePositionRef.current);

	const getViewportBounds = () => {
		const [width, height] = start(getDrawingAreaDimensions())._((d) =>
			scalarMul2(d, 1 / camera.zoom.linear)
		).value;

		// In the real space, pixels move at a rate proportional to the zoom. So
		// it's best to divide the pixel position by the zoom
		const left = camera.position[0] / camera.zoom.linear - width / 2;
		const top = camera.position[1] / camera.zoom.linear + height / 2;
		const right = camera.position[0] / camera.zoom.linear + width / 2;
		const bottom = camera.position[1] / camera.zoom.linear - height / 2;

		return { width, height, left, top, right, bottom };
	};

	const getEntityUnderCursor = useCallback(():
		| [string, EntityPlacement, number]
		| null => {
		const cursorPosition = getCursorPosition();

		const radius = CIRCLE_RADIUS;

		for (const [, [id, placement]] of localPlacements.entries()) {
			if (distance2(cursorPosition, placement.position) < radius) {
				return [id, placement, currentFormationIndex];
			}
		}

		const previousFormationIndex = currentFormationIndex - 1;
		const previousFormation = performance.getFormationIndex(
			previousFormationIndex
		);
		if (previousFormation.exists) {
			for (const [id, placement] of previousFormation.placements) {
				if (distance2(cursorPosition, placement.position) < radius) {
					return [id, placement, previousFormationIndex];
				}
			}
		}

		const nextFormationIndex = currentFormationIndex + 1;
		const nextFormation = performance.getFormationIndex(nextFormationIndex);

		if (nextFormation.exists) {
			for (const [id, placement] of nextFormation.placements) {
				if (distance2(cursorPosition, placement.position) < radius) {
					return [id, placement, nextFormationIndex];
				}
			}
		}

		return null;
	}, [currentFormationIndex, localPlacements, getCursorPosition]);

	const onMouseUp = useCallback(
		mouseUp(() => {
			const indexAndEntity = getEntityUnderCursor();

			if (indexAndEntity) {
				const [index] = indexAndEntity;
				entityMouseUp(index);
			}

			setMouseState({ type: "NOTHING" });
		}),
		[getEntityUnderCursor]
	);

	const blankSpaceSelection = (startPosition: Vector2) => {
		const topLeft = screenToSpace([
			Math.min(startPosition[0], mousePositionRef.current[0]),
			Math.min(startPosition[1], mousePositionRef.current[1]),
		]);

		const bottomRight = screenToSpace([
			Math.max(startPosition[0], mousePositionRef.current[0]),
			Math.max(startPosition[1], mousePositionRef.current[1]),
		]);

		onSelectionsChange?.(
			localPlacements
				.filter(([, c]) => {
					return (
						c.position[0] > topLeft[0] &&
						c.position[0] < bottomRight[0] &&
						c.position[1] < topLeft[1] &&
						c.position[1] > bottomRight[1]
					);
				})
				.map(([id]) => id)
		);

		return;
	};

	const moveEvent = ([dx, dy]: Vector2) => {
		if (mouseState.type === "MOUSE_DOWN") {
			setMouseState({ ...mouseState, hasMoved: true });

			if (mouseState.event.type === "BLANK_SPACE") {
				blankSpaceSelection(mouseState.event.startPosition);
			} else {
				const delta = scalarMul2([dx, -dy], 1 / camera.zoom.linear);

				if (!mouseState.event.wasPreviouslySelected) {
					deactivateAllEntities();
					onSelectionsChange?.([mouseState.event.id]);

					const entityId = mouseState.event.id;

					const idAndEntity = localPlacements.find(([id]) => id === entityId);
					if (idAndEntity) {
						onPositionsChange?.(
							[[mouseState.event.id, add2(idAndEntity[1].position, delta)]],
							currentFormationIndex
						);
					}
				} else {
					onPositionsChange?.(
						localPlacements.map(([id, c]) => {
							if (selectionsSet.has(id)) {
								return [id, add2(c.position, delta)];
							}
							return [id, c.position];
						}),
						currentFormationIndex
					);
				}
			}
		}
	};

	const [width, height] = getDrawingAreaDimensions();

	const mat = `translate(${-camera.position[0]}, ${
		camera.position[1]
	}) translate(${width / 2}, ${height / 2}) scale(${camera.zoom.linear})`;

	const editorStyle = { ...style, background: theme.stage.background };

	return isEditorHidden ? (
		<div style={editorStyle}></div>
	) : (
		<SvgWrapper
			style={editorStyle}
			onMouseUp={onMouseUp}
			onMouseDown={onMouseDown(() => {
				const idAndEntity = getEntityUnderCursor();
				if (idAndEntity) {
					const [id, , formationIndex] = idAndEntity;
					setMouseState({
						type: "MOUSE_DOWN",
						event: {
							type: "ITEM",
							id,
							wasPreviouslySelected: selectionsSet.has(id),
						},
						hasMoved: false,
					});
					onSelectionsChange?.([...selectionsSet, id]);
					if (formationIndex !== currentFormationIndex) {
						onFormationIndexChange?.(formationIndex);
						setLocalPlacements([
							...performance.getFormationIndex(formationIndex).placements,
						]);
					}
					return;
				} else {
					deactivateAllEntities();
					setMouseState({
						type: "MOUSE_DOWN",
						event: {
							type: "BLANK_SPACE",
							startPosition: mousePositionRef.current,
						},
						hasMoved: false,
					});
				}
			})}
			onWheel={(e) => {
				const [x, y] = getDrawingAreaDimensions();
				const dimensions = [x, y] satisfies Vector2;

				if (e.ctrlKey) {
					const newZoom = camera.zoom.addLogarithmic(-e.deltaY * 0.01);

					const cursorCenter = start(mousePositionRef.current)
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

					moveEvent([e.movementX, e.movementY]);
				}
			}}
			className={css`
				display: block;
				box-sizing: border-box;
				width: 100%;
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

					return (
						<path
							d={`M${startX} ${startY} V ${endY}`}
							stroke={theme.stage.centerLine}
						/>
					);
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

					return (
						<path
							d={`M${startX} ${startY} H ${endX}`}
							stroke={theme.stage.centerLine}
						/>
					);
				})()}

				{(() => {
					if (timelineState.mode === "SEEKER") {
						return null;
					}

					// The next formation
					const previousFormationIndex = currentFormationIndex - 1;
					if (previousFormationIndex < 0) {
						return null;
					}

					const previousFormation = performance.getFormationIndex(
						previousFormationIndex
					);

					const directions = joinPlacements(
						previousFormation.placements,
						currentFormation.placements
					);

					return (
						<g transform={mat} opacity={0.5}>
							{[...directions].map(
								([
									id,
									{
										from: {
											position: [x1, y1],
										},
										to: {
											position: [x2, y2],
										},
									},
								]) => {
									return (
										<StraightPath
											key={id}
											id={id}
											color={getKV(performance.entities, id)?.color}
											from={[x1, y1]}
											to={[x2, y2]}
										/>
									);
								}
							)}
							{[
								...combineEntityPlacements(
									performance.getFormationIndex(previousFormationIndex)
								),
							]
								.slice()
								.reverse()
								.map(
									(
										[
											id,
											{
												entity: { color, name },
												placement: {
													position: [x, y],
												},
											},
										],
										i
									) => {
										return (
											<EntityObject
												key={i}
												isSelected={selectionsSet.has(id)}
												x={x}
												y={y}
												color={color}
												name={name}
											/>
										);
									}
								)}
						</g>
					);
				})()}

				{(() => {
					if (timelineState.mode === "SEEKER") {
						return null;
					}

					// The next formation
					const nextFormationIndex = currentFormationIndex + 1;
					if (nextFormationIndex >= performance.formationsCount) {
						return null;
					}

					const nextFormation =
						performance.getFormationIndex(nextFormationIndex);

					const directions = joinPlacements(
						currentFormation.placements,
						nextFormation.placements
					);

					return (
						<g transform={mat} opacity={0.5}>
							{[...directions].map(
								([
									id,
									{
										from: {
											position: [x1, y1],
										},
										to: {
											position: [x2, y2],
										},
									},
								]) => {
									return (
										<StraightPath
											id={id}
											color={getKV(performance.entities, id)?.color}
											key={id}
											from={[x1, y1]}
											to={[x2, y2]}
										/>
									);
								}
							)}
							{[
								...combineEntityPlacements(
									performance.getFormationIndex(nextFormationIndex)
								),
							]
								.slice()
								.reverse()
								.map(
									([
										id,
										{
											entity: { color, name },
											placement: {
												position: [x, y],
											},
										},
									]) => {
										return (
											<EntityObject
												key={id}
												x={x}
												y={y}
												isSelected={selectionsSet.has(id)}
												color={color}
												name={name}
											/>
										);
									}
								)}
						</g>
					);
				})()}

				{(() => {
					return (
						<g transform={mat}>
							{[
								...(timelineState.mode === "SEEKER"
									? combineEntityPlacementAtTime(
											currentFormation,
											timelineState.time
									  )
									: combineEntityPlacements(currentFormation)),
							]
								.slice()
								.reverse()
								.map(
									([
										id,
										{
											entity: { color, name },
											placement: {
												position: [x, y],
											},
										},
									]) => {
										return (
											<EntityObject
												key={id}
												isSelected={selectionsSet.has(id)}
												x={x}
												y={y}
												name={name}
												color={color}
											/>
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
	);
};
