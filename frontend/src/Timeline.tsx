import { css } from "@emotion/css";
import { useEffect, useRef } from "react";
import { Formation, Performance } from "./performance-project";
import { time, TimelineState } from "./timeline-state";

// TODO: soft code this
const pixelsToMillisecondsRatio = 0.04;

type TimelineProps = {
	// TODO: this has got to go
	performance: Performance;
	timelineState: TimelineState;
	formationSelected: (index: number) => void;
	currentFormationIndex: number;
	newFormationCreated: () => void;
	timelineSeeked: (time: number) => void;
};

export function Timeline({
	performance,
	formationSelected,
	currentFormationIndex,
	newFormationCreated,
	timelineState,
	timelineSeeked,
}: TimelineProps) {
	const playbackProgress = time(performance, timelineState);
	const isSeekerDownRef = useRef(false);

	useEffect(() => {
		const onMouseUp = () => {
			isSeekerDownRef.current = false;
		};

		document.addEventListener("mouseup", onMouseUp);

		return () => {
			document.removeEventListener("mouseup", onMouseUp);
		};
	}, []);

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
				if (isSeekerDownRef.current) {
					// TODO: using e.clientX is just not a good idea
					timelineSeeked(e.clientX / pixelsToMillisecondsRatio);
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
				{performance.formations.map((formation, i) => {
					return (
						<div
							style={{
								display: "flex",
								flexDirection: "row",
							}}
							key={formation.id}
						>
							<div
								onClick={() => {
									formationSelected(i);
								}}
								style={{
									background: "white",
									borderWidth: 4,
									borderStyle: "solid",
									borderColor: i === currentFormationIndex ? "red" : "black",
									boxSizing: "border-box",
									borderRadius: 8,
									padding: "5px 10px",
									width: formation.duration * pixelsToMillisecondsRatio,
									height: "100%",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
									overflow: "hidden",
								}}
							>
								{formation.name}
							</div>
							{i === performance.formations.length - 1 ? null : (
								<div
									style={{
										background: "white",
										borderWidth: 4,
										borderStyle: "solid",
										borderColor: i === currentFormationIndex ? "red" : "black",
										boxSizing: "border-box",
										borderRadius: 8,
										padding: "5px 10px",
										width:
											formation.transitionDuration * pixelsToMillisecondsRatio,
										height: "100%",
										opacity: 0.5,
									}}
								></div>
							)}
						</div>
					);
				})}
			</div>

			<div
				style={{
					position: "absolute",
					top: 0,
					left: playbackProgress * pixelsToMillisecondsRatio,
					width: 50,
					height: 50,
					background: "black",
				}}
				onMouseDown={() => {
					isSeekerDownRef.current = true;
				}}
			></div>

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
