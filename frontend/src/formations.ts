import { Entity } from "./Editor";
import { Vector2 } from "./vector2";

export type EntityPlacement = { position: Vector2 };

export type Formation = {
	name: string;
	positions: Iterable<[string, { position: Vector2 }]>;
};

export type ReadOnlyFormation = {
	readonly name: string;
	positions: Iterable<readonly [string, { readonly position: Vector2 }]>;
};

// Meh, this is just for testing purposes
declare const foo: Formation;
const bar: ReadOnlyFormation = foo;

export type FormationsList = Formation[];

export const placementsInsideFormation = (
	entities: Iterable<[string, Entity]>,
	formations: FormationsList,
	index: number
): Iterable<[string, EntityPlacement]> => {
	if (formations.length === 0) {
		throw new Error("No formations available!");
	}

	index = Math.round(
		index < 0 ? 0 : index >= formations.length ? formations.length - 1 : index
	);

	const entityPositions = new Map<string, EntityPlacement>();

	const remainingEntities = new Map<string, Entity>(entities);

	const formationsWithMap = formations.map((f) => ({
		...f,
		positions: new Map(f.positions),
	}));

	// TODO: this looks insanely ugly

	// Get all entities, and match them with positions in the current formation
	for (const [id] of remainingEntities) {
		const position = formationsWithMap[index].positions.get(id);
		if (position) {
			entityPositions.set(id, position);
			remainingEntities.delete(id);
		}
	}

	// If there are any entities not matched in the current formation, then look
	// at previous formations
	for (const [id] of remainingEntities) {
		for (let i = index - 1; i >= 0; i--) {
			const position = formationsWithMap[i].positions.get(id);
			if (position) {
				entityPositions.set(id, position);
				remainingEntities.delete(id);
				break;
			}
		}
	}

	// If nothing found look forward.
	for (const [id] of remainingEntities) {
		for (let i = index + 1; i < formations.length; i++) {
			const position = formationsWithMap[i].positions.get(id);
			if (position) {
				entityPositions.set(id, position);
				remainingEntities.delete(id);
				break;
			}
		}
	}

	// If nothing found, set to origin
	for (const [id] of remainingEntities) {
		entityPositions.set(id, { position: [0, 0] satisfies Vector2 });
	}

	return entityPositions;
};

export const updateFormationPlacements = {};

const useFormations = (
	entities: Iterable<[string, Entity]>,
	formations: FormationsList
) => {
	return {};
};
