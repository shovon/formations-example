import { Editor } from "./Editor";
import { Vector2 } from "./vector2";

function App() {
	const circles = new Map<
		string,
		{ position: Vector2; color: string; name: string }
	>([
		["1", { position: [-100, 100], color: "red", name: "A" }],
		["2", { position: [100, 100], color: "green", name: "B" }],
		["3", { position: [-100, -100], color: "blue", name: "C" }],
		["4", { position: [100, -100], color: "purple", name: "D" }],
		["5", { position: [300, 0], color: "orange", name: "E" }],
	]);

	return <Editor circles={circles} />;
}

export default App;
