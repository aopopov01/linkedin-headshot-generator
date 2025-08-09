exports.up = function(knex) {
  return knex.schema.createTable('purchases', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('product_id').notNullable(); // Package identifier (5_photos, 10_photos, etc.)
    table.decimal('amount_usd', 10, 2).notNullable();
    table.string('currency').defaultTo('USD');
    table.string('payment_provider').notNullable(); // stripe, revenu_cat
    table.string('provider_transaction_id').notNullable();
    table.string('provider_customer_id');
    table.string('payment_method'); // card, apple_pay, google_pay
    table.string('purchase_platform').notNullable(); // ios, android, web
    table.string('status').defaultTo('pending'); // pending, completed, failed, refunded
    table.integer('credits_purchased').notNullable(); // Number of photo generation credits
    table.json('provider_metadata'); // Full payment provider response
    table.timestamp('purchase_date').defaultTo(knex.fn.now());
    table.timestamp('refunded_at');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['status']);
    table.index(['purchase_platform']);
    table.index(['purchase_date']);
    table.index(['provider_transaction_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('purchases');
};