import { Editor, Entity } from "./Editor";
import { useMap } from "./use-map";
import { useSet } from "./use-set";

type EntityEntity = {
	color: string;
	name: string;
};

function App() {
	const entities = useMap<string, Entity>([
		["1", { position: [-100, 100], color: "red", name: "A" }],
		["2", { position: [100, 100], color: "green", name: "B" }],
		["3", { position: [-100, -100], color: "blue", name: "C" }],
		["4", { position: [100, -100], color: "purple", name: "D" }],
		["5", { position: [300, 0], color: "orange", name: "E" }],
	]);
	const selections = useSet<string>();

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				width: "100vw",
				height: "100vh",
			}}
		>
			<Editor
				style={{ flex: 1 }}
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
			<div>Whoa dude</div>
		</div>
	);
}

export default App;
