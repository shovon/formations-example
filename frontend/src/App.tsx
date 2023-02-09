import { Editor } from "./Editor";
import { Vector2 } from "./vector2";

function App() {
	const circles = new Map<
		string,
		{ position: Vector2; color: string; name: string }
	>([["1", { position: [-100, 100], color: "red", name: "A" }]]);

	return <Editor circles={circles} />;
}

export default App;
