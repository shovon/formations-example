import { useCallback } from "react";
import { Editor, Entity, EntityPlacement } from "./Editor";
import { useMap } from "./use-map";
import { useSet } from "./use-set";
import { add, Vector2 } from "./vector2";

type EntityEntity = {
	color: string;
	name: string;
};

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

function App() {
	const entities = useMap<string, Entity>([
		["1", { color: "red", name: "A" }],
		["2", { color: "green", name: "B" }],
		["3", { color: "blue", name: "C" }],
		["4", { color: "purple", name: "D" }],
		["5", { color: "hsl(15, 100%, 72%)", name: "E" }],
	]);

	const placements = useMap<string, EntityPlacement>([
		["1", { position: [-100, 100] }],
		["2", { position: [100, 100] }],
		["3", { position: [-100, -100] }],
		["4", { position: [100, -100] }],
		["5", { position: [300, 0] }],
	]);

	const selections = useSet<string>();

	const addEntity = useCallback(() => {
		const allPlacements = [...placements];

		const lastEntity = allPlacements[allPlacements.length - 1];
		let position = [0, 0] satisfies [number, number];
		if (lastEntity) {
			position = add(lastEntity[1].position, [10, -10]);
		}

		const entity: Entity = {
			color: hslToStr(arbitraryHSL()),
			name: randomString(),
		};

		const placemeent = { position };

		let id = randomString();
		while (entities.has(id)) {
			id = randomString();
		}
		entities.set(id, entity);
		placements.set(id, placemeent);
	}, [entities]);

	return (
		<div>
			<Editor
				style={{
					width: "100vw",
					height: "100vh",
				}}
				entities={entities}
				entityPlacements={placements}
				selections={selections}
				onPositionsChange={(changes) => {
					for (const [id, newPosition] of changes) {
						const entity = entities.get(id);
						if (entity) {
							placements.set(id, { ...entity, position: newPosition });
						}
					}
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
