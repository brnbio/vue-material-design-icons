#!/usr/bin/env -S node -r ts-node/register/transpile-only

import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import pMap from "p-map";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dist = path.resolve(__dirname, "dist");

function renderJavaScriptComponent(
  title: string,
  svgBody: string,
  name: string,
) {
  const pathMatch = svgBody.match(/<path[^>]*\sd="([^"]*)"/);
  const svgPathData = pathMatch ? pathMatch[1] : svgBody;

  return `import { h, defineComponent } from 'vue';

/**
 * ${name} icon component
 * @displayName ${name}Icon
 */
export default defineComponent({
  name: '${name}Icon',
  props: {
    /**
     * Icon title for accessibility
     */
    title: {
      type: String,
      default: undefined,
    },
    /**
     * Fill color of the icon
     * @default 'currentColor'
     */
    fillColor: {
      type: String,
      default: 'currentColor',
    },
    /**
     * Size of the icon
     * @default 24
     */
    size: {
      type: [Number, String],
      default: 24,
    },
  },
  emits: ['click'],
  setup(props, { emit, attrs }) {
    const handleClick = (event) => {
      emit('click', event);
    };

    return () => h(
      'span',
      {
        ...attrs,
        'aria-hidden': props.title ? undefined : 'true',
        'aria-label': props.title,
        class: ['material-design-icon', '${title}-icon'],
        role: 'img',
        onClick: handleClick,
      },
      [
        h(
          'svg',
          {
            fill: props.fillColor,
            class: 'material-design-icon__svg',
            width: props.size,
            height: props.size,
            viewBox: '0 0 24 24',
          },
          [
            h(
              'path',
              { d: '${svgPathData}' },
              props.title ? [h('title', props.title)] : []
            ),
          ]
        ),
      ]
    );
  },
});

export const IconProps = {
  title: String,
  fillColor: String,
  size: [Number, String],
};
`;
}

function getTemplateData(id: string, iconData: { body: string }) {
  let name = id
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  if (/^\d/.test(name)) {
    name = "Icon" + name;
  }

  const title = id;

  return {
    name,
    title,
    svgBody: iconData.body,
  };
}

async function build() {
  console.log("🔨 Building Material Symbols for Vue 3...");

  const iconsJsonPath = path.resolve(
    __dirname,
    "node_modules/@iconify-json/material-symbols/icons.json",
  );
  const iconsJsonContent = await readFile(iconsJsonPath, "utf-8");
  const iconsData = JSON.parse(iconsJsonContent);

  const iconIDs = Object.keys(iconsData.icons);
  console.log(`📦 Processing ${iconIDs.length} icons from Material Symbols...`);

  if (!existsSync(dist)) {
    await mkdir(dist);
  }

  const pkgJsonContent = await readFile(
    path.resolve(__dirname, "package.json"),
    "utf-8",
  );
  const pkgJson = JSON.parse(pkgJsonContent);

  const materialSymbolsPkgJsonContent = await readFile(
    path.resolve(
      __dirname,
      "node_modules/@iconify-json/material-symbols/package.json",
    ),
    "utf-8",
  );
  const materialSymbolsPkgJson = JSON.parse(materialSymbolsPkgJsonContent);

  const templateData = iconIDs.map((id) =>
    getTemplateData(id, iconsData.icons[id]),
  );

  await pMap(
    templateData,
    async ({ name, title, svgBody }) => {
      const component = renderJavaScriptComponent(title, svgBody, name);
      const filename = `${name}.js`;
      return writeFile(path.resolve(dist, filename), component);
    },
    { concurrency: 20 },
  );

  console.log("✅ Generated JavaScript components");

  await pMap(
    templateData,
    async ({ name }) => {
      const dts = `import { DefineComponent } from 'vue';

export interface IconProps {
  title?: string;
  fillColor?: string;
  size?: number | string;
}

declare const ${name}: DefineComponent<IconProps, {}, any>;
export default ${name};
`;
      const filename = `${name}.d.ts`;
      return writeFile(path.resolve(dist, filename), dts);
    },
    { concurrency: 20 },
  );

  console.log("✅ Generated TypeScript declaration files");

  const firstIcon = templateData[0];
  if (!firstIcon) {
    throw new Error("No icons found to generate");
  }

  const indexContent = `// Auto-generated file - do not edit
// Material Symbols for Vue 3
// @iconify-json/material-symbols version: ${materialSymbolsPkgJson.version}

${templateData
  .map(({ name }) => `export { default as ${name} } from './${name}.js';`)
  .join("\n")}

export { IconProps } from './${firstIcon.name}.js';
`;

  await writeFile(path.resolve(dist, "index.js"), indexContent);
  console.log("✅ Generated index.js with named exports");

  const dtsContent = `// Type definitions for vue-material-design-icons
// Project: https://github.com/robcresswell/vue-material-design-icons
// Definitions by: Rob Cresswell <https://github.com/robcresswell>

import { DefineComponent } from 'vue';

export interface IconProps {
  title?: string;
  fillColor?: string;
  size?: number | string;
}

export type IconComponent = DefineComponent<IconProps, {}, any>;

${templateData
  .map(({ name }) => `export declare const ${name}: IconComponent;`)
  .join("\n")}
`;

  await writeFile(path.resolve(dist, "index.d.ts"), dtsContent);
  console.log("✅ Generated TypeScript definitions");

  const cjsContent = `// Auto-generated CommonJS exports
${templateData
  .map(({ name }) => `exports.${name} = require('./${name}.js').default;`)
  .join("\n")}
`;

  await writeFile(path.resolve(dist, "index.cjs"), cjsContent);
  console.log("✅ Generated CommonJS index");

  const distPackageJson = {
    name: "vue-material-design-icons",
    version: pkgJson.version,
    description: pkgJson.description,
    license: "MIT",
    author: pkgJson.author,
    repository: pkgJson.repository,
    type: "module",
    main: "./index.js",
    module: "./index.js",
    types: "./index.d.ts",
    exports: {
      ".": {
        types: "./index.d.ts",
        import: "./index.js",
        require: "./index.cjs",
      },
      "./styles.css": "./styles.css",
      "./*": {
        types: "./*.d.ts",
        import: "./*.js",
      },
    },
  };

  await writeFile(
    path.resolve(dist, "package.json"),
    JSON.stringify(distPackageJson, null, 2),
  );
  console.log("✅ Generated dist package.json");

  console.log(`\n🎉 Build complete! Generated ${iconIDs.length} icons.`);
  console.log("\nUsage:");
  console.log(
    '  import { Menu, Android } from "@brnbio/vue-material-design-icons";',
  );
}

build().catch((err: unknown) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
