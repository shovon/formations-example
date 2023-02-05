export interface Vector {
	sub(v: this): this;
	scalar(number: number): this;
	add(g: this): this;
	hadamard(g: this): this;
}
