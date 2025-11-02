# Vue Material Design Icon Components

A collection of Material Design Icons for Vue 3, exported as components with TypeScript support. Sourced from the
[MaterialDesign project](https://github.com/Templarian/MaterialDesign 'MaterialDesign Github page').

## Features

- 🎯 **Vue 3 Composition API** - Built for modern Vue 3 applications
- 📦 **Tree-shakable** - Only import the icons you need
- 🎨 **TypeScript Support** - Full type definitions included
- ⚡ **Lightweight** - Minimal runtime overhead
- ♿ **Accessible** - ARIA attributes included
- 🔧 **Reactive** - All props are reactive and work with Vue's reactivity system

## Installation

```bash
npm install vue-material-design-icons
```

**or**

```bash
yarn add vue-material-design-icons
```

**or**

```bash
pnpm add vue-material-design-icons
```

## Usage

### Basic Usage (Recommended)

Import icons directly from the package using named exports:

```vue
<script setup lang="ts">
import { Menu, Android, Home } from 'vue-material-design-icons';
</script>

<template>
  <Menu />
  <Android :size="32" />
  <Home fillColor="#ff0000" title="Home" />
</template>
```

### With Options API

```vue
<script lang="ts">
import { defineComponent } from 'vue';
import { Menu, Android } from 'vue-material-design-icons';

export default defineComponent({
  components: {
    Menu,
    Android,
  },
});
</script>

<template>
  <Menu />
  <Android :size="48" />
</template>
```

### Global Registration

```typescript
import { createApp } from 'vue';
import { Menu, Android, Home } from 'vue-material-design-icons';
import App from './App.vue';

const app = createApp(App);

app.component('MenuIcon', Menu);
app.component('AndroidIcon', Android);
app.component('HomeIcon', Home);

app.mount('#app');
```

### Optional Stylesheet

Add the included CSS to make icons scale with surrounding text:

```typescript
import 'vue-material-design-icons/styles.css';
```

> **Note:** If you intend to handle sizing with the `size` prop, you may not want to use this as it may conflict.

## Props

All icons accept the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Accessible title for screen readers. If provided, sets `aria-label`. If not provided, icon is hidden from screen readers with `aria-hidden="true"`. |
| `fillColor` | `string` | `'currentColor'` | Fill color of the icon. Accepts any valid CSS color value. |
| `size` | `number \| string` | `24` | Size of the icon (width and height in pixels). |

### Examples

```vue
<template>
  <!-- Basic usage -->
  <Menu />

  <!-- With title for accessibility -->
  <Android title="Android operating system" />

  <!-- Custom size -->
  <Home :size="32" />

  <!-- Custom color -->
  <Heart fillColor="#ff0000" />

  <!-- Combine multiple props -->
  <Star
    title="Favorite"
    fillColor="gold"
    :size="48"
  />

  <!-- Click event -->
  <Close @click="handleClose" />
</template>
```

### Additional Attributes

All icons support `v-bind="$attrs"`, which means you can pass any HTML attributes:

```vue
<Menu
  class="my-custom-class"
  style="margin: 10px"
  data-testid="menu-icon"
/>
```

## Icons

A list of all available icons can be found at the
[Material Design Icons website](https://materialdesignicons.com/ 'Material Design Icons website').

The icons are exported with **PascalCase** names. For example:
- `account` → `Account`
- `arrow-left` → `ArrowLeft`
- `checkbox-marked-circle` → `CheckboxMarkedCircle`
- `ultra-high-definition` → `UltraHighDefinition`

Import them like this:

```typescript
import { Account, ArrowLeft, CheckboxMarkedCircle } from 'vue-material-design-icons';
```

## TypeScript Support

This library is written in TypeScript and includes full type definitions. You'll get autocomplete and type checking out of the box:

```typescript
import type { IconProps } from 'vue-material-design-icons';
import { Menu } from 'vue-material-design-icons';

const iconProps: IconProps = {
  title: 'Menu',
  fillColor: 'blue',
  size: 32,
};
```

## Custom Styling

If you want custom sizing with CSS classes, you can add your own styles:

```css
.material-design-icon.icon-2x {
  height: 2em;
  width: 2em;
}

.material-design-icon.icon-2x > .material-design-icon__svg {
  height: 2em;
  width: 2em;
}
```

Then use it in your component:

```vue
<template>
  <Menu class="icon-2x" />
</template>
```

Alternatively, use the `size` prop for dynamic sizing:

```vue
<template>
  <Menu :size="48" />
</template>
```