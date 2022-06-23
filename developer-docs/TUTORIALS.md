# Tutorials

The tutorials section of the documentation is meant to give the reader a complete step-by-step walk through of common use cases.

## Snippets

Every tutorial contains various snippets with a corresponding explanation of the code. It's required that at the bottom of every tutorial page, a 'full snippet' is displayed, one that contains combines all the snippets in the tutorial into one. The purpose of this is that the reader can easily copy the code into their own project and start experimenting with it themselves. To avoid that the code snippets contain mistakes or become outdated, we have a custom way of handling tutorial snippets. Instead of placing the snippets directly into the markdown files, snippets are placed in a `.ts` file inside the `/snippets` directory and imported from the markdown files. This way, snippets can be written in a way that makes them runnable before releasing the documentation, thus making them somewhat testable. To support this functionality, we have customized how Docusaurus handles snippets a bit. In this section we will go over how snippets to create snippets, divide them into sections and import them into the markdown.

### Snippet structure

#### `run()` method

The snippets should be divided into functions that make logical sense. At the bottom of the snippet, there should be a `run()` method that calls these individual functions in the correct order. Please make sure to call this `run()` function in the last line of the snippet. This makes sure we run the file before releasing a new version of the documentation.

**Example**

```ts
const someFunction = async () => {
  // do stuff
}

const someOtherFunction = async () => {
  // do stuff
}

const run = async () => {
  await someFunction()
  await someotherfunction()
}

run()
```

#### Dividing the snippet into sections

You can separate your snippet into sections by marking the start and end of a section using the `// start-section-n` and `end-section-n` syntax.

**Example**

```ts
// start-section-1
const someFunction = async () => {
  // do stuff
}
// end-section-1

// start-section-1
const someOtherFunction = async () => {
  // do stuff
}
// end-section-1

const run = async () => {
  await someFunction()
  await someotherfunction()
}

run()
```

#### Importing snippets

You can import a particular section into the the markdown documentation by passing some metadata to the code block.

**Structure**

````
```ts <file_name> <section_name>
```
````

**Example**
Let's say we have the previous example snippet saved in a file called `/snippets/example.ts`. If you want to import the first section, you can do this as follows:

````
```ts example.ts section-1
```
````

This will result in the following output:

```ts
const someFunction = async () => {
  // do stuff
}
```

#### Full snippet

If you want to render the full snippet rather than a specific section, you can just omit the section name in the snippet metadata. This will strip all the section comments from the snippet and render the output.

> **NOTE:** Only the code **inside** the sections will be included in the output. Any code falls out of any section will be ignored.

**Example**

Say we have this snippet:

```ts
// start-section-1
const someFunction = async () => {
  // do stuff
}
// end-section-1

const notPartOfAnySection = async () => {
  // so stuff
}

// start-section-1
const someOtherFunction = async () => {
  // do stuff
}
// end-section-1

const run = async () => {
  await someFunction()
  await someotherfunction()
}

run()
```

You can render the full snippet by adding the following:

````
```ts example.ts
```
````

This will result in the following rendering (notice the function declaration for `notpartofanysection()` is missing):

```ts
const someFunction = async () => {
  // do stuff
}

const someOtherFunction = async () => {
  // do stuff
}

const run = async () => {
  await someFunction()
  await someotherfunction()
}

run()
```

#### Snippet fallback

You can also populate the snippet import with some content. This will only be rendered in case the provided snippet cannot be found.

**Example**

````
```ts fileDoesNotExist.ts
// Oops, something went wrong
```
````

This will simply render the following:

```ts
// Oops, something went wrong
```
