# Pubsub
Pubsub is a typescript pubsub data-store library which is focused on simplicity and ease-of-use.

## Usage
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