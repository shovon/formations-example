import { useCallback } from "react";
import { Editor, Entity } from "./Editor";
import { useMap } from "./use-map";
import { useSet } from "./use-set";
import { add } from "./vector2";

type EntityEntity = {
	color: string;
	name: string;
};

function arbitraryHSL(): [number, number, number] {
	return [Math.random() * 360, 0.5, 0.5];
}

function hslToStr([h, s, l]: [number, number, number]): string {
	return `hsl(${h}, ${s}%, ${l}%)`;
}

function randomString(length: number = 10): string {
	const chars =
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

	return Array.from({ length })
		.map(() => chars[Math.floor(Math.random() * chars.length)])
		.join("");
}

function App() {
	const entities = useMap<string, Entity>([
		["1", { position: [-100, 100], color: "red", name: "A" }],
		["2", { position: [100, 100], color: "green", name: "B" }],
		["3", { position: [-100, -100], color: "blue", name: "C" }],
		["4", { position: [100, -100], color: "purple", name: "D" }],
		["5", { position: [300, 0], color: "hsl(15, 100%, 72%)", name: "E" }],
	]);
	const selections = useSet<string>();

	const addEntity = useCallback(() => {
		const allEntities = [...entities];
		const lastEntity = allEntities[allEntities.length - 1];
		let position = [0, 0] satisfies [number, number];
		if (lastEntity) {
			position = add(position, [10, 10]);
		}
		const entity: Entity = {
			position,
			color: hslToStr(arbitraryHSL()),
			name: randomString(),
		};
		let id = randomString();
		while (entities.has(id)) {
			id = randomString();
		}
		entities.set(id, entity);
	}, [entities]);

	return (
		<div>
			<Editor
				style={{
					width: "100vw",
					height: "100vh",
				}}
				entities={entities}
				selections={selections}
				onPositionsChange={(changes) => {
					for (const [id, newPosition] of changes) {
						const entity = entities.get(id);
						if (entity) {
							entities.set(id, { ...entity, position: newPosition });
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
