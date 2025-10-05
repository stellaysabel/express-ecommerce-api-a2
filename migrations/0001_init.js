// migrations/0001_init.js

/** @param { import('knex').Knex } knex */
exports.up = async function up(knex) {
  // DO NOT create extensions on shared RDS
  // await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable('products', (t) => {
    t.uuid('id').primary();                           // no default here
    t.string('name').notNullable();
    t.string('sku').notNullable().unique();
    t.decimal('price', 10, 2).notNullable();
    t.integer('stock').notNullable().defaultTo(0);
    t.text('description').notNullable().defaultTo('');
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('customers', (t) => {
    t.uuid('id').primary();                           // no default here
    t.string('name').notNullable();
    t.string('email').notNullable().unique();
    t.string('password_hash').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('orders', (t) => {
    t.uuid('id').primary();                           // no default here
    t.uuid('customer_id').notNullable()
      .references('id').inTable('customers').onDelete('CASCADE');
    t.string('status').notNullable().defaultTo('NEW');
    t.decimal('total', 12, 2).notNullable().defaultTo(0);
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('order_lines', (t) => {
    t.uuid('id').primary();                           // no default here
    t.uuid('order_id').notNullable()
      .references('id').inTable('orders').onDelete('CASCADE');
    t.uuid('product_id').notNullable()
      .references('id').inTable('products');
    t.integer('quantity').notNullable();
    t.decimal('unit_price', 10, 2).notNullable();
    t.decimal('line_total', 12, 2).notNullable();
  });
};

/** @param { import('knex').Knex } knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('order_lines');
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('customers');
  await knex.schema.dropTableIfExists('products');
};
