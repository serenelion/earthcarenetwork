import { storage } from '../storage';
import { seedEnterprises } from '../data/seed-enterprises';

async function seedEnterpriseData() {
  console.log('🌱 Starting enterprise seeding...\n');
  
  try {
    let created = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const enterpriseData of seedEnterprises) {
      try {
        // Check for exact name match using dedicated storage method
        const existingEnterprise = await storage.getEnterpriseByName(enterpriseData.name);
        
        if (existingEnterprise) {
          console.log(`⏭️  Skipping "${enterpriseData.name}" - already exists`);
          skipped++;
          continue;
        }
        
        // Create the enterprise
        const newEnterprise = await storage.createEnterprise(enterpriseData);
        console.log(`✅ Created "${newEnterprise.name}" (${newEnterprise.category})`);
        created++;
        
      } catch (error) {
        console.error(`❌ Error creating "${enterpriseData.name}":`, error);
        errors++;
      }
    }
    
    // Display summary
    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📈 Total processed: ${created + skipped + errors}/${seedEnterprises.length}`);
    
    // Display category breakdown
    if (created > 0) {
      const stats = await storage.getEnterpriseStats();
      console.log('\n📈 Current Database Stats:');
      console.log(`   Total enterprises: ${stats.total}`);
      console.log('   By category:');
      for (const [category, count] of Object.entries(stats.byCategory)) {
        console.log(`     - ${category}: ${count}`);
      }
    }
    
    console.log('\n✨ Enterprise seeding complete!\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error during seeding:', error);
    throw error;
  }
}

// Stand-alone seeding script version (exits process)
async function runSeedingScript() {
  try {
    await seedEnterpriseData();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeedingScript();
}

export { seedEnterpriseData };
