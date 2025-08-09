exports.up = function(knex) {
  return knex.schema.createTable('generated_photos', table => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('original_image_url').notNullable();
    table.string('original_image_cloudinary_id');
    table.json('generated_images'); // Array of generated image URLs and metadata
    table.string('style_template').notNullable(); // corporate, creative, executive, startup, healthcare
    table.string('processing_status').defaultTo('pending'); // pending, processing, completed, failed
    table.integer('processing_time_seconds');
    table.string('replicate_prediction_id');
    table.json('ai_processing_metadata'); // Replicate response data
    table.decimal('processing_cost', 10, 4); // Track AI processing costs
    table.integer('download_count').defaultTo(0);
    table.timestamp('completed_at');
    table.timestamps(true, true);
    
    // Indexes
    table.index(['user_id']);
    table.index(['processing_status']);
    table.index(['style_template']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('generated_photos');
};