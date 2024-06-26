import { getKV, hasKV, map, setKV, unionKV } from "../lib/iterable-helpers";
import produce from "immer";
import { Vector2 } from "../lib/vector2";

export type Entity = {
	color: string;
	name: string;
};

export type EntityPlacement = { position: Vector2 };

type FormationTime = {
	id: string;
	duration: number;
	transitionDuration: number;
};

export type Formation = {
	id: string;
	name: string;
	positions: Iterable<[string, EntityPlacement]>;
	duration: number;
	transitionDuration: number;
};

type UnorderedIterable<T> = Iterable<T>;

type Music =
	| null
	| {
			type: "8CountBeat";
	  }
	| {
			type: "custom";
			value: {
				name: string;
				url: string;
			};
	  };

export type PerformanceProject = {
	name: string;
	imageUrl: string;
	entities: UnorderedIterable<[string, Entity]>;
	formations: Formation[];
	music: Music;
};

// TODO: unit test this
const entityPlacement =
	({ formations }: PerformanceProject, index: number) =>
	(entityId: string): EntityPlacement => {
		if (index < 0 || index > formations.length) {
			return { position: [0, 0] };
		}

		const formation = formations[index];
		if (!formation) {
			return { position: [0, 0] };
		}
		const placement = getKV(formation.positions, entityId);

		if (placement) {
			return placement;
		}

		if (!placement) {
			const formation = formations
				.slice(0, index)
				.reverse()
				.find((f) => hasKV(f.positions, entityId));
			if (formation) {
				const entity = getKV(formation.positions, entityId);
				if (entity) {
					return entity;
				}
			}
		}

		if (!placement) {
			const formation = formations
				.slice(index + 1)
				.find((f) => hasKV(f.positions, entityId));
			if (formation) {
				const entity = getKV(formation.positions, entityId);
				if (entity) {
					return entity;
				}
			}
		}

		return { position: [0, 0] };
	};

const entityPlacementAtTime =
	(project: PerformanceProject, time: number) =>
	(entityId: string): EntityPlacement => {
		const { formations } = project;
		let timeAndFormation = {
			elapsedTime: 0,
			transition: 0,
			index: formations.length - 1,
		};

		for (const [index, formation] of formations.entries()) {
			timeAndFormation = {
				index,
				elapsedTime: timeAndFormation.elapsedTime + formation.duration,
				transition: formation.transitionDuration,
			};

			if (timeAndFormation.elapsedTime + formation.transitionDuration < time) {
				timeAndFormation.elapsedTime += formation.transitionDuration;
			} else {
				break;
			}
		}

		// No formations exist
		if (timeAndFormation.index < 0) {
			return { position: [0, 0] };
		}

		const placement = entityPlacement(
			project,
			timeAndFormation.index
		)(entityId);

		if (time > timeAndFormation.elapsedTime) {
			const nextPlacement = entityPlacement(
				project,
				timeAndFormation.index + 1
			)(entityId);
			const transition = time - timeAndFormation.elapsedTime;
			const transitionProgress = transition / timeAndFormation.transition;

			return {
				position: [
					placement.position[0] +
						(nextPlacement.position[0] - placement.position[0]) *
							transitionProgress,
					placement.position[1] +
						(nextPlacement.position[1] - placement.position[1]) *
							transitionProgress,
				],
			};
		}

		return placement;
	};

const getFormation = (
	{ formations, entities, ...project }: PerformanceProject,
	index: number
) => {
	const getEntityPlacement = entityPlacement(
		{ formations, entities, ...project },
		index
	);

	return {
		get exists(): boolean {
			return 0 <= index && index < formations.length;
		},

		entity: (id: string) => ({
			get placement(): EntityPlacement {
				return getEntityPlacement(id);
			},

			setPlacement: (placement: EntityPlacement): PerformanceProject => {
				return produce({ entities, formations, ...project }, (draft) => {
					if (index < 0 || index > formations.length) {
						return;
					}
					const { positions } = formations[index];
					draft.formations[index].positions = [
						...setKV(positions, id, placement),
					];
				});
			},

			setAttributes: (attributes: Partial<Entity>): PerformanceProject => {
				return produce({ entities, formations, ...project }, (draft) => {
					draft.entities = setKV(entities, id, {
						...(getKV(entities, id) || { color: "black", name: "" }),
						...attributes,
					});
				});
			},
		}),

		get placements(): Iterable<[string, EntityPlacement]> {
			return map(entities, ([id]) => [id, getEntityPlacement(id)]);
		},

		getPlacementAtTime(time: number): Iterable<[string, EntityPlacement]> {
			const getEntityPlacementAtTime = entityPlacementAtTime(
				{ formations, entities, ...project },
				time
			);
			return map(entities, ([id]) => [id, getEntityPlacementAtTime(id)]);
		},

		setPlacements(
			placements: Iterable<[string, EntityPlacement]>
		): PerformanceProject {
			return produce({ entities, formations, ...project }, (draft) => {
				if (index < 0 || index >= formations.length) return;
				draft.formations[index].positions = unionKV(
					formations[index].positions,
					placements
				);
			});
		},

		setPositions(positions: Iterable<[string, Vector2]>): PerformanceProject {
			return produce({ entities, formations, ...project }, (draft) => {
				if (index < 0 || index >= formations.length) return;
				draft.formations[index].positions = unionKV(
					map(entities, ([id]) => [id, getEntityPlacement(id)]),
					map(positions, ([id, position]) => [id, { position }])
				);
			});
		},
	};
};

