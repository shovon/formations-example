import { Vector } from "./vector";
import { Vector3 } from "./vector3";

export class Vector2 implements Vector {
	constructor(public readonly x: number, public readonly y: number) {}

	add({ x, y }: this): this {
		return new Vector2(x + this.x, y + this.y) as this;
	}

	sub(p: this): this {
		return this.add(p.scalar(-1) as this);
	}

	scalar(c: number): this {
		return new Vector2(this.x * c, this.y * c) as this;
	}

	hadamard({ x, y }: this): this {
		return new Vector2(x * this.x, y * this.y) as this;
	}

	static fromVector3XY({ x, y }: Vector3): Vector2 {
		return new Vector2(x, y);
	}
}
