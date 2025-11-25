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

// Collect all refs with their locations
const refMap = new Map(); // ref -> array of locations
let totalRefs = 0;

Object.keys(data).forEach(sectionKey => {
  const section = data[sectionKey];

  // Check offender_behavior
  if (section.offender_behavior && Array.isArray(section.offender_behavior)) {
    section.offender_behavior.forEach((item, index) => {
      totalRefs++;
      const ref = item.ref;
      const location = `${sectionKey} > offender_behavior[${index}]`;

      if (!refMap.has(ref)) {
        refMap.set(ref, []);
      }
      refMap.get(ref).push(location);
    });
  }

  // Check victim_behavior
  if (section.victim_behavior && Array.isArray(section.victim_behavior)) {
    section.victim_behavior.forEach((item, index) => {
      totalRefs++;
      const ref = item.ref;
      const location = `${sectionKey} > victim_behavior[${index}]`;

      if (!refMap.has(ref)) {
        refMap.set(ref, []);
      }
      refMap.get(ref).push(location);
    });
  }
});

// Find duplicates
const duplicates = [];
refMap.forEach((locations, ref) => {
  if (locations.length > 1) {
    duplicates.push({ ref, locations });
  }
});

// Report results
console.log('\n📊 Reference Check Results');
console.log('='.repeat(50));
console.log(`Total refs: ${totalRefs}`);
console.log(`Unique refs: ${refMap.size}`);
console.log(`Duplicates: ${duplicates.length}\n`);

if (duplicates.length > 0) {
  console.log('❌ DUPLICATE REFS FOUND:\n');
  duplicates.forEach(({ ref, locations }) => {
    console.log(`\n  Ref: "${ref}" (${locations.length} occurrences)`);
    locations.forEach(location => {
      console.log(`    - ${location}`);
    });
  });
  console.log('\n⚠️  Please fix these duplicates to ensure proper checkbox state persistence.\n');
  process.exit(1);
} else {
  console.log('✅ All refs are unique!\n');
  process.exit(0);
}
