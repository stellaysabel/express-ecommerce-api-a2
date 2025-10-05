require('dotenv').config();
const path = require('path');
const db = require('./knex');

(async () => {
  try {
    console.log('Running migrations...');
    await db.migrate.latest({ directory: path.join(__dirname, '..', 'migrations') });

    // Simple seed: if no products, add a few
    const [{ count }] = await db('products').count('*');
    if (Number(count) === 0) {
      console.log('Seeding products...');
      await db('products').insert([
        { name: 'Coffee Mug', sku: 'MUG-COFFEE', price: 12.99, stock: 50, description: 'Ceramic mug 350ml' },
        { name: 'T-Shirt', sku: 'TSHIRT-BASIC', price: 19.99, stock: 100, description: '100% cotton tee' },
        { name: 'Notebook', sku: 'NOTE-A5', price: 6.5, stock: 200, description: 'A5 dot grid notebook' }
      ]);
    }
    console.log('Migrations complete.');
    process.exit(0);
  } catch (e) {
    console.error('Migration error:', e);
    process.exit(1);
  }
})();
