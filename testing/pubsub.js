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
        }
        forEach(fn) {
            Object.keys(this.m).forEach((subKey) => {
                const sfn = this.m[subKey];
                if (!sfn) {
                    return;
                }
                fn(subKey, sfn);
                return;
            });
        }
        Signal(key, value) {
            if (closed) {
                return;
            }
            this.forEach((skey, sfn) => sfn(key, value));
        }
        Sub(fn, subKey) {
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
        Unsub(key) {
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
            this.sub = new common.Subber("global");
        }
        createEntry(key) {
            const e = this.m[key];
            if (!!e) {
                return e;
            }
            return this.m[key] = new entry.Entry(key);
        }
        forEach(fn) {
            Object.keys(this.m).forEach((key) => {
                const e = this.m[key];
                fn(key, e);
            });
        }
        Get(key) {
            const entry = this.m[key];
            if (!entry) {
                return null;
            }
            return entry.Get();
        }
        Put(key, val) {
            const entry = this.createEntry(key);
            entry.Put(val);
        }
        Delete(key) {
            const entry = this.m[key];
            if (!entry) {
                return false;
            }
            entry.Close();
            return delete this.m[key];
        }
        Sub(key, fn) {
            if (key === "*") {
                const sk = this.sub.Sub(fn);
                this.forEach((key, e) => e.Sub(fn, sk));
                return sk;
            }
            const entry = this.createEntry(key);
            return entry.Sub(fn);
        }
        Unsub(key) {
            const entryKey = key.split("_")[0];
            if (entryKey === "global") {
                // Handle global
                return true;
            }
            const entry = this.m[entryKey];
            if (!entry) {
                return false;
            }
            return entry.Unsub(key);
        }
    }
    exports.PubSub = PubSub;
    function newEntryMap() {
        const m = {};
        return m;
    }
});
