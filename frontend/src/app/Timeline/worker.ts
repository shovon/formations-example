type Something = {
	foo: string;
};

const something: Something = {
	foo: "bar",
};

console.log("In Web Worker", something.foo);

export {};
