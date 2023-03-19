import { useState } from "react";
import { PerformanceProject } from "./performance-project";
import { Project } from "./Project/Project";
import { ThemeProvider } from "../contexts/theme";

function App() {
	const [{ formations, entities, info }, setProject] =
		useState<PerformanceProject>({
			info: {
				audioSource:
					"https://res.cloudinary.com/stagekeep/video/upload/v1670787456/files/iy8cxmf2xlevvtzxqppr.mp3",
			},
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

	return (
		<ThemeProvider>
			<Project
				performance={{ formations, entities, info }}
				projectUpdated={setProject}
			></Project>
		</ThemeProvider>
	);
}

export default App;
