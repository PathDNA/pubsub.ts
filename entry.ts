import * as common from "common";

export class Entry<T> {
	private key: string;
	private val: T | null;
	private sub: common.Subber<T>;
	private closed: boolean;

	constructor(key: string) {
		this.key = key;
		this.val = null;
		this.sub = new common.Subber(key);
		this.closed = false;
	}

	private put(val: T | null) {
		this.val = val;
		this.sub.Signal(this.key, this.val);
	}

	Get(): T | null {
		return this.val;
	}

	Put(val: T) {
		if (this.closed) {
			return;
		}

		this.put(val);
	}

	Sub(fn: common.SubFn<T>, subKey?: string): string {
		return this.sub.Sub(fn, subKey);
	}

	Unsub(key: string): boolean {
		return this.sub.Unsub(key);
	}

	Close() {
		if (this.closed) {
			return;
		}

		// Set closed state to true
		this.closed = true;
		// Put null value
		this.put(null);
		// Close subber
		this.sub.Close();
	}
}
