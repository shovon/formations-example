import { useReducer } from "react";
import { getKV, hasKV, map, setKV, unionKV } from "./iterable-helpers";
import { ReadOnlyMap } from "./readonly-map-set";
import produce from "immer";
import { Vector2 } from "./vector2";

// TODO: move to immer, and store edit history

export type Entity = {
	color: string;
	name: string;
};

export type EntityPlacement = { position: Vector2 };

export type Formation = {
	name: string;
	positions: Iterable<[string, EntityPlacement]>;
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

	pushFormation: (name: string) => {
		return produce({ entities, formations }, (draft) => {
			formations.push({ name, positions: [] });
		});
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

		// TODO: this nesting is really confusing. Unnest it all, please

		return {
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
						formations[index].positions = setKV(positions, id, placement);
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
					draft.formations[index].positions = map(
						positions,
						([id, position]) => [id, { position }]
					);
				});
			},

			get formations(): readonly Formation[] {
				return formations;
			},
		};
	},
});

export type Performance = ReturnType<typeof performance>;