const getFormationIndexById = (
	{ formations }: PerformanceProject,
	id: string
): number | null => {
	const result = formations.findIndex((f) => f.id === id);
	if (result < 0) {
		return null;
	}
	return result;
};

// TODO: unit test this
export const performance = ({
	entities,
	formations,
	...project
}: PerformanceProject) => ({
	get music() {
		return project.music;
	},

	get entities() {
		return entities;
	},

	addEntity: (id: string, entity: Entity): PerformanceProject => {
		return produce({ entities, formations, ...project }, (draft) => {
			draft.entities = [...entities, [id, entity]];
		});
	},

	pushFormation: (
		name: string,
		duration: number,
		transitionDuration: number
	): PerformanceProject => {
		return produce({ entities, formations, ...project }, (draft) => {
			const ids = new Set(formations.map(({ id }) => id));
			let idNumber = formations.length;
			while (ids.has(idNumber.toString())) {
				idNumber++;
			}
			draft.formations.push({
				id: idNumber.toString(),
				name,
				positions: [],

				// TODO: there needs to be a way to ensure that duration is set to these
				//   these minimum defaults
				duration: duration < 0 ? 0 : duration,

				// Certain velocities are physically impossible, but at the same time,
				// the customer is always right 🤷‍♂️
				transitionDuration: transitionDuration < 10 ? 10 : transitionDuration,
			});
		});
	},

	updateFormationTimes: (
		formationTimes: Iterable<FormationTime>
	): PerformanceProject => {
		const formationsMap = new Map<string, FormationTime>(
			[...formationTimes].map((f) => [f.id, f])
		);
		return produce({ entities, formations, ...project }, (draft) => {
			for (const [
				index,
				{ id, duration, transitionDuration },
			] of formations.entries()) {
				draft.formations[index] = {
					...draft.formations[index],
					...(formationsMap.get(id) ?? { duration, transitionDuration }),
				};
			}
		});
	},

	get formationsCount(): number {
		return formations.length;
	},

	get formations(): readonly Formation[] {
		return formations;
	},

	get totalTime(): number {
		return formations.reduce(
			(acc, { duration, transitionDuration }, i) =>
				acc + duration + (i < formations.length - 1 ? transitionDuration : 0),
			0
		);
	},

	getFormationAtTime: (time: number): [number, Formation] | null => {
		let elapsedTime = 0;

		for (const [index, formation] of formations.entries()) {
			const totalFormationDuration =
				formation.duration + formation.transitionDuration;
			if (elapsedTime < time && time < elapsedTime + totalFormationDuration) {
				return [index, formation];
			}
			elapsedTime += totalFormationDuration;
		}

		return null;
	},

	getStartTimeAtFormationIndex: (index: number) => {
		let elapsedTime = 0;
		for (const [i] of formations.entries()) {
			if (i === index) {
				return elapsedTime;
			}
			elapsedTime += formations[i].duration + formations[i].transitionDuration;
		}
	},

	getEndTimeAtFormationIndex: (index: number) => {
		let elapsedTime = 0;
		for (const [i] of formations.entries()) {
			if (i === index) {
				return elapsedTime + formations[i].duration;
			}
			elapsedTime += formations[i].duration + formations[i].transitionDuration;
		}
	},

	getFormationIndexById: (id: string) =>
		getFormationIndexById({ entities, formations, ...project }, id),

	getFormationById: (id: string): ReturnType<typeof getFormation> =>
		getFormation(
			{ entities, formations, ...project },
			getFormationIndexById({ entities, formations, ...project }, id) || -1
		),

	getFormationIndex: (index: number) =>
		getFormation({ entities, formations, ...project }, index),
});

export type Performance = ReturnType<typeof performance>;
export type FormationHelpers = ReturnType<Performance["getFormationIndex"]>;

export const joinPlacements = (
	source: Iterable<[string, EntityPlacement]>,
	destination: Iterable<[string, EntityPlacement]>
) => {
	const result = new Map<
		string,
		{ from: EntityPlacement; to: EntityPlacement }
	>();

	const destinationMap = new Map(destination);

	for (const [id, placement] of source) {
		const to = destinationMap.get(id);
		if (!to) {
			continue;
		}
		result.set(id, {
			from: placement,
			to,
		});
	}

	return result;
};
