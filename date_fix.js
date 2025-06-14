import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Create __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read all JSON files in the directory
const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.json'));

for (const file of files) {
  try {
    const fullPath = path.join(__dirname, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const json = JSON.parse(raw);

    if (Array.isArray(json.data)) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      let lastAssignedDate = new Date();
      const yearDates = new Map();

      // Add date_added in reverse order (last = newest date)
      for (let i = json.data.length - 1; i >= 0; i--) {
        const item = json.data[i];

        if (i === json.data.length - 1) {
          // Last item always gets today's date
          item.date_added = currentDate.toISOString().split('T')[0];
          lastAssignedDate = new Date(currentDate);
          continue;
        }

        if (item.year) {
          const year = parseInt(item.year);

          if (year === currentYear) {
            // Current year - continue sequence from last date
            const newDate = new Date(lastAssignedDate);
            newDate.setDate(newDate.getDate() - 1);
            item.date_added = newDate.toISOString().split('T')[0];
            lastAssignedDate = newDate;
          } else {
            // Past years - start from December 31 of that specific year
            if (!yearDates.has(year)) {
              const yearEnd = new Date(year, 11, 31);
              item.date_added = yearEnd.toISOString().split('T')[0];
              yearDates.set(year, yearEnd);
            } else {
              const lastDate = yearDates.get(year);
              const newDate = new Date(lastDate);
              newDate.setDate(newDate.getDate() - 1);
              item.date_added = newDate.toISOString().split('T')[0];
              yearDates.set(year, newDate);
            }
          }
        } else {
          // No year - continue sequence from last date
          const newDate = new Date(lastAssignedDate);
          newDate.setDate(newDate.getDate() - 1);
          item.date_added = newDate.toISOString().split('T')[0];
          lastAssignedDate = newDate;
        }
      }

      // Save back to the same file
      fs.writeFileSync(fullPath, JSON.stringify(json, null, 2));
      console.log(`✅ Updated: ${file}`);
    } else {
      console.log(`⚠️ Skipped (no 'data' array): ${file}`);
    }
  } catch (err) {
    console.error(`❌ Error processing ${file}: ${err.message}`);
  }
}
