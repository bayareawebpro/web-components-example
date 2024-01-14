# Web Components Example

> Demo: https://bayareawebpro.github.io/web-components-example/

## Constraints 

- No Build Tools.
- No Dependencies.
- Native JS Modules.

## Features

- Reactive State.
- Directive Compiler.
- Expression Bindings.


### Text Binding

```html
<div data-bind:text="state.items.length"></div> 
```

### Attribute Binding

```html
<button
    type="button"
    data-bind:disabled="!state.enabled">
    Add Item
</button>
```

### Event Binding

```html
<button
    type="button"
    onclick="addItem()">
    Add Item
</button>
```

### Model Binding

```html
<input 
    type="text" 
    data-model="state.value"
/>
```

### State Binding

```html
<my-component 
    data-state:item="item">
</my-component>
```

### Condition Binding

```html
<template data-if="state.enabled">
    I'm enabled.
</template>
<template data-else>
    I'm disabled.
</template>
```

### Loop Binding

```html
<template data-for="item of state.items">
    <my-component
        data-bind:key="item.id"
        data-state:item="item">
    </my-component>
</template>
```