// migration-update-station-schema.js
// Run this script ONCE to migrate your existing database records
// Usage: node migration-update-station-schema.js

const mongoose = require('mongoose');
require('dotenv').config();

// Temporary schema that accepts both old and new formats
const StationSchema = new mongoose.Schema({}, { strict: false });
const Station = mongoose.model('Station', StationSchema);

async function migrateStations() {
  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/your-database-name');
    console.log('Connected to database successfully');

    // Get all stations
    const stations = await Station.find();
    console.log(`Found ${stations.length} stations to migrate`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const station of stations) {
      try {
        const updates = {};
        let needsUpdate = false;

        // Check if station has old 'quantity' field as string
        if (typeof station.quantity === 'string') {
          console.log(`\nMigrating station: ${station.name} (ID: ${station._id})`);
          console.log(`  Old quantity (string): "${station.quantity}"`);
          
          // Determine new stockStatus based on old quantity value
          if (station.quantity === 'out of stock') {
            updates.stockStatus = 'out of stock';
            updates.quantity = 0;
            needsUpdate = true;
          } else if (station.quantity === 'in stock') {
            updates.stockStatus = 'in stock';
            // Use the 'stock' field if it exists, otherwise default to 0
            updates.quantity = station.stock || 0;
            needsUpdate = true;
          }
          
          console.log(`  New stockStatus: "${updates.stockStatus}"`);
          console.log(`  New quantity (number): ${updates.quantity}`);
        }
        // Check if station has old 'stock' field
        else if (station.stock !== undefined) {
          console.log(`\nMigrating station: ${station.name} (ID: ${station._id})`);
          console.log(`  Old stock field: ${station.stock}`);
          
          // If we don't have stockStatus yet, set it
          if (!station.stockStatus) {
            updates.stockStatus = station.stock > 0 ? 'in stock' : 'out of stock';
            needsUpdate = true;
          }
          
          // If we don't have quantity as a number yet, use stock value
          if (typeof station.quantity !== 'number') {
            updates.quantity = station.stock;
            needsUpdate = true;
          }
          
          console.log(`  New stockStatus: "${updates.stockStatus}"`);
          console.log(`  New quantity (number): ${updates.quantity}`);
        }
        // Station already has proper format but might be missing stockStatus
        else if (!station.stockStatus && typeof station.quantity === 'number') {
          console.log(`\nAdding stockStatus to station: ${station.name} (ID: ${station._id})`);
          updates.stockStatus = station.quantity > 0 ? 'in stock' : 'out of stock';
          needsUpdate = true;
          console.log(`  Set stockStatus: "${updates.stockStatus}"`);
        }

        if (needsUpdate) {
          // Use updateOne with $set to update specific fields and $unset to remove old 'stock' field
          await Station.updateOne(
            { _id: station._id },
            { 
              $set: updates,
              $unset: { stock: "" }  // Remove old 'stock' field
            }
          );
          updatedCount++;
          console.log(`  ✓ Updated successfully`);
        } else {
          console.log(`\nSkipping station: ${station.name} (already up to date)`);
        }
      } catch (error) {
        console.error(`\n✗ Error migrating station ${station.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration Summary:');
    console.log('='.repeat(60));
    console.log(`Total stations found: ${stations.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Already up to date: ${stations.length - updatedCount - errorCount}`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n✓ Migration completed successfully!');
    } else {
      console.log(`\n⚠ Migration completed with ${errorCount} errors. Please check the logs above.`);
    }

    // Verify migration
    console.log('\nVerifying migration...');
    const verifyStations = await Station.find();
    const invalidStations = verifyStations.filter(s => 
      !s.stockStatus || 
      typeof s.quantity !== 'number' ||
      typeof s.quantity === 'string'
    );

    if (invalidStations.length === 0) {
      console.log('✓ All stations have been migrated correctly!');
    } else {
      console.log(`⚠ Warning: ${invalidStations.length} stations still have invalid data:`);
      invalidStations.forEach(s => {
        console.log(`  - ${s.name} (ID: ${s._id})`);
        console.log(`    stockStatus: ${s.stockStatus}`);
        console.log(`    quantity: ${s.quantity} (type: ${typeof s.quantity})`);
      });
    }

  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run migration
console.log('='.repeat(60));
console.log('Station Schema Migration Script');
console.log('='.repeat(60));
console.log('This script will update your stations from the old schema to the new schema');
console.log('Old: quantity (string: "in stock"/"out of stock"), stock (number)');
console.log('New: stockStatus (string: "in stock"/"out of stock"), quantity (number)');
console.log('='.repeat(60));
console.log('');

migrateStations();