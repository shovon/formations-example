import { css } from "@emotion/css";
import { useEffect, useReducer, useRef, useState } from "react";
import { Formation, Performance } from "./performance-project";
import { time, TimelineState } from "./timeline-state";
import { mouseUpEvents } from "./document";
import { useMouseUp } from "./use-mouse-up";
import { equals, sub, Vector2 } from "./vector2";
import { SvgWrapper, SvgWrapperObject } from "./SvgWrapper";
import { LogarithmicValue } from "./logarithmic-value";

// TODO: maybe this should go to the constants file?
const pixelsToMillisecondsRatio = 0.017;
const timelineHeight = 145;
const rulerHeight = 20;
const defaultTickSpacing = pixelsToMillisecondsRatio * 1000;

// The number of spokes is w / n, where n is the interval between spokes, at
// a zoom of 1.
//
//

type FormationTime = {
	id: string;
	duration: number;
	transitionDuration: number;
};

type TimelineProps = {
	performance: Performance;
	timelineState: TimelineState;
	formationSelected: (index: number) => void;
	currentFormationIndex: number;
	newFormationCreated: () => void;
	timelineSeeked: (time: number) => void;
	timelineStoppedSeeking: (time: number) => void;
	formationTimesChanged: (formationTimes: Iterable<FormationTime>) => void;
};

type ResizeSide = "END" | "TRANSITION";

type SeekerState =
	| { type: "INACTIVE" }
	| { type: "SEEKING"; start: number }
	| {
			type: "RESIZING";
			side: {
				type: ResizeSide;
				formationIndex: number;
			};
			start: number;
	  };

type Camera = {
	position: number;
	zoom: LogarithmicValue;
};

