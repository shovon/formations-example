import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hasKV, map } from "./iterable-helpers";
import {
	EntityPlacement,
	performance,
	PerformanceProject,
} from "./performance-project";
import { Project } from "./Project";
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
				duration: 5000,
				transitionDuration: 3000,
			},
			{
				id: "formation2",
				name: "Formation 2",
				positions: new Map([["1", { position: [-100, 50] }]]),
				duration: 7000,
				transitionDuration: 3000,
			},
			{
				id: "formation3",
				name: "Formation 3",
				positions: new Map([["5", { position: [100, 0] }]]),
				duration: 5000,
				transitionDuration: 3000,
			},
		],
	});

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

	return <Project></Project>;
}

export default App;
