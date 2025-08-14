// MongoDB initialization script
// This script runs when the MongoDB container starts for the first time

print('Starting MongoDB initialization...');

// Switch to the appdb database
db = db.getSiblingDB('appdb');

// Create the appuser with read/write permissions on appdb
db.createUser({
  user: 'appuser',
  pwd: 'apppass',
  roles: [
    {
      role: 'readWrite',
      db: 'appdb'
    }
  ]
});

print('Created user: appuser');

// Create the items collection
db.createCollection('items');

// Create an index on the name field
db.items.createIndex({ name: 1 });

print('Created collection: items with index on name field');

// Insert seed data
db.items.insertMany([
  { name: 'Seed A', createdAt: new Date() },
  { name: 'Seed B', createdAt: new Date() }
]);

print('Inserted seed data into items collection');

// Verify the setup
const itemCount = db.items.countDocuments();
print(`Total items in collection: ${itemCount}`);

const items = db.items.find().toArray();
print('Seed items:');
items.forEach(item => {
  print(`  - ID: ${item._id}, Name: ${item.name}`);
});

print('MongoDB initialization completed successfully!');