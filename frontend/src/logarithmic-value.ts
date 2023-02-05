export class LogarithmicValue {
	private constructor(private readonly _logarithmic: number) {}

	get logarithmic() {
		return this._logarithmic;
	}

	get linear() {
		return Math.E ** this._logarithmic;
	}

	addLogarithmic(value: number): LogarithmicValue {
		return LogarithmicValue.logarithmic(this.logarithmic + value);
	}

	static logarithmic(value: number): LogarithmicValue {
		return new LogarithmicValue(value);
	}

	static linear(value: number) {
		return new LogarithmicValue(Math.log(value));
	}
}
