## Comments

- Start with `//`
- Must end with `;`

```js
// This is a comment;

COMMENT This is also a comment!;
```

## Variables
- Prefix (Either can be used) `SET` or `LET`
- Assignment Operator (Either can be used) `TO` or `=`
>
- All of these have the same result
- Must end with `;`

```js
SET cat TO 'meow meow';

LET cat = 'meow meow';

SET cat = 'meow meow';

LET cat TO 'meow meow'; // Idk why you'd want this one
```

## Printing To The Console
- Insert any values after `PRINT`
- Each other value should be seperated by a `&` or `AND`
- Must end with `;`

```js
// One Item
PRINT "hello!"; // => "hello!";

// Multiple Items
PRINT "hello" & "world"; // => "hello world";
```

## EQUALS
- Checks if two values are equal

```js
1 EQUALS 1; // => true
1 EQUALS 2; // => false
```

## If Statements
- Start with `IF`, then the condition in parenthesis
- After that Ora Code can be placed inside the brackets

```js
IF (1 EQUALS 1){
		// Your code here
}
```

## Functions
- Start with `FUNCTION`, requires a variable name to apply it to immediately after (for now), then the parameters in parenthesis.

- After that Ora Code can be placed inside the brackets

```js
FUNCTION <varname> (<parameters>){
    // Your code here
}

// Example
FUNCTION add (a, b){
		RETURN a + b;
}
```

## RETURN
- Returns a value from a function

## Calling Functions
- Start with the function name then parameters in parenthesis
- After that Ora Code can be placed inside the brackets

```js
<functionname> (<parameters>);

// Example
add (1, 2);
```

<!-- ## Loops
- Start with `LOOP`, then the condition in parenthesis
- After that Ora Code can be placed inside the brackets

```js
LOOP (1 EQUALS 1){
		// Your code here
}
```
 -->


## Operators
- `+` - Addition
- `-` - Subtraction
- `*` - Multiplication
- `/` - Division

## Types
- `OBJECT` - An empty object
- `ARRAY` - An empty array

## Arrays
- Can be created with `ARRAY` or `[]`

```js
[
		"item1",
		"item2"
]
```

## Objects / JSON
- Can be created with `OBJECT` or `{}`

```js
{
		key: "value",
		key2: "value2"
}
```
You can also include variables

```js
SET cat TO 'meow meow';

{
		key: "value",
		key2: "value2",
		cat
} //=>

{
		key: "value",
		key2: "value2",
		cat: "meow meow"
}
```

## Importing
- Start with `IMPORT`, then variable name, then `FROM`, then the path to the file
- Must end with `;`
- Supports `.ora`, `.js`, and `npm` files
- NPM modules must have their packagename followed by `.npm`
- does NOT support spread syntax

```js
IMPORT <varname> FROM <path>;

// Example Import (Ora Language)
IMPORT add FROM "./add.ora";

// Example Import (JavaScript)
IMPORT add FROM "./add.js";

// Example Import (NPM)
IMPORT express FROM "express.npm";
```

## Exporting
- Start with `EXPORT`, then the resulting value
- Must end with `;`

```js
EXPORT <value>;

/// Examples
// String Export
EXPORT "hello world"; 

// Function Export
FUNCTION add (a, b){
		RETURN a + b;
}

EXPORT add;
```