import { useCallback, useRef, useState } from "react";
import { Editor } from "./Editor";
import { hasKV, map } from "./iterable-helpers";
import {
	EntityPlacement,
	performance,
	PerformanceProject,
} from "./performance-project";
import { useSet } from "./use-set";
import { add, Vector2 } from "./vector2";
import produce from "immer";

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

type Formation = {
	name: string;
	entities: Iterable<
		[
			string,
			{
				position: Vector2;
				path: [Vector2, Vector2];
			}
		]
	>;
};

// TODO: switch to immer. This is getting waaaay out of hand

function App() {
	const [currentFormationIndex, setCurrentFormationIndex] = useState(2);
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
				name: "Formation 1",
				positions: new Map([
					["1", { position: [-100, 100] }],
					["2", { position: [100, 100] }],
					["3", { position: [-100, -100] }],
					["4", { position: [100, -100] }],
					["5", { position: [300, 0] }],
				]),
			},
			{
				name: "Formation 1",
				positions: new Map([["1", { position: [-100, 50] }]]),
			},
			{
				name: "Formation 1",
				positions: new Map([["5", { position: [100, 0] }]]),
			},
		],
	});

	console.log(currentFormationIndex);

	const performanceProject = performance({ formations, entities });

	const selections = useSet<string>();

	// TODO: unit test this
	const newFormationName = () => {
		const latest = [...formations]
			.map(({ name }) => name)
			.filter((name) => /^Formation \d+$/.test(name))
			.map((n) => parseInt(n.split(" ")[1]))
			.sort((a, b) => b - a)[0];

		return `Formation ${latest}`;
	};

	const addEntity = useCallback(() => {
		let draft = { formations, entities };

		// The basis case where the formations list is empty:
		if ([...formations].length === 0) {
			draft = performance(draft).pushFormation(newFormationName());
		}

		const allPlacements = [
			...performance(draft).getFormation(currentFormationIndex).placements,
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
			.getFormation(0)
			.entity(id)
			.setPlacement(placement);

		console.log(draft);

		setProject(draft);
	}, [performanceProject]);

	return (
		<div>
			<Editor
				performance={performanceProject}
				style={{
					width: "100vw",
					height: "100vh",
				}}
				currentFormationIndex={currentFormationIndex}
				selections={selections}
				onPositionsChange={(changes, formationIndex) => {
					setProject(
						performanceProject
							.getFormation(formationIndex)
							.setPositions(changes)
					);
				}}
				onSelectionsChange={(newSelections) => {
					selections.clear();
					selections.add(...newSelections);
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
		</div>
	);
}

export default App;
