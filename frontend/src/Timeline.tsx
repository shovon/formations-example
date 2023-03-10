import { css } from "@emotion/css";
import { useCallback, useEffect, useRef, useState } from "react";
import { Formation, Performance } from "./performance-project";
import { time, TimelineState } from "./timeline-state";
import { mouseUpEvents } from "./document";
import { useMouseUp } from "./use-mouse-up";
import { equals, sub, Vector2 } from "./vector2";
import { SvgWrapper, SvgWrapperObject } from "./SvgWrapper";
import { LogarithmicValue } from "./logarithmic-value";

// TODO: soft code this
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
	const [zoom, setZoom] = useState(
		LogarithmicValue.linear(pixelsToMillisecondsRatio)
	);

	useEffect(() => {
		const onMouseUp = mouseUp(() => {
			if (seekerStateRef.current.type === "SEEKING") {
				seekerStateRef.current = { type: "INACTIVE" };
				timelineStoppedSeeking(cursorPositionRef.current[0] / zoom.linear);
			}
		});

		mouseUpEvents.addListener(onMouseUp);

		return () => {
			mouseUpEvents.removeListener(onMouseUp);
		};
	}, [timelineStoppedSeeking, playbackProgress, mouseUpEvents]);

	let totalTime = 0;

	const mouseDown = onMouseDown(() => {
		const svg = drawingAreaRef.current;

		if (
			cursorPositionRef.current[0] > playbackProgress * zoom.linear &&
			cursorPositionRef.current[0] < playbackProgress * zoom.linear + 20 &&
			cursorPositionRef.current[1] < 20
		) {
			seekerStateRef.current = {
				type: "SEEKING",
				start: cursorPositionRef.current[0],
			};
		}
	});

	const onMouseMove = useCallback(
		({
			x,
			y,
		}: React.MouseEvent<SVGSVGElement, MouseEvent> & {
			x: number;
			y: number;
		}) => {
			const newMousePosition = [x, y] satisfies [number, number];
			if (!equals(newMousePosition, cursorPositionRef.current)) {
				cursorPositionRef.current = newMousePosition;
				if (seekerStateRef.current.type === "SEEKING") {
					timelineSeeked(
						(cursorPositionRef.current[0] - seekerStateRef.current.start) /
							zoom.linear +
							playbackProgress
					);

					seekerStateRef.current.start = cursorPositionRef.current[0];
				}
			}
		},
		[playbackProgress]
	);

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
					padding: 5,
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
							setZoom(zoom.addLogarithmic(-e.deltaY * 0.01));
						}
					}}
				>
					{performance.formations.map((formation, i) => {
						const oldTotalTime = totalTime;
						totalTime += formation.duration + formation.transitionDuration;
						return (
							<g
								key={formation.id}
								transform={`translate(${oldTotalTime * zoom.linear}, 0)`}
							>
								<rect
									height="100"
									width={`${formation.duration * zoom.linear}`}
									style={{
										strokeWidth: 4,
										stroke: i === currentFormationIndex ? "red" : "black",
										fill: "white",
									}}
								/>

								{i === performance.formations.length - 1 ? null : (
									<rect
										x={`${formation.duration * zoom.linear}`}
										height="100"
										width={`${formation.transitionDuration * zoom.linear}`}
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
						x={playbackProgress * zoom.linear}
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
