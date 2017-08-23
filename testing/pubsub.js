define("common", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function NewSubMap() {
        const m = {};
        return m;
    }
    exports.NewSubMap = NewSubMap;
    class Indexer {
        constructor(prefix) {
            this.prefix = prefix;
            this.idx = 0;
        }
        Get() {
            const idx = this.idx.toString();
            this.idx++;
            return this.prefix + idx;
        }
    }
    exports.Indexer = Indexer;
    class Subber {
        constructor(key) {
            this.m = NewSubMap();
            this.i = new Indexer(key + "_");
            this.closed = false;
        }
        Signal(key, value) {
            if (this.closed) {
                return;
            }
            this.ForEach((skey, sfn) => {
                if (sfn(key, value) !== true) {
                    return;
                }
                ;
                this.Unsub(skey);
            });
        }
        Sub(fn, subKey) {
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
        Unsub(key) {
            if (this.closed) {
                return false;
            }
            return delete this.m[key];
        }
        ForEach(fn) {
            Object.keys(this.m).forEach((subKey) => {
                const sfn = this.m[subKey];
                if (!sfn) {
                    return;
                }
                fn(subKey, sfn);
                return;
            });
        }
        Close() {
            if (this.closed) {
                return;
            }
            this.closed = true;
            this.m = NewSubMap();
        }
    }
    exports.Subber = Subber;
});
define("entry", ["require", "exports", "common"], function (require, exports, common) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Entry {
        constructor(key) {
            this.key = key;
            this.val = null;
            this.sub = new common.Subber(key);
            this.closed = false;
        }
        put(val) {
            this.val = val;
            this.sub.Signal(this.key, this.val);
        }
        Get() {
            return this.val;
        }
        Put(val) {
            if (this.closed) {
                return;
            }
            this.put(val);
        }
        Sub(fn, subKey) {
            return this.sub.Sub(fn, subKey);
        }
        Unsub(key) {
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
    exports.Entry = Entry;
});
define("pubsub", ["require", "exports", "common", "entry"], function (require, exports, common, entry) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // New returns a new instance of PubSub
    function New() {
        return new PubSub();
    }
    exports.New = New;
    // PubSub is a pubsub data store
    class PubSub {
        constructor() {
            this.m = newEntryMap();
            this.s = new common.Subber("global");
        }
        createEntry(key) {
            let e = this.m[key];
            if (!!e) {
                return e;
            }
            e = this.m[key] = new entry.Entry(key);
            this.s.ForEach((sKey, fn) => e.Sub(fn, sKey));
            return e;
        }
        forEach(fn) {
            Object.keys(this.m).forEach((key) => {
                const e = this.m[key];
                fn(key, e);
            });
        }
        sub(fn) {
            const sk = this.s.Sub(fn);
            this.forEach((key, e) => e.Sub(fn, sk));
            return sk;
        }
        unsub(key) {
            if (!this.s.Unsub(key)) {
                console.error("Could not unsub key!", key);
                // Key doesn't exist within global sub list. Because there is no need
                // to attempt to unsub at the Entry level, we can return early.
                return false;
            }
            // Unsub from each entry
            this.forEach((_, e) => e.Unsub(key));
            return true;
        }
        // Get will get a value for a provided key
        // Note: Will return null if key match is not found
        Get(key) {
            const entry = this.m[key];
            if (!entry) {
                return null;
            }
            return entry.Get();
        }
        // Put will set a key/val pair and notify all related subscribers
        Put(key, val) {
            if (key === "*") {
                console.error("invalid key", key);
                return;
            }
            const entry = this.createEntry(key);
            // Put value for entry
            entry.Put(val);
        }
        // Delete will remove an entry for a provided key
        // Note: All subscribers will be called with a null value to indicate 
        // closing of the entry.
        Delete(key) {
            const entry = this.m[key];
            if (!entry) {
                // Entry does not exist, return early
                return false;
            }
            // Close entry
            entry.Close();
            // Return the delete state of removing the provided key from the entries map
            return delete this.m[key];
        }
        // Sub will subscribe a listener for a provided key
        Sub(key, fn) {
            if (key === "*") {
                // Run global sub and return
                return this.sub(fn);
            }
            const entry = this.createEntry(key);
            // Subscribe provided function to entry
            return entry.Sub(fn);
        }
        // Unsub will unsubscribe a listener for a provided key
        Unsub(key) {
            // Entry key is the prefix of the key indicating which entry is belongs to.
            const entryKey = key.split("_")[0];
            // Wildcard ("*") values are given the prefix "global".
            if (entryKey === "global") {
                // Run global unsub and return
                return this.unsub(key);
            }
            const entry = this.m[entryKey];
            if (!entry) {
                // Entry doesn't exist, return early
                return false;
            }
            // Unsubscribe provided key from entry
            return entry.Unsub(key);
        }
    }
    exports.PubSub = PubSub;
    function newEntryMap() {
        const m = {};
        return m;
    }
});
