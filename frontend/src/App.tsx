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

// TODO: soft code this
const pixelsToMillisecondsRatio = 0.04;

function App() {
	const [currentFormationIndex, setCurrentFormationIndex] = useState(0);
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
	const [playbackProgress] = useState(12500);

	const performanceProject = performance({ formations, entities });

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
							.getFormation(formationIndex)
							.setPositions(changes)
					);
				}}
				onSelectionsChange={(newSelections) => {
					selections.clear();
					selections.add(...newSelections);
				}}
				onFormationIndexChange={(i) => {
					setCurrentFormationIndex(i);
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

			<div
				style={{
					position: "relative",
				}}
			>
				<div
					style={{
						position: "absolute",
						top: 0,
						left: playbackProgress * pixelsToMillisecondsRatio,
						width: 50,
						height: 50,
						background: "black",
					}}
				></div>
				<div
					style={{
						display: "flex",
						borderTop: "1px solid #aaa",
						height: 100,
						overflowX: "scroll",
						overflowY: "hidden",
						padding: 5,
					}}
				>
					{formations.map((formation, i) => {
						return (
							<div
								style={{
									display: "flex",
									flexDirection: "row",
								}}
								key={formation.id}
							>
								<div
									onClick={() => {
										setCurrentFormationIndex(i);
									}}
									style={{
										background: "white",
										borderWidth: 4,
										borderStyle: "solid",
										borderColor: i === currentFormationIndex ? "red" : "black",
										boxSizing: "border-box",
										borderRadius: 8,
										padding: "5px 10px",
										width: formation.duration * pixelsToMillisecondsRatio,
										height: "100%",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										overflow: "hidden",
									}}
								>
									{formation.name}
								</div>
								{i === formations.length - 1 ? null : (
									<div
										style={{
											background: "white",
											borderWidth: 4,
											borderStyle: "solid",
											borderColor:
												i === currentFormationIndex ? "red" : "black",
											boxSizing: "border-box",
											borderRadius: 8,
											padding: "5px 10px",
											width:
												formation.transitionDuration *
												pixelsToMillisecondsRatio,
											height: "100%",
											opacity: 0.5,
										}}
									></div>
								)}
							</div>
						);
					})}
				</div>

				<button
					style={{
						position: "absolute",
						right: 10,
						top: 13,
					}}
					onClick={() => {
						setProject(
							performanceProject.pushFormation(newFormationName(), 5000, 1000)
						);
					}}
				>
					Create Formation
				</button>
			</div>
		</div>
	);
}

export default App;
