import { css } from "@emotion/css";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Formation, Performance } from "./performance-project";
import { time, TimelineState } from "./timeline-state";
import { mouseUpEvents } from "./document";
import { useMouseUp } from "./use-mouse-up";
import { equals, sub, Vector2 } from "./vector2";
import { SvgWrapper, SvgWrapperObject } from "./SvgWrapper";
import { LogarithmicValue } from "./logarithmic-value";

// TODO: maybe this should go to the constants file?
const pixelsToMillisecondsRatio = 0.04;

type TimelineProps = {
	performance: Performance;
	timelineState: TimelineState;
	formationSelected: (index: number) => void;
	currentFormationIndex: number;
	newFormationCreated: () => void;
	timelineSeeked: (time: number) => void;
	timlineStoppedSeeking: (time: number) => void;
};

type SeekerState = { type: "INACTIVE" } | { type: "SEEKING"; start: number };

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
	timlineStoppedSeeking: timelineStoppedSeeking,
}: TimelineProps) {
	const playbackProgress = time(performance, timelineState);
	const cursorPositionRef = useRef<Vector2>([NaN, NaN]);
	const { onMouseDown, onMouseUp: mouseUp } = useMouseUp();
	const drawingAreaRef = useRef<SvgWrapperObject | null>(null);
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

	useEffect(() => {
		const onMouseUp = mouseUp(() => {
			if (seekerStateRef.current.type === "SEEKING") {
				seekerStateRef.current = { type: "INACTIVE" };
				timelineStoppedSeeking(getCursorPosition() / camera.zoom.linear);
			}
		});

		mouseUpEvents.addListener(onMouseUp);

		return () => {
			mouseUpEvents.removeListener(onMouseUp);
		};
	}, [timelineStoppedSeeking, playbackProgress, mouseUpEvents]);

	// NOTE: this is not necessarily the global mouse position!
	const getCursorPosition = (): number => {
		return cursorPositionRef.current[0] + camera.position;
	};

	let totalTime = 0;

	const mouseDown = onMouseDown(() => {
		const svg = drawingAreaRef.current;

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

		console.log((newMousePosition[0] + camera.position) / camera.zoom.linear);

		if (!equals(newMousePosition, cursorPositionRef.current)) {
			cursorPositionRef.current = newMousePosition;

			const cursorPosition = getCursorPosition();

			if (seekerStateRef.current.type === "SEEKING") {
				timelineSeeked(
					(cursorPosition - seekerStateRef.current.start) / camera.zoom.linear +
						playbackProgress
				);

				seekerStateRef.current.start = cursorPosition;
			}
		}
	};

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
					height: 100,
					overflowX: "scroll",
					overflowY: "hidden",
				}}
			>
				<SvgWrapper
					style={{
						width: "100%",
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
					{performance.formations.map((formation, i) => {
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
									height="100"
									width={`${formation.duration * camera.zoom.linear}`}
									style={{
										strokeWidth: 4,
										stroke: i === currentFormationIndex ? "red" : "black",
										fill: "white",
									}}
								/>

								{i === performance.formations.length - 1 ? null : (
									<rect
										x={`${formation.duration * camera.zoom.linear}`}
										height="100"
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

			{/* <div
				style={{
					position: "absolute",
					top: 0,
					left: playbackProgress * pixelsToMillisecondsRatio,
					width: 50,
					height: 50,
					background: "black",
					opacity: 0.25,
				}}
				onMouseDown={onMouseDown(() => {
					isSeekerDownRef.current = true;
				})}
			></div> */}

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
