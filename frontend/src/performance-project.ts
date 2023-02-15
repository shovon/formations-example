import { useReducer } from "react";
import { Entity } from "./Editor";
import { EntityPlacement, Formation, FormationsList } from "./formations";
import { getKV, hasKV, map, setKV } from "./iterable-helpers";
import { ReadOnlyMap } from "./readonly-map-set";
import { Vector2 } from "./vector2";

// TODO: move to immer, and store edit history

export interface ReadOnlyPerformanceProject {
	readonly entities: ReadOnlyMap<string, Entity>;
	getEntityPlacementAtFormation(
		formationIndex: number,
		entityId: string
	): EntityPlacement;
	getFormationPlacements(
		formationIndex: number
	): Iterable<[string, EntityPlacement]>;
	readonly formations: readonly Formation[];
}

export class PerformanceProject implements ReadOnlyPerformanceProject {
	private _entities: Map<string, Entity>;

	constructor(
		entities: Iterable<[string, Entity]> = [],
		private _formations: FormationsList = []
	) {
		this._entities = new Map(entities);
	}

	get entities(): ReadOnlyMap<string, Entity> {
		return this._entities;
	}

	getEntityPlacementAtFormation(
		formationIndex: number,
		entityId: string
	): EntityPlacement {
		if (formationIndex < 0 || formationIndex > this._formations.length) {
			return { position: [0, 0] };
		}

		const formation = this._formations[formationIndex];
		const placement = getKV(formation.positions, entityId);

		if (placement) {
			return placement;
		}

		if (!placement) {
			const formation = this._formations
				.slice(0, formationIndex)
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
			const formation = this._formations
				.slice(formationIndex + 1)
				.find((f) => hasKV(f.positions, entityId));
			if (formation) {
				const entity = getKV(formation.positions, entityId);
				if (entity) {
					return entity;
				}
			}
		}

		return { position: [0, 0] };
	}

	getFormationPlacements(
		formationIndex: number
	): Iterable<[string, EntityPlacement]> {
		return map(this._entities, ([id]) => [
			id,
			this.getEntityPlacementAtFormation(formationIndex, id),
		]);
	}

	setEntity(id: string, name: string, color: string) {
		this._entities.set(id, { name, color });
	}

	setEntityPlacement(
		formationIndex: number,
		entityId: string,
		placement: EntityPlacement
	) {
		if (formationIndex < 0 || formationIndex > this._formations.length) {
			return;
		}
		const { positions } = this._formations[formationIndex];
		console.log(formationIndex, positions, [
			...setKV(positions, entityId, placement),
		]);
		this._formations[formationIndex].positions = setKV(
			positions,
			entityId,
			placement
		);
	}

	pushFormation(name: string) {
		this._formations.push({ name, positions: [] });
	}

	get formations(): readonly Formation[] {
		return this._formations;
	}
}

// Yeah, this is beginning to look ugly
export const usePerformance = (project: PerformanceProject) => {
	const [, update] = useReducer(() => ({}), {});

	return {
		entities: project.entities,
		setEntity: (id: string, name: string, color: string) => {
			project.setEntity(id, name, color);
			update();
		},
		setEntityPlacement: (
			formationIndex: number,
			entityId: string,
			placement: EntityPlacement
		) => {
			project.setEntityPlacement(formationIndex, entityId, placement);
			update();
		},
		pushFormation: (name: string) => {
			project.pushFormation(name);
			update();
		},
		getEntityPlacementAtFormation:
			project.getEntityPlacementAtFormation.bind(project),
		getFormationPlacements: project.getFormationPlacements.bind(project),
		formations: project.formations,
	};
};
