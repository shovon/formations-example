import { useMemo, useState } from "react";
import { Editor } from "./Editor";
import {
	getCurrentFormationIndex,
	getTimelineByFormationIndex,
	TimelineState,
} from "./timeline-state";
import { useSet } from "./use-set";

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

export function Project() {
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

	const selections = useSet<string>();

	return (
		<div
			style={{
				height: "100vh",
				display: "flex",
				flexDirection: "column",
				background: "black",
			}}
		>
			<Editor
				timelineState={timeline}
				performance={performanceProject}
				style={{
					flex: "1",
					width: "100vw",
				}}
				selections={selections}
				onPositionsChange={(changes, formationIndex) => {
					setProject(
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
					setProject(performanceProject.updateFormationTimes(formationTimes));
				}}
				formationSelected={(i) => {
					setTimeline(getTimelineByFormationIndex(performanceProject, i));
				}}
				performance={performanceProject}
				timelineState={timeline}
				currentFormationIndex={currentFormationIndex}
				newFormationCreated={() => {
					setProject(
						performanceProject.pushFormation(newFormationName(), 5000, 3000)
					);
				}}
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
