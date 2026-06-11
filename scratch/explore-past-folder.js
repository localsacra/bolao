import * as fs from 'fs';
import * as path from 'path';

const dirPath = 'C:/Users/varra/.gemini/antigravity/brain/fda3cca4-de04-4420-85d9-14623123029e';

function explore(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      explore(full);
    } else if (file.endsWith('.md')) {
      console.log("Found MD file:", full);
      console.log("Content:\n", fs.readFileSync(full, 'utf-8').substring(0, 1000));
      console.log("\n===================================\n");
    }
  }
}

explore(dirPath);
