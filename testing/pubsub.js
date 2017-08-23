define("common", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // NewSubMap will return a new subscription map
    function NewSubMap() {
        const m = {};
        return m;
    }
    exports.NewSubMap = NewSubMap;
    // Indexer manages an index state
    class Indexer {
        constructor(prefix) {
            // Set prefix value as provided prefix
            this.prefix = prefix;
            // Set current index value to 0
            this.idx = 0;
        }
        // Get will get the current index value (and increment for the next use).
        Get() {
            // Get current index as a string
            const idx = this.idx.toString();
            // Increment index
            this.idx++;
            // Return prefix concatinated with string index
            return this.prefix + idx;
        }
    }
    exports.Indexer = Indexer;
    // Subber manages subscribing functions
    class Subber {
        constructor(key) {
            this.m = NewSubMap();
            this.i = new Indexer(key + "_");
            this.closed = false;
        }
        // Signal will notify all of the subscribers of the provided key/value pair
        Signal(key, value) {
            if (this.closed) {
                return;
            }
            // Iterate through each subscriber
            this.ForEach((skey, sfn) => {
                if (sfn(key, value) === true) {
                    // Subscribing function returned true, unsubscribe
                    this.Unsub(skey);
                }
                ;
            });
        }
        // Sub will add the provided function to the subscribers list
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
        // Unsub will remove the matching value to the provided key from the subscribers list
        Unsub(key) {
            if (this.closed) {
                return false;
            }
            return delete this.m[key];
        }
        ForEach(fn) {
            // Iterate through each key of the map
            Object.keys(this.m).forEach((subKey) => {
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
    exports.Subber = Subber;
});
define("entry", ["require", "exports", "common"], function (require, exports, common) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // Entry manages a key/value pair and it's subscribers
    class Entry {
        constructor(key) {
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
        put(val) {
            // Set value
            this.val = val;
            // Call signal for new value
            this.s.Signal(this.key, this.val);
        }
        // Get will return the Entry value
        Get() {
            return this.val;
        }
        // Put will set the Entry value
        Put(val) {
            if (this.closed) {
                return;
            }
            this.put(val);
        }
        // Sub will subscribe a provided function for an Entry
        Sub(fn, subKey) {
            return this.s.Sub(fn, subKey);
        }
        // Unsub will unsubscribe a provided key for an Entry
        Unsub(key) {
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
            // Create a fresh entry map
            this.m = newEntryMap();
            // Set internal subber with a prefix of "global"
            this.s = new common.Subber("global");
        }
        createEntry(key) {
            let e = this.m[key];
            if (!!e) {
                // Entry exists - no need to create, return early
                return e;
            }
            // Create a new entry and set it within the map AND as our local e variable
            e = this.m[key] = new entry.Entry(key);
            this.s.ForEach((sKey, fn) => e.Sub(fn, sKey));
            // Return reference to entry
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
    // newEntryMap returns a new entry map
    function newEntryMap() {
        const m = {};
        return m;
    }
});
