// TODO; perhaps move this to another file
export type TimelineState =
	| {
			mode: "CURRENT_FORMATION";
			index: number;

			/**
			 * A value between 0 and 1
			 */
			position: number;
	  }
	| {
			mode: "SEEKER";

			/**
			 * The time in milliseconds
			 */
			time: number;
	  };
