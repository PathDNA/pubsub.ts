
export type SubFn<T> = (key: string, val: T | null) => boolean;

export function NewSubMap<T>(): SubMap<T> {
	const m = <SubMap<T>>{};
	return m;
}

export type SubMap<T> = { [key: string]: SubFn<T> };

export class Indexer {
	private prefix: string;
	private idx: number;

	constructor(prefix: string) {
		this.prefix = prefix;
		this.idx = 0;
	}

	Get(): string {
		const idx = this.idx.toString();
		this.idx++;
		return this.prefix + idx;
	}
}

export class Subber<T> {
	private m: SubMap<T>;
	private i: Indexer;
	private closed: boolean;

	constructor(key: string) {
		this.m = NewSubMap<T>();
		this.i = new Indexer(key + "_")
	}

	private forEach(fn: (sKey: string, sfn: SubFn<T>) => void) {
		Object.keys(this.m).forEach((subKey: string) => {
			const sfn = this.m[subKey];
			if (!sfn) {
				return;
			}

			fn(subKey, sfn);
			return;
		});
	}

	Signal(key: string, value: T | null) {
		if (closed) {
			return;
		}

		this.forEach((skey: string, sfn: SubFn<T>) => sfn(key, value));
	}

	Sub(fn: SubFn<T>, subKey?: string): string {
		if (closed) {
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

	Unsub(key: string): boolean {
		if (closed) {
			return false;
		}

		return delete this.m[key];
	}

	Close() {
		if (this.closed) {
			return;
		}

		this.m = NewSubMap();
	}
}