// SubFn is called on entry update notification
export type SubFn<T> = (key: string, val: T | null) => boolean;

// NewSubMap will return a new subscription map
export function NewSubMap<T>(): SubMap<T> {
	const m = <SubMap<T>>{};
	return m;
}

// SubMap is a QoL type for a common used object type
export type SubMap<T> = { [key: string]: SubFn<T> };

// Indexer manages an index state
export class Indexer {
	// Prefix value to prepend to generated indexes
	private prefix: string;
	// Current index value
	private idx: number;

	constructor(prefix: string) {
		// Set prefix value as provided prefix
		this.prefix = prefix;
		// Set current index value to 0
		this.idx = 0;
	}

	// Get will get the current index value (and increment for the next use).
	Get(): string {
		// Get current index as a string
		const idx = this.idx.toString();
		// Increment index
		this.idx++;
		// Return prefix concatinated with string index
		return this.prefix + idx;
	}
}

// Subber manages subscribing functions
export class Subber<T> {
	// Subscriber map
	private m: SubMap<T>;
	// Index manager
	private i: Indexer;
	// Closed state
	private closed: boolean;

	constructor(key: string) {
		this.m = NewSubMap<T>();
		this.i = new Indexer(key + "_");
		this.closed = false;
	}

	// Signal will notify all of the subscribers of the provided key/value pair
	Signal(key: string, value: T | null) {
		if (this.closed) {
			return;
		}

		// Iterate through each subscriber
		this.ForEach((skey: string, sfn: SubFn<T>) => {
			if (sfn(key, value) === true) {
				// Subscribing function returned true, unsubscribe
				this.Unsub(skey);
			};
		});
	}

	// Sub will add the provided function to the subscribers list
	Sub(fn: SubFn<T>, subKey?: string): string {
		if (this.closed) {
			return "";
		}

		if (!subKey) {
			// Get subKey from current index
			subKey = this.i.Get();
		}

		// Set function for newly created subKey
		this.m[subKey] = fn;
		// Return subKey

		return subKey;
	}

	// Unsub will remove the matching value to the provided key from the subscribers list
	Unsub(key: string): boolean {
		if (this.closed) {
			return false;
		}

		return delete this.m[key];
	}

	ForEach(fn: (sKey: string, sfn: SubFn<T>) => void) {
		// Iterate through each key of the map
		Object.keys(this.m).forEach((subKey: string) => {
			// Get subscription function
			const sfn = this.m[subKey];
			if (!sfn) {
				// This should NEVER happen
				console.error("Subscription function does not exist", subKey, this.m);
				return;
			}

			// Pass the subkey and subscription function to the provided function
			fn(subKey, sfn);
		});
	}

	Close() {
		if (this.closed) {
			return;
		}

		this.closed = true;
		// Replace map with a fresh map to wipe all the subscribers
		// TODO: Investigate if this will leak, if so - manually de-reference to help the GC
		this.m = NewSubMap();
	}
}
