// diagnose-database.js
// This script will check your database and tell you exactly what's wrong
// Usage: node diagnose-database.js

const mongoose = require('mongoose');
require('dotenv').config();

async function diagnoseDatabaseIssues() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('DATABASE DIAGNOSIS TOOL');
    console.log('='.repeat(70));

    // Connect to database
    console.log('\n[1] Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/powerev');
    console.log('✓ Connected successfully');

    // Get stations collection
    const db = mongoose.connection.db;
    const stationsCollection = db.collection('stations');
    
    // Count total stations
    const totalCount = await stationsCollection.countDocuments();
    console.log(`\n[2] Found ${totalCount} stations in database`);

    if (totalCount === 0) {
      console.log('\n⚠ WARNING: No stations found in database!');
      console.log('This is a fresh database. You can proceed to create stations.');
      return;
    }

    // Get all stations
    const stations = await stationsCollection.find().toArray();

    console.log('\n[3] Analyzing station data structure...\n');
    console.log('='.repeat(70));

    let issues = [];
    let okCount = 0;

    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];
      const stationIssues = [];

      console.log(`\nStation ${i + 1}: ${station.name} (ID: ${station._id})`);
      console.log('-'.repeat(70));

      // Check stockStatus field
      if (!station.stockStatus) {
        stationIssues.push('✗ MISSING stockStatus field');
      } else if (typeof station.stockStatus !== 'string') {
        stationIssues.push(`✗ stockStatus is ${typeof station.stockStatus}, should be string`);
      } else if (!['in stock', 'out of stock'].includes(station.stockStatus)) {
        stationIssues.push(`✗ stockStatus has invalid value: "${station.stockStatus}"`);
      } else {
        console.log(`  ✓ stockStatus: "${station.stockStatus}" (correct)`);
      }

      // Check quantity field
      if (station.quantity === undefined) {
        stationIssues.push('✗ MISSING quantity field');
      } else if (typeof station.quantity === 'string') {
        stationIssues.push(`✗ quantity is STRING: "${station.quantity}" (should be NUMBER)`);
      } else if (typeof station.quantity !== 'number') {
        stationIssues.push(`✗ quantity is ${typeof station.quantity}, should be number`);
      } else {
        console.log(`  ✓ quantity: ${station.quantity} (correct)`);
      }

      // Check for old 'stock' field
      if (station.stock !== undefined) {
        stationIssues.push(`✗ Has old 'stock' field with value: ${station.stock} (should be removed)`);
      }

      // Check price
      if (typeof station.price !== 'number') {
        stationIssues.push(`✗ price is ${typeof station.price}, should be number`);
      }

      // Print issues for this station
      if (stationIssues.length > 0) {
        console.log('\n  ISSUES FOUND:');
        stationIssues.forEach(issue => console.log(`    ${issue}`));
        issues.push({ station: station.name, issues: stationIssues });
      } else {
        console.log('  ✓ All fields correct!');
        okCount++;
      }

      // Show current data structure
      console.log('\n  Current data:');
      console.log(`    {`);
      console.log(`      _id: ${station._id}`);
      console.log(`      name: "${station.name}"`);
      console.log(`      price: ${station.price} (${typeof station.price})`);
      if (station.stockStatus !== undefined) {
        console.log(`      stockStatus: "${station.stockStatus}" (${typeof station.stockStatus})`);
      }
      if (station.quantity !== undefined) {
        console.log(`      quantity: ${JSON.stringify(station.quantity)} (${typeof station.quantity})`);
      }
      if (station.stock !== undefined) {
        console.log(`      stock: ${station.stock} (${typeof station.stock}) ← OLD FIELD, REMOVE!`);
      }
      console.log(`      ... other fields ...`);
      console.log(`    }`);
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('DIAGNOSIS SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total stations: ${totalCount}`);
    console.log(`Correct format: ${okCount}`);
    console.log(`Need migration: ${totalCount - okCount}`);

    if (issues.length === 0) {
      console.log('\n✓ SUCCESS: All stations have the correct format!');
      console.log('Your database is ready. The 500 error must be coming from something else.');
      console.log('\nNext steps:');
      console.log('1. Check your backend console for the actual error message');
      console.log('2. Make sure your station.model.js matches the new schema');
      console.log('3. Make sure your station.controller.js is updated');
    } else {
      console.log('\n✗ PROBLEMS FOUND: The following stations need to be migrated:\n');
      issues.forEach((item, idx) => {
        console.log(`${idx + 1}. ${item.station}:`);
        item.issues.forEach(issue => console.log(`   ${issue}`));
      });

      console.log('\n' + '='.repeat(70));
      console.log('RECOMMENDED ACTION');
      console.log('='.repeat(70));
      console.log('Run the migration script:');
      console.log('  node migration-update-station-schema.js');
      console.log('\nThis will fix all the issues automatically.');
    }

    console.log('\n' + '='.repeat(70));
    console.log('WHAT SHOULD THE DATA LOOK LIKE?');
    console.log('='.repeat(70));
    console.log('Correct format:');
    console.log(`{
  _id: ObjectId("..."),
  name: "Tesla Wall Connector",
  price: 15000,                    // ← NUMBER
  stockStatus: "in stock",         // ← STRING: "in stock" or "out of stock"
  quantity: 25,                    // ← NUMBER (count of items)
  brand: "Tesla",
  connectorType: "Type 2",
  ...
}`);

    console.log('\nIncorrect formats (OLD schema):');
    console.log(`{
  quantity: "in stock",            // ✗ WRONG: quantity should be NUMBER
  stock: 25                        // ✗ WRONG: old field name
}`);

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n✗ ERROR:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

diagnoseDatabaseIssues();