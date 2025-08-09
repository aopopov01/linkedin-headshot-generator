exports.up = function(knex) {
  return knex.schema.createTable('style_templates', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('template_key').unique().notNullable(); // corporate, creative, executive, etc.
    table.string('display_name').notNullable();
    table.text('description');
    table.text('ai_prompt').notNullable(); // The prompt sent to Replicate
    table.text('negative_prompt');
    table.string('preview_image_url');
    table.json('ai_parameters'); // Replicate model parameters
    table.string('target_industry'); // tech, finance, healthcare, creative
    table.boolean('is_premium').defaultTo(false);
    table.decimal('premium_price', 10, 2); // Additional cost for premium styles
    table.integer('usage_count').defaultTo(0);
    table.decimal('average_rating', 3, 2); // User rating out of 5
    table.boolean('is_active').defaultTo(true);
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);
    
    // Indexes
    table.index(['template_key']);
    table.index(['is_premium']);
    table.index(['is_active']);
    table.index(['sort_order']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('style_templates');
};