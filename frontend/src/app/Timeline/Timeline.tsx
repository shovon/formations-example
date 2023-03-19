import { css } from "@emotion/css";
import { useContext, useEffect, useReducer, useRef, useState } from "react";
import { Performance } from "../performance-project";
import { time, TimelineState } from "../timeline-state";
import { mouseUpEvents } from "../../services/document";
import { useMouseUp } from "../../hooks/use-mouse-up";
import { equals, sub, Vector2 } from "../../lib/vector2";
import { SvgWrapper, SvgWrapperObject } from "../SvgWrapper";
import { LogarithmicValue } from "../../lib/logarithmic-value";
import { ThemeContext } from "../../contexts/theme";
import { pixelsToMillisecondsRatio } from "./timeline-constants";
import { AudioVisualizer } from "./AudioVisualizer";
import { useGetVisualizationData } from "./hooks/use-get-visualization-data/use-get-visualization-data";

// TODO: maybe this should go to the constants file?
const timelineHeight = 145;
const rulerHeight = 25;
const defaultTickSpacing = pixelsToMillisecondsRatio * 1000;
const cursorSize = 18;

// Modulo in JavaScript has a weird quirk. This is a workaround.
export function modulo(a: number, m: number) {
	return ((a % m) + m) % m;
}

// Straight up stolen from here https://stackoverflow.com/a/14415822/538570
const wrap = (x: number, a: number, b: number): number =>
	a > b ? wrap(x, b, a) : modulo(x - a, b - a) + a;

const toLog = (v: number) => LogarithmicValue.linear(v).logarithmic;
const toLin = (v: number) => LogarithmicValue.logarithmic(v).linear;

