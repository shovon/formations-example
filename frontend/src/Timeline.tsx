import { css } from "@emotion/css";
import { useEffect, useRef } from "react";
import { Formation, Performance } from "./performance-project";
import { time, TimelineState } from "./timeline-state";
import { mouseUpEvents } from "./document";
import { useMouseUp } from "./use-mouse-up";
import { sub, Vector2 } from "./vector2";

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
	const isSeekerDownRef = useRef(false);
	const cursorXRef = useRef(NaN);
	const { onMouseDown, onMouseUp: mouseUp } = useMouseUp();

	useEffect(() => {
		const onMouseUp = mouseUp(() => {
			if (isSeekerDownRef.current) {
				isSeekerDownRef.current = false;
				timelineStoppedSeeking(cursorXRef.current / pixelsToMillisecondsRatio);
			}
		});

		mouseUpEvents.addListener(onMouseUp);

		return () => {
			mouseUpEvents.removeListener(onMouseUp);
		};
	}, [timelineStoppedSeeking]);

	let totalTime = 0;

	return (
		<div
			className={css`
				position: relative;
				-webkit-user-select: none;
				-moz-user-select: none;
				-ms-user-select: none;
				user-select: none;
			`}
			onMouseMove={(e) => {
				cursorXRef.current = e.clientX;
				if (isSeekerDownRef.current) {
					// TODO: using e.clientX is just not a good idea
					timelineSeeked(cursorXRef.current / pixelsToMillisecondsRatio);
				}
			}}
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
				<svg
					width={"100%"}
					onMouseMove={(e) => {
						const rect = e.currentTarget.getBoundingClientRect();
						const rectPos = [rect.left, rect.top] satisfies Vector2;
						const clientXY = [e.clientX, e.clientY] satisfies Vector2;

						const [x] = sub(clientXY, rectPos);

						console.log(`Mouse move time ${x / pixelsToMillisecondsRatio}`);
					}}
				>
					{performance.formations.map((formation, i) => {
						const oldTotalTime = totalTime;
						totalTime += formation.duration + formation.transitionDuration;
						return (
							<g
								key={formation.id}
								transform={`translate(${
									oldTotalTime * pixelsToMillisecondsRatio
								}, 0)`}
							>
								<rect
									height="100"
									width={`${formation.duration * pixelsToMillisecondsRatio}`}
									style={{
										strokeWidth: 4,
										stroke: i === currentFormationIndex ? "red" : "black",
										fill: "white",
									}}
								/>

								{i === performance.formations.length - 1 ? null : (
									<rect
										x={`${formation.duration * pixelsToMillisecondsRatio}`}
										height="100"
										width={`${
											formation.transitionDuration * pixelsToMillisecondsRatio
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
						x={playbackProgress * pixelsToMillisecondsRatio}
						style={{
							fill: "black",
						}}
					/>
				</svg>
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
