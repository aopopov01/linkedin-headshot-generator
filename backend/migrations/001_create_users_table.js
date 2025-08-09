exports.up = function(knex) {
  return knex.schema.createTable('users', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name');
    table.string('last_name');
    table.string('phone');
    table.string('subscription_status').defaultTo('free'); // free, premium, enterprise
    table.integer('credits_remaining').defaultTo(1); // Free tier gets 1 credit
    table.integer('total_photos_generated').defaultTo(0);
    table.timestamp('last_active').defaultTo(knex.fn.now());
    table.timestamp('subscription_expires_at');
    table.string('stripe_customer_id');
    table.string('revenu_cat_user_id');
    table.boolean('is_active').defaultTo(true);
    table.json('preferences'); // User preferences and settings
    table.timestamps(true, true);
    
    // Indexes
    table.index(['email']);
    table.index(['subscription_status']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};