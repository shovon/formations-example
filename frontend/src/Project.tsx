import { useCallback, useContext, useMemo, useState } from "react";
import { Editor } from "./Editor";
import {
	PerformanceProject,
	performance,
	EntityPlacement,
} from "./performance-project";
import {
	getCurrentFormationIndex,
	getTimelineByFormationIndex,
	TimelineState,
} from "./timeline-state";
import { useSet } from "./use-set";
import { add } from "./vector2";
import { hasKV } from "./iterable-helpers";
import { Timeline } from "./Timeline";
import { ThemeContext } from "./theme";
import { Button } from "./Button";
import { Tab, Tabbed } from "./Tabbed";

// We will have two modes:
//
// Current time mode and current formation mode
//
// Current time mode is when the user is seeking through the timeline.
//
// Current formation mode is when a formation was selected.
//
// Pressing down on the seeker handle will result in current time mode
//
// Letting go of the seeker handle will result in current formation mode
//
// 1. when user seeks in timeline, performers are likely not to move at all,
//   until a transition point is hit
// 2. when user seeks at transition point, move performers proportional to the
//   transition point
// 3. when user lets go of the seeker (mouse up)
//   a. seeker was in transition point:
//     1. seeker should move to the nearest end of the nearest formation
//   b. seeker was in formation point:
//     2. seeker should stay where it is (e.g. don't bother moving it to either
//       edge of the formation)

function arbitraryHSL(): [number, number, number] {
	return [Math.random() * 360, 0.5, 0.5];
}

function hslToStr([h, s, l]: [number, number, number]): string {
	return `hsl(${h}, ${s * 100}%, ${l * 100}%)`;
}

function randomString(length: number = 10): string {
	const chars =
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

	return Array.from({ length })
		.map(() => chars[Math.floor(Math.random() * chars.length)])
		.join("");
}

type ProjectProps = {
	performance: PerformanceProject;
	projectUpdated: (project: PerformanceProject) => void;
};

export function Project({
	performance: { formations, entities },
	projectUpdated,
}: ProjectProps) {
	const performanceProject = useMemo(
		() => performance({ formations, entities }),
		[formations, entities]
	);
	const [timeline, setTimeline] = useState<TimelineState>({
		mode: "CURRENT_FORMATION",
		index: 0,
		position: 0,
	});
	const currentFormationIndex = getCurrentFormationIndex(
		performanceProject,
		timeline
	);
	const { theme } = useContext(ThemeContext);

	const selections = useSet<string>();

	// TODO: unit test this
	const newFormationName = () => {
		const latest =
			[...formations]
				.map(({ name }) => name)
				.filter((name) => /^Formation \d+$/.test(name))
				.map((n) => parseInt(n.split(" ")[1]))
				.sort((a, b) => b - a)[0] ?? 0;

		return `Formation ${latest + 1}`;
	};

	const newPerformerName = () => {
		const latest =
			[...entities]
				.map(([, { name }]) => name)
				.filter((name) => /^Performer \d+$/.test(name))
				.map((n) => parseInt(n.split(" ")[1]))
				.sort((a, b) => b - a)[0] ?? 0;

		return `Performer ${latest + 1}`;
	};

	const addEntity = useCallback(() => {
		let draft = { formations, entities };

		// The basis case where the formations list is empty:

		if ([...formations].length === 0) {
			draft = performance(draft).pushFormation(newFormationName(), 5000, 1000);
		}

		const allPlacements = [
			...performance(draft).getFormationIndex(currentFormationIndex).placements,
		];

		const lastEntity = allPlacements[allPlacements.length - 1];
		let position = [0, 0] satisfies [number, number];
		if (lastEntity) {
			position = add(lastEntity[1].position, [10, -10]);
		}

		const placement = { position } satisfies EntityPlacement;

		// TODO: don't use a random string
		let id = newPerformerName();

		draft = performance(draft).addEntity(id, {
			color: hslToStr(arbitraryHSL()),
			name: randomString(),
		});

		draft = performance(draft)
			.getFormationIndex(0)
			.entity(id)
			.setPlacement(placement);

		projectUpdated(draft);
	}, [performanceProject]);

	return (
		<div
			style={{
				height: "100vh",
				display: "flex",
				flexDirection: "column",
				background: theme.background,
			}}
		>
			<div
				style={{
					flex: "1",
					display: "flex",
				}}
			>
				<div
					style={{
						width: 200,
						background: theme.background,
					}}
				>
					<Tabbed style={{ height: "100%" }}>
						<Tab icon={"cool"}>
							<div
								style={{
									display: "flex",
									flexDirection: "column",
								}}
							>
								<div style={{ flex: "1" }}></div>
								<div style={{ textAlign: "center", paddingBottom: "10px" }}>
									<Button
										onClick={() => {
											projectUpdated(
												performanceProject.pushFormation(
													newFormationName(),
													5000,
													3000
												)
											);
										}}
									>
										New Formation
									</Button>
								</div>
							</div>
						</Tab>
					</Tabbed>
				</div>

				<Editor
					timelineState={timeline}
					performance={performanceProject}
					style={{
						flex: "1",
						height: "100%",
						width: "100vw",
					}}
					selections={selections}
					onPositionsChange={(changes, formationIndex) => {
						projectUpdated(
							performanceProject
								.getFormationIndex(formationIndex)
								.setPositions(changes)
						);
					}}
					onSelectionsChange={(newSelections) => {
						selections.clear();
						selections.add(...newSelections);
					}}
					onFormationIndexChange={(i) => {
						setTimeline(getTimelineByFormationIndex(performanceProject, i));
					}}
				/>
			</div>

			<div
				style={{
					top: 4,
					right: 10,
					position: "absolute",
					fontSize: "1.5em",
				}}
			>
				<button
					style={{
						cursor: "pointer",
					}}
					onClick={addEntity}
				>
					Add Entity
				</button>
			</div>

			<Timeline
				formationTimesChanged={(formationTimes) => {
					projectUpdated(
						performanceProject.updateFormationTimes(formationTimes)
					);
				}}
				formationSelected={(i) => {
					setTimeline(getTimelineByFormationIndex(performanceProject, i));
				}}
				performance={performanceProject}
				timelineState={timeline}
				currentFormationIndex={currentFormationIndex}
				timelineStoppedSeeking={(time) => {
					const form = performanceProject.getFormationAtTime(time);
					if (!form) return;

					setTimeline({
						mode: "CURRENT_FORMATION",
						index: form[0],
						position: 0,
					});
				}}
				timelineSeeked={(time) => {
					const form = performanceProject.getFormationAtTime(time);
					if (!form) return;
					setTimeline({
						mode: "SEEKER",
						time,
					});
				}}
			/>

			<div>Cool</div>
		</div>
	);
}
