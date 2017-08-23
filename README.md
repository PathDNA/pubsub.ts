# Pubsub ![Status](https://img.shields.io/badge/status-beta-yellow.svg)
Pubsub is a typescript pubsub data-store library which is focused on simplicity and ease-of-use.

## Usage
### Typescript
```js
// Set dependency within package.json
{
	"dependencies" : {
	    "pubsub": "github:Path94/pubsub.ts"
	}
}
```

```typescript
import * as pubsub from "node_modules/pubsub/pubsub"

function main() {
	// Create new instance of pubsub
	const ps = pubsub.New<string>();

	// Subscribe to "greeting"
	ps.Sub("greeting", (key: string, value: string): boolean => {
		console.log("Subscription update!", key, value);
		return false;
	})

	// Put value for "greeting" and "hello world"
	ps.Put("greeting", "hello world");

	// Get a value without subscribing
	const val = ps.Get("greeting");
	console.log("Value!", val);
}

```

### Javascript
```js
// Example utilizing require.js
require(["pubsub"], function (pubsub) {
	// Create new instance of pubsub
	let ps = pubsub.New();

	// Subscribe to "greeting"
	ps.Sub("greeting", function(key, value){
		console.log("Subscription update!", key, value);
	})

	// Put value for "greeting" and "hello world"
	ps.Put("greeting", "hello world");

	// Get a value without subscribing
	let val = ps.Get("greeting");
});

```

## Interface
This library supports the following features:

- **Get**: Return value for given key
- **Put**: Set value for a given key
- **Delete**: Remove entry for given key (value and subscribers)
- **Sub**: Subscribe to value updates for a given key
- **Unsub**: Unsubscribe from value updates