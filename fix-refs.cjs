#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read data.json
const dataPath = path.join(__dirname, 'public', 'data.json');

if (!fs.existsSync(dataPath)) {
  console.error('❌ Error: data.json not found at', dataPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

console.log('\n🔧 Fixing duplicate refs...\n');

let fixCount = 0;

Object.keys(data).forEach(sectionKey => {
  const section = data[sectionKey];

  // Fix offender_behavior - add 'O-' prefix
  if (section.offender_behavior && Array.isArray(section.offender_behavior)) {
    section.offender_behavior.forEach((item) => {
      if (item.ref && !item.ref.startsWith('O-')) {
        const oldRef = item.ref;
        item.ref = `O-${item.ref}`;
        console.log(`  ${sectionKey}: "${oldRef}" → "${item.ref}"`);
        fixCount++;
      }
    });
  }

  // Fix victim_behavior - add 'V-' prefix
  if (section.victim_behavior && Array.isArray(section.victim_behavior)) {
    section.victim_behavior.forEach((item) => {
      if (item.ref && !item.ref.startsWith('V-')) {
        const oldRef = item.ref;
        item.ref = `V-${item.ref}`;
        console.log(`  ${sectionKey}: "${oldRef}" → "${item.ref}"`);
        fixCount++;
      }
    });
  }
});

// Write back to file
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');

console.log(`\n✅ Fixed ${fixCount} refs!`);
console.log(`📝 Updated: ${dataPath}\n`);
