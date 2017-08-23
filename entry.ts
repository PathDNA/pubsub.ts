import * as common from "common";

// Entry manages a key/value pair and it's subscribers
export class Entry<T> {
	// Entry key
	private key: string;
	// Entry value
	private val: T | null;
	// Entry-level subscribers
	private s: common.Subber<T>;
	// Closed state
	private closed: boolean;

	constructor(key: string) {
		// Set key
		this.key = key;
		// Set value initially to null
		this.val = null;
		// Create new instance of Subber for our given key
		this.s = new common.Subber(key);
		// Set closed state to false
		this.closed = false;
	}

	// Internal put helper func
	private put(val: T | null) {
		// Set value
		this.val = val;
		// Call signal for new value
		this.s.Signal(this.key, this.val);
	}

	// Get will return the Entry value
	Get(): T | null {
		return this.val;
	}

	// Put will set the Entry value
	Put(val: T) {
		if (this.closed) {
			return;
		}

		this.put(val);
	}

	// Sub will subscribe a provided function for an Entry
	Sub(fn: common.SubFn<T>, subKey?: string): string {
		return this.s.Sub(fn, subKey);
	}

	// Unsub will unsubscribe a provided key for an Entry
	Unsub(key: string): boolean {
		return this.s.Unsub(key);
	}

	// Close will close the Entry
	Close() {
		if (this.closed) {
			return;
		}

		// Set closed state to true
		this.closed = true;
		// Put null value
		this.put(null);
		// Close subber
		this.s.Close();
	}
}
