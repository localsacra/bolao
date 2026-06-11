import * as fs from 'fs';
import * as path from 'path';

const logPath = 'C:/Users/varra/.gemini/antigravity/brain/fda3cca4-de04-4420-85d9-14623123029e/.system_generated/logs/transcript.jsonl';

if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf-8');
  console.log("File size:", content.length);
  const lines = content.split('\n');
  let matchCount = 0;
  for (const line of lines) {
    if (line.toLowerCase().includes('trigger') || line.toLowerCase().includes('policy') || line.toLowerCase().includes('constraint') || line.toLowerCase().includes('rls')) {
      matchCount++;
      if (matchCount <= 20) {
        try {
          const parsed = JSON.parse(line);
          console.log(`--- Match ${matchCount} ---`);
          console.log(parsed.content || parsed.tool_calls || parsed);
        } catch (e) {
          console.log(`--- Match ${matchCount} (raw) ---`);
          console.log(line.substring(0, 500));
        }
      }
    }
  }
  console.log("Total matching lines:", matchCount);
} else {
  console.log("Log file not found at:", logPath);
}
