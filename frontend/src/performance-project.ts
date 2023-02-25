import { getKV, hasKV, map, setKV, unionKV } from "./iterable-helpers";
import produce from "immer";
import { Vector2 } from "./vector2";

// TODO: move to immer, and store edit history

export type Entity = {
	color: string;
	name: string;
};

export type EntityPlacement = { position: Vector2 };

export type Formation = {
	id: string;
	name: string;
	positions: Iterable<[string, EntityPlacement]>;
	duration: number;
	transitionDuration: number;
};

export type PerformanceProject = {
	entities: Iterable<[string, Entity]>;
	formations: Formation[];
};

// TODO: unit test this
export const performance = ({ entities, formations }: PerformanceProject) => ({
	get entities() {
		return entities;
	},

	addEntity: (id: string, entity: Entity): PerformanceProject => {
		return produce({ entities, formations }, (draft) => {
			draft.entities = [...entities, [id, entity]];
		});
	},

	pushFormation: (
		name: string,
		duration: number,
		transitionDuration: number
	) => {
		return produce({ entities, formations }, (draft) => {
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

	get formationsCount(): number {
		return formations.length;
	},

	// TODO: refactor `getFormation` to `formations.at()`
	//
	// Perhaps something like this:
	//
	// get formations() {
	//   return {
	//     get count(): number {
	//       return formations.length;
	//     }
	//   }
	// }

	get formations(): readonly Formation[] {
		return formations;
	},

	getFormationAtTime: (time: number) => {
		let elapsedTime = 0;
		for (const formation of formations) {
			const totalDuration = formation.duration + formation.transitionDuration;
			if (elapsedTime < time && elapsedTime + totalDuration > time) {
				return formation;
			}
			elapsedTime += totalDuration;
		}

		return null;
	},

	getTimeAtFormationIndex: (index: number) => {
		let elapsedTime = 0;
		for (const [i] of formations.entries()) {
			if (i === index) {
				return elapsedTime;
			}
			elapsedTime += formations[i].duration + formations[i].transitionDuration;
		}
	},

	getFormation: (index: number) => {
		const entityPlacement = (entityId: string): EntityPlacement => {
			if (index < 0 || index > formations.length) {
				return { position: [0, 0] };
			}

			const formation = formations[index];
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

		return {
			get exists(): boolean {
				return 0 <= index && index < formations.length;
			},

			entity: (id: string) => ({
				get placement(): EntityPlacement {
					return entityPlacement(id);
				},

				setPlacement: (placement: EntityPlacement): PerformanceProject => {
					return produce({ entities, formations }, (draft) => {
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
					return produce({ entities, formations }, (draft) => {
						draft.entities = setKV(entities, id, {
							...(getKV(entities, id) || { color: "black", name: "" }),
							...attributes,
						});
					});
				},
			}),

			get placements(): Iterable<[string, EntityPlacement]> {
				return map(entities, ([id]) => [id, entityPlacement(id)]);
			},

			setPlacements(
				placements: Iterable<[string, EntityPlacement]>
			): PerformanceProject {
				return produce({ entities, formations }, (draft) => {
					draft.formations[index].positions = unionKV(
						formations[index].positions,
						placements
					);
				});
			},

			setPositions(positions: Iterable<[string, Vector2]>): PerformanceProject {
				return produce({ entities, formations }, (draft) => {
					draft.formations[index].positions = unionKV(
						map(entities, ([id]) => [id, entityPlacement(id)]),
						map(positions, ([id, position]) => [id, { position }])
					);
				});
			},
		};
	},
});

export type Performance = ReturnType<typeof performance>;
export type FormationHelpers = ReturnType<Performance["getFormation"]>;

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
