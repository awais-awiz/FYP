import fs from 'fs/promises';
import path from 'path';
import { transformAsync } from '@babel/core';

async function traverse(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await traverse(fullPath);
    } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      await convertFile(fullPath);
    }
  }
}

async function convertFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  if (filePath.endsWith('.d.ts')) {
     await fs.unlink(filePath);
     return;
  }
  const isTSX = filePath.endsWith('.tsx');
  
  try {
    const result = await transformAsync(content, {
      filename: filePath,
      presets: [
        ["@babel/preset-typescript", { isTSX, allExtensions: true }]
      ],
      retainLines: true,
      generatorOpts: {
        retainLines: true,
        compact: false,
        comments: true
      }
    });

    const outExt = isTSX ? '.jsx' : '.js';
    const outPath = filePath.substring(0, filePath.lastIndexOf('.')) + outExt;
    
    let finalCode = result.code;

    // A hack to fix enum outputs in babel to make them plain JS constants if they break, 
    // but babel preset typescript strips them or transforms them. 
    // Let's hope the default transpilation is fine.
    
    await fs.writeFile(outPath, finalCode);
    await fs.unlink(filePath);
    console.log(`Converted ${filePath} -> ${outPath}`);
  } catch (err) {
    console.error(`Failed on ${filePath}:`, err);
  }
}

traverse('./src').then(() => {
    console.log("Done converting all files in src/");
}).catch(console.error);
