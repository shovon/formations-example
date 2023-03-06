import { useCallback, useMemo, useRef, useState } from "react";
import { Editor } from "./Editor";
import { hasKV, map } from "./iterable-helpers";
import {
	EntityPlacement,
	performance,
	PerformanceProject,
} from "./performance-project";
import { Timeline } from "./Timeline";
import {
	getCurrentFormationIndex,
	getTimelineByFormationIndex,
	TimelineState,
} from "./timeline-state";
import { useSet } from "./use-set";
import { add } from "./vector2";

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

function App() {
	const [{ formations, entities }, setProject] = useState<PerformanceProject>({
		entities: [
			["1", { color: "red", name: "A" }],
			["2", { color: "green", name: "B" }],
			["3", { color: "blue", name: "C" }],
			["4", { color: "purple", name: "D" }],
			["5", { color: "hsl(15, 100%, 72%)", name: "E" }],
		],
		formations: [
			{
				id: "formation1",
				name: "Formation 1",
				positions: new Map([
					["1", { position: [-100, 100] }],
					["2", { position: [100, 100] }],
					["3", { position: [-100, -100] }],
					["4", { position: [100, -100] }],
					["5", { position: [300, 0] }],
				]),
				duration: 2000,
				transitionDuration: 1000,
			},
			{
				id: "formation2",
				name: "Formation 2",
				positions: new Map([["1", { position: [-100, 50] }]]),
				duration: 6000,
				transitionDuration: 1500,
			},
			{
				id: "formation3",
				name: "Formation 3",
				positions: new Map([["5", { position: [100, 0] }]]),
				duration: 2000,
				transitionDuration: 2000,
			},
		],
	});

	const [timeline, setTimeline] = useState<TimelineState>({
		mode: "CURRENT_FORMATION",
		index: 0,
		position: 0,
	});

	const performanceProject = useMemo(
		() => performance({ formations, entities }),
		[formations, entities]
	);

	const currentFormationIndex = getCurrentFormationIndex(
		performanceProject,
		timeline
	);

	const selections = useSet<string>();

	// TODO: unit test this
	const newFormationName = () => {
		const latest = [...formations]
			.map(({ name }) => name)
			.filter((name) => /^Formation \d+$/.test(name))
			.map((n) => parseInt(n.split(" ")[1]))
			.sort((a, b) => b - a)[0];

		return `Formation ${latest + 1}`;
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
		let id = randomString();
		while (hasKV(entities, id)) {
			id = randomString();
		}

		draft = performance(draft).addEntity(id, {
			color: hslToStr(arbitraryHSL()),
			name: randomString(),
		});

		draft = performance(draft)
			.getFormationIndex(0)
			.entity(id)
			.setPlacement(placement);

		setProject(draft);
	}, [performanceProject]);

	return (
		<div
			style={{
				height: "100vh",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Editor
				timelineState={timeline}
				performance={performanceProject}
				style={{
					flex: "1",
					width: "100vw",
				}}
				currentFormationIndex={currentFormationIndex}
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
				formationSelected={(i) => {
					setTimeline(getTimelineByFormationIndex(performanceProject, i));
				}}
				performance={performanceProject}
				timelineState={timeline}
				currentFormationIndex={currentFormationIndex}
				newFormationCreated={() => {
					setProject(
						performanceProject.pushFormation(newFormationName(), 5000, 1000)
					);
				}}
				timelineSeeked={(time) => {}}
			/>
		</div>
	);
}

export default App;
