#!/usr/bin/env -S node -r ts-node/register/transpile-only

// Imports
import { mkdir, writeFile, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pMap from 'p-map';
import * as icons from '@mdi/js/commonjs/mdi.js';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dist = path.resolve(__dirname, 'dist');

// JavaScript component using Vue 3 h() function
function renderJavaScriptComponent(title: string, svgPathData: string, name: string) {
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


function getTemplateData(id: string) {
  const splitID = id.split(/(?=[A-Z])/).slice(1);

  const name = splitID.join('');

  // This is a hacky way to remove the 'mdi' prefix, so "mdiAndroid" becomes
  // "android", for example
  const title = splitID.join('-').toLowerCase();

  return {
    name,
    title,
    svgPathData: icons[id],
  };
}

async function build() {
  console.log('🔨 Building Material Design Icons for Vue 3...');

  // Filter out CommonJS metadata keys like __esModule, default, etc.
  const iconIDs = Object.keys(icons).filter(
    (key) => key.startsWith('mdi') && typeof icons[key] === 'string'
  );
  console.log(`📦 Processing ${iconIDs.length} icons...`);

  if (!existsSync(dist)) {
    await mkdir(dist);
  }

  // Read package.json files
  const pkgJsonContent = await readFile(path.resolve(__dirname, 'package.json'), 'utf-8');
  const pkgJson = JSON.parse(pkgJsonContent);

  const mdiPkgJsonContent = await readFile(
    path.resolve(__dirname, 'node_modules/@mdi/js/package.json'),
    'utf-8'
  );
  const mdiPkgJson = JSON.parse(mdiPkgJsonContent);

  const templateData = iconIDs.map(getTemplateData);

  // Generate JavaScript components
  await pMap(
    templateData,
    async ({ name, title, svgPathData }) => {
      const component = renderJavaScriptComponent(title, svgPathData, name);
      const filename = `${name}.js`;
      return writeFile(path.resolve(dist, filename), component);
    },
    { concurrency: 20 },
  );

  console.log('✅ Generated JavaScript components');

  // Generate TypeScript definition files for each component
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

  console.log('✅ Generated TypeScript declaration files');

  // Generate index.js with all named exports
  const indexContent = `// Auto-generated file - do not edit
// Material Design Icons for Vue 3
// @mdi/js version: ${mdiPkgJson.version}

${templateData
  .map(({ name }) => `export { default as ${name} } from './${name}.js';`)
  .join('\n')}

export { IconProps } from './${templateData[0].name}.js';
`;

  await writeFile(path.resolve(dist, 'index.js'), indexContent);
  console.log('✅ Generated index.js with named exports');

  // Generate index.d.ts for TypeScript definitions
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
  .join('\n')}
`;

  await writeFile(path.resolve(dist, 'index.d.ts'), dtsContent);
  console.log('✅ Generated TypeScript definitions');

  // Generate CommonJS version of index
  const cjsContent = `// Auto-generated CommonJS exports
${templateData
  .map(({ name }) => `exports.${name} = require('./${name}.js').default;`)
  .join('\n')}
`;

  await writeFile(path.resolve(dist, 'index.cjs'), cjsContent);
  console.log('✅ Generated CommonJS index');

  // Generate package.json for dist
  const distPackageJson = {
    name: 'vue-material-design-icons',
    version: pkgJson.version,
    description: pkgJson.description,
    license: 'MIT',
    author: pkgJson.author,
    repository: pkgJson.repository,
    type: 'module',
    main: './index.js',
    module: './index.js',
    types: './index.d.ts',
    exports: {
      '.': {
        types: './index.d.ts',
        import: './index.js',
        require: './index.cjs',
      },
      './styles.css': './styles.css',
      './*': {
        types: './*.d.ts',
        import: './*.js',
      },
    },
  };

  await writeFile(
    path.resolve(dist, 'package.json'),
    JSON.stringify(distPackageJson, null, 2)
  );
  console.log('✅ Generated dist package.json');

  console.log(`\n🎉 Build complete! Generated ${iconIDs.length} icons.`);
  console.log('\nUsage:');
  console.log('  import { Menu, Android } from "@brnbio/vue-material-design-icons";');
}

build().catch((err: unknown) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
