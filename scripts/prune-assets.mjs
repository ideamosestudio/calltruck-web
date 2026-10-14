import { readdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
async function filesIn(dir) {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((entry) =>
        entry.isDirectory()
          ? filesIn(path.join(dir, entry.name))
          : path.join(dir, entry.name),
      ),
    )
  ).flat();
}
const files = await filesIn(root);
const documents = (
  await Promise.all(
    files
      .filter((file) => /\.(html|css|js|xml|txt|svg|json)$/.test(file))
      .map((file) => readFile(file, 'utf8')),
  )
).join('\n');
let removed = 0;
for (const file of files) {
  // Only generated raster copies, never source images or public brand assets.
  if (
    path.dirname(file) !== path.join(root, '_astro') ||
    !/\.(webp|jpg|png|avif)$/.test(file)
  )
    continue;
  if (documents.includes(path.basename(file))) continue;
  await unlink(file);
  removed++;
}
console.log(
  `Removed ${removed} unreferenced generated image originals/copies.`,
);
