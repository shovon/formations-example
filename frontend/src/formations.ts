import { Vector2 } from "./vector2";

export type EntityPlacement = { position: Vector2 };

export class Formations {
	constructor(private ids: Iterable<string>) {}

	*formationPlacements(index: number): Iterable<[string, EntityPlacement]> {
		// TODO: implement
	}

	// TODO: todo have a function for setting the position for a specific
	//   formation
}