export function Timeline({
	performance,
	formationSelected,
	currentFormationIndex,
	newFormationCreated,
	timelineState,
	timelineSeeked,
	timelineStoppedSeeking,
	formationTimesChanged,
}: TimelineProps) {
	const playbackProgress = time(performance, timelineState);
	const cursorPositionRef = useRef<Vector2>([NaN, NaN]);
	const { onMouseDown, onMouseUp: mouseUp } = useMouseUp();
	const seekerStateRef = useRef<SeekerState>({ type: "INACTIVE" });
	const [camera, updateCamera] = useReducer<
		(state: Camera, partialState: Partial<Camera>) => Camera
	>(
		(state, partialState) => {
			const newState = { ...state, ...partialState };
			if (newState.position < 0) {
				newState.position = 0;
			}
			return newState;
		},
		{
			zoom: LogarithmicValue.linear(pixelsToMillisecondsRatio),
			position: 0,
		}
	);
	const [localFormations, setLocalFormations] = useState(
		performance.formations
	);
	const [, setMousePosition] = useState<Vector2>([NaN, NaN]);
	const drawingAreaRef = useRef<SvgWrapperObject | null>(null);
	const [, update] = useReducer(() => ({}), {});

	useEffect(() => {
		setLocalFormations(performance.formations);
	}, [performance.formations]);

	useEffect(() => {
		const onMouseUp = mouseUp(() => {
			if (seekerStateRef.current.type === "RESIZING") {
				formationTimesChanged(localFormations);
			}

			seekerStateRef.current = { type: "INACTIVE" };
			timelineStoppedSeeking(getCursorPosition() / camera.zoom.linear);
		});

		mouseUpEvents.addListener(onMouseUp);

		return () => {
			mouseUpEvents.removeListener(onMouseUp);
		};
	}, [
		timelineStoppedSeeking,
		playbackProgress,
		mouseUpEvents,
		localFormations,
	]);

	// NOTE: this is not necessarily the global mouse position!
	const getCursorPosition = (): number => {
		return cursorPositionRef.current[0] + camera.position;
	};

	const getTimeAtCursor = (): number => {
		return getCursorPosition() / camera.zoom.linear;
	};

	const boundary = 200;

	const isInBoundary = (time: number): boolean => {
		let elapsedTime = 0;

		const scaledBoundary =
			boundary / (camera.zoom.linear / pixelsToMillisecondsRatio);

		for (const [i, formation] of localFormations.entries()) {
			if (
				time > elapsedTime - scaledBoundary / 2 &&
				time < elapsedTime + scaledBoundary / 2
			) {
				if (i === 0) {
					return false;
				}

				return true;
			}

			elapsedTime += formation.duration;

			if (
				time > elapsedTime - scaledBoundary / 2 &&
				time < elapsedTime + scaledBoundary / 2
			) {
				return true;
			}

			elapsedTime += formation.transitionDuration;

			if (
				time > elapsedTime - scaledBoundary / 2 &&
				time < elapsedTime + scaledBoundary / 2
			) {
				return true;
			}
		}

		return false;
	};

	const getBoundarySelection = (
		time: number
	): { type: ResizeSide; formationIndex: number } | null => {
		let elapsedTime = 0;

		const scaledBoundary =
			boundary / (camera.zoom.linear / pixelsToMillisecondsRatio);

		for (const [i, formation] of localFormations.entries()) {
			elapsedTime += formation.duration;

			if (
				time > elapsedTime - scaledBoundary / 2 &&
				time < elapsedTime + scaledBoundary / 2
			) {
				return { type: "END", formationIndex: i };
			}

			elapsedTime += formation.transitionDuration;

			if (
				time > elapsedTime - scaledBoundary / 2 &&
				time < elapsedTime + scaledBoundary / 2
			) {
				return { type: "TRANSITION", formationIndex: i };
			}
		}

		return null;
	};

	let totalTime = 0;

	const mouseDown = onMouseDown(() => {
		const f = performance.getFormationAtTime(getTimeAtCursor());

		if (f) {
			formationSelected(f[0]);
		}

		const cursorPosition = getCursorPosition();

		if (
			cursorPosition > playbackProgress * camera.zoom.linear &&
			cursorPosition < playbackProgress * camera.zoom.linear + 20 &&
			cursorPositionRef.current[1] < 20
		) {
			seekerStateRef.current = {
				type: "SEEKING",
				start: cursorPosition,
			};
			return;
		}

		const cursorTime = getTimeAtCursor();

		if (isInBoundary(cursorTime)) {
			const resizeSide = getBoundarySelection(cursorTime);

			if (resizeSide) {
				seekerStateRef.current = {
					type: "RESIZING",
					side: resizeSide,
					start: cursorPosition,
				};
				return;
			}
		}
	});

	const onMouseMove = ({
		x,
		y,
	}: React.MouseEvent<SVGSVGElement, MouseEvent> & {
		x: number;
		y: number;
	}) => {
		const newMousePosition = [x, y] satisfies [number, number];

		if (!equals(newMousePosition, cursorPositionRef.current)) {
			cursorPositionRef.current = newMousePosition;
			setMousePosition(newMousePosition);

			const cursorPosition = getCursorPosition();

			if (seekerStateRef.current.type === "SEEKING") {
				timelineSeeked(
					(cursorPosition - seekerStateRef.current.start) / camera.zoom.linear +
						playbackProgress
				);

				seekerStateRef.current.start = cursorPosition;
			} else if (seekerStateRef.current.type === "RESIZING") {
				switch (seekerStateRef.current.side.type) {
					case "END":
						{
							const formationIndex = seekerStateRef.current.side.formationIndex;
							const start = seekerStateRef.current.start;
							setLocalFormations(
								localFormations.map((formation, index) => {
									const delta = cursorPosition - start;

									if (index === formationIndex) {
										return {
											...formation,
											duration: formation.duration + delta / camera.zoom.linear,
											transitionDuration:
												index === localFormations.length - 1
													? formation.transitionDuration
													: formation.transitionDuration -
													  delta / camera.zoom.linear,
										};
									}

									return formation;
								})
							);
						}
						break;
					case "TRANSITION":
						{
							const formationIndex = seekerStateRef.current.side.formationIndex;
							const start = seekerStateRef.current.start;
							setLocalFormations(
								localFormations.map((formation, index) => {
									const delta = cursorPosition - start;

									if (index === formationIndex + 1) {
										return {
											...formation,
											duration: formation.duration - delta / camera.zoom.linear,
										};
									}

									if (index === formationIndex) {
										return {
											...formation,
											transitionDuration:
												formation.transitionDuration +
												delta / camera.zoom.linear,
										};
									}

									return formation;
								})
							);
						}
						break;
				}
				seekerStateRef.current.start = cursorPosition;
			}
		}
	};

	const getDrawingAreaDimensions = () => {
		const svg = drawingAreaRef.current;
		const clientRect = svg
			? svg.getBoundingClientRect()
			: { width: 1, height: 1 };
		return [clientRect.width, clientRect.height] satisfies Vector2;
	};

	const tickSpacing =
		(defaultTickSpacing * pixelsToMillisecondsRatio) / camera.zoom.linear;

	console.log(Math.floor(getDrawingAreaDimensions()[0] / tickSpacing));

	return (
		<div
			className={css`
				position: relative;
				-webkit-user-select: none;
				-moz-user-select: none;
				-ms-user-select: none;
				user-select: none;
			`}
		>
			<div
				style={{
					display: "flex",
					borderTop: "1px solid #aaa",
					height: timelineHeight,
					overflowX: "scroll",
					overflowY: "hidden",
				}}
			>
				<SvgWrapper
					ref={(ref) => {
						if (ref === null) {
							return;
						}

						const currentRef = drawingAreaRef.current;
						drawingAreaRef.current = ref;

						if (currentRef === ref) {
							return;
						}

						update();
					}}
					style={{
						width: "100%",
						cursor: isInBoundary(getTimeAtCursor()) ? "ew-resize" : "default",
					}}
					onMouseDown={mouseDown}
					onMouseMove={onMouseMove}
					onWheel={(e) => {
						if (e.ctrlKey) {
							const c1 = camera.position;

							const newZoom = camera.zoom.addLogarithmic(-e.deltaY * 0.01);

							const z1 = camera.zoom.linear;
							const z2 = newZoom.linear;

							const m = cursorPositionRef.current[0];

							updateCamera({
								zoom: newZoom,
								position: ((m + c1) / z1) * z2 - m,
							});
						} else {
							updateCamera({
								position: camera.position + (e.deltaY + e.deltaX) / 2,
							});
						}
					}}
				>
					{Array.from({
						length: Math.floor(
							getDrawingAreaDimensions()[0] /
								((defaultTickSpacing * pixelsToMillisecondsRatio) /
									camera.zoom.linear)
						),
					}).map((_, i) => {
						return (
							<line
								x1={i * tickSpacing}
								x2={i * tickSpacing}
								y1="0"
								y2={`${rulerHeight}`}
								stroke="black"
							/>
						);
					})}

					{localFormations.map((formation, i) => {
						const oldTotalTime = totalTime;
						totalTime += formation.duration + formation.transitionDuration;
						return (
							<g
								key={formation.id}
								transform={`translate(${
									oldTotalTime * camera.zoom.linear - camera.position
								}, 0)`}
							>
								<rect
									y={rulerHeight}
									height={`${timelineHeight - rulerHeight}`}
									width={`${formation.duration * camera.zoom.linear}`}
									style={{
										strokeWidth: 4,
										stroke: i === currentFormationIndex ? "red" : "black",
										fill: "white",
									}}
								/>

								{i === performance.formations.length - 1 ? null : (
									<rect
										y={rulerHeight}
										x={`${formation.duration * camera.zoom.linear}`}
										height={`${timelineHeight - rulerHeight}`}
										width={`${
											formation.transitionDuration * camera.zoom.linear
										}`}
										style={{
											strokeWidth: 4,
											stroke: i === currentFormationIndex ? "red" : "black",
											fill: "white",
										}}
									></rect>
								)}
							</g>
						);
					})}

					<rect
						width="20"
						height="20"
						x={playbackProgress * camera.zoom.linear - camera.position}
						style={{
							fill: "black",
						}}
					/>
				</SvgWrapper>
			</div>

			<button
				style={{
					position: "absolute",
					right: 10,
					top: 13,
				}}
				onClick={() => {
					newFormationCreated();
				}}
			>
				Create Formation
			</button>
		</div>
	);
}
