import * as fs from 'fs';
import * as path from 'path';

const filePath = 'C:/Users/varra/.gemini/antigravity/brain/85ee921d-663e-4af3-b942-8da7e92f59f0/.system_generated/steps/128/content.md';

function search() {
  if (!fs.existsSync(filePath)) {
    console.error("File does not exist!");
    return;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  const idx = content.indexOf("player_scores");
  console.log("Snippet around player_scores:");
  console.log(content.substring(idx - 50, idx + 500));
}

search();
