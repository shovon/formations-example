import { Formation } from "./performance-project";

// TODO: soft code this
const pixelsToMillisecondsRatio = 0.04;

type TimelineProps = {
	// TODO: this has got to go
	playbackProgress: number;
	formations: Formation[];
	formationSelected: (index: number) => void;
	currentFormationIndex: number;
	newFormationCreated: () => void;
};

export function Timeline({
	playbackProgress,
	formations,
	formationSelected,
	currentFormationIndex,
	newFormationCreated,
}: TimelineProps) {
	return (
		<div
			style={{
				position: "relative",
			}}
		>
			<div
				style={{
					position: "absolute",
					top: 0,
					left: playbackProgress * pixelsToMillisecondsRatio,
					width: 50,
					height: 50,
					background: "black",
				}}
			></div>
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
				{formations.map((formation, i) => {
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
							{i === formations.length - 1 ? null : (
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

			<button
				style={{
					position: "absolute",
					right: 10,
					top: 13,
				}}
				onClick={() => {
					// newFormationCreated(
					// 	performanceProject.pushFormation(newFormationName(), 5000, 1000)
					// );
					newFormationCreated();
				}}
			>
				Create Formation
			</button>
		</div>
	);
}