const msTom = (ms: number): string =>
	`${Math.floor(ms / 1000 / 60)
		.toString()
		.padStart(2, "0")}:${(Math.round(ms / 1000) % 60)
		.toString()
		.padStart(2, "0")}`;

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
	timelineState,
	timelineSeeked,
	timelineStoppedSeeking,
	formationTimesChanged,
}: TimelineProps) {
	const playbackProgress = time(performance, timelineState);
	const cursorPositionRef = useRef<Vector2>([NaN, NaN]);
	const { onMouseDown, onMouseUp: mouseUp } = useMouseUp();
	const seekerStateRef = useRef<SeekerState>({ type: "INACTIVE" });

	// TODO: I fucked up the camera position here.
	//
	//   The camera position was supposed to be absolute, but we *have* to divide
	//   by the camera zoom to get the absolute camera position, which is
	//   incorrect!
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
	const { theme } = useContext(ThemeContext);

	const getDrawingAreaDimensions = () => {
		const svg = drawingAreaRef.current;
		const clientRect = svg
			? svg.getBoundingClientRect()
			: { width: 1, height: 1 };
		return [clientRect.width, clientRect.height] satisfies Vector2;
	};

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
		const cursorPosition = getCursorPosition();

		if (
			cursorPosition > playbackProgress * camera.zoom.linear - cursorSize / 2 &&
			cursorPosition < playbackProgress * camera.zoom.linear + cursorSize / 2 &&
			cursorPositionRef.current[1] < 20
		) {
			seekerStateRef.current = {
				type: "SEEKING",
				start: cursorPosition,
			};
			return;
		}

		const f = performance.getFormationAtTime(getTimeAtCursor());

		if (f) {
			formationSelected(f[0]);
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

	const tickSpacing =
		(defaultTickSpacing *
			5 *
			toLin(
				wrap(
					camera.zoom.logarithmic,
					toLog(pixelsToMillisecondsRatio),
					toLog(pixelsToMillisecondsRatio * 3)
				)
			)) /
		pixelsToMillisecondsRatio;

	const playbackPosition =
		playbackProgress * camera.zoom.linear - camera.position;

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
						cursor: isInBoundary(getTimeAtCursor()) ? "col-resize" : "default",
						backgroundColor: theme.background,
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
					<AudioVisualizer
						audioSource={performance.info.audioSource}
						camera={camera}
						width={getDrawingAreaDimensions()[0]}
						height={timelineHeight - rulerHeight}
					/>
					{Array.from({
						length: Math.ceil(getDrawingAreaDimensions()[0] / tickSpacing) + 1,
					}).map((_, i) => {
						return (
							<g key={i}>
								<text
									x={i * tickSpacing - (camera.position % tickSpacing) + 3}
									y="12"
									style={{
										fill: theme.timeline.tickColor,
										fontSize: "0.75em",
									}}
								>
									{msTom(
										((i + Math.floor(camera.position / tickSpacing)) *
											tickSpacing) /
											camera.zoom.linear
									)}
								</text>
								{Array.from({ length: 5 }).map((_, j) => {
									return (
										<line
											key={j}
											x1={`${
												(i + j / 5) * tickSpacing -
												(camera.position % tickSpacing)
											}`}
											x2={`${
												(i + j / 5) * tickSpacing -
												(camera.position % tickSpacing)
											}`}
											y1={`${j === 0 ? 0 : rulerHeight * 0.8}`}
											y2={`${rulerHeight}`}
											stroke={theme.timeline.tickColor}
										/>
									);
								})}
							</g>
						);
					})}

					{localFormations.map((formation, i) => {
						const oldTotalTime = totalTime;
						totalTime += formation.duration + formation.transitionDuration;

						const top = rulerHeight;
						const left = formation.duration * camera.zoom.linear;
						const bottom = timelineHeight;
						const right =
							(formation.duration + formation.transitionDuration) *
							camera.zoom.linear;

						const topLeft = `${left},${top}`;
						const topRight = `${right},${top}`;
						const bottomLeft = `${left},${bottom}`;
						const bottomRight = `${right},${bottom}`;
						const middle = `${(left + right) / 2},${(top + bottom) / 2}`;

						const unselectedColor = theme.timeline.formation.unselected;
						const selectedColor = theme.timeline.formation.selected;

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
										fill:
											i === currentFormationIndex
												? selectedColor
												: unselectedColor,
									}}
								/>

								<line
									x1={0}
									x2={0}
									y1={rulerHeight}
									y2={timelineHeight}
									stroke={
										i === currentFormationIndex
											? selectedColor
											: unselectedColor
									}
									strokeWidth={2}
								></line>

								<line
									x1={formation.duration * camera.zoom.linear}
									x2={formation.duration * camera.zoom.linear}
									y1={rulerHeight}
									y2={timelineHeight}
									stroke={
										i === currentFormationIndex
											? selectedColor
											: unselectedColor
									}
									strokeWidth={2}
								></line>

								{i === performance.formations.length - 1 ? null : (
									<>
										<polygon
											fill={
												i === currentFormationIndex
													? selectedColor
													: unselectedColor
											}
											points={`${topLeft} ${middle} ${bottomLeft} ${topLeft}`}
										></polygon>
										<polygon
											fill={
												i + 1 === currentFormationIndex
													? selectedColor
													: unselectedColor
											}
											points={`${topRight} ${middle} ${bottomRight} ${topRight}`}
										></polygon>
									</>
								)}
							</g>
						);
					})}

					<g>
						<rect
							width={cursorSize.toString()}
							height={cursorSize.toString()}
							x={playbackPosition - 9}
							style={{
								fill: "#FFC042",
							}}
						/>
						<polygon
							fill="#FFC042"
							points={`${playbackPosition - 9},${18} ${playbackPosition},25 ${
								playbackPosition + 9
							},18 ${playbackPosition - 9},${18}`}
						></polygon>

						<line
							x1={playbackPosition}
							x2={playbackPosition}
							y1={0}
							y2={timelineHeight}
							stroke="#FFC042"
							strokeWidth={2}
						></line>
					</g>
				</SvgWrapper>
			</div>
		</div>
	);
}
