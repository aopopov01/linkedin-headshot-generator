exports.up = function(knex) {
  return Promise.all([
    // Privacy requests table for GDPR/CCPA compliance
    knex.schema.createTable('privacy_requests', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('request_type').notNullable(); // access, deletion, portability, consent_update
      table.string('status').defaultTo('pending'); // pending, pending_verification, processing, completed, rejected
      table.text('request_details'); // JSON string with request-specific data
      table.string('verification_token');
      table.timestamp('verified_at');
      table.timestamp('completed_at');
      table.timestamp('expires_at');
      table.text('response_data'); // For storing response/export data
      table.text('rejection_reason'); // If request is rejected
      table.timestamps(true, true);
      
      // Indexes
      table.index(['user_id']);
      table.index(['request_type']);
      table.index(['status']);
      table.index(['verification_token']);
      table.index(['created_at']);
    }),

    // Data exports table for GDPR Article 15 compliance
    knex.schema.createTable('data_exports', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('verification_token').references('verification_token').inTable('privacy_requests');
      table.text('export_data'); // JSON string with user data export
      table.string('export_format').defaultTo('json'); // json, csv, xml
      table.string('download_url'); // Secure download URL
      table.integer('download_count').defaultTo(0);
      table.timestamp('last_downloaded');
      table.timestamp('expires_at').notNullable(); // Data exports expire after 90 days
      table.timestamps(true, true);
      
      // Indexes
      table.index(['user_id']);
      table.index(['verification_token']);
      table.index(['expires_at']);
    }),

    // Consent history table for GDPR Article 7 compliance
    knex.schema.createTable('consent_history', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('consent_type').notNullable(); // marketing, analytics, personalization, etc.
      table.boolean('consent_given').notNullable();
      table.string('consent_method'); // explicit, implicit, withdrawal
      table.text('consent_context'); // Where/how consent was given
      table.string('legal_basis'); // GDPR legal basis: consent, contract, legitimate_interest, etc.
      table.string('consent_version').defaultTo('1.0');
      table.timestamp('consent_date').notNullable();
      table.timestamp('expires_at'); // Consent expiration date (12 months for GDPR)
      table.timestamps(true, true);
      
      // Indexes
      table.index(['user_id']);
      table.index(['consent_type']);
      table.index(['consent_date']);
      table.index(['expires_at']);
    }),

    // Data processing activities for GDPR Article 30 compliance
    knex.schema.createTable('processing_activities', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('activity_name').notNullable();
      table.text('purpose'); // Purpose of processing
      table.text('legal_basis'); // GDPR Article 6 legal basis
      table.text('data_categories'); // Categories of personal data
      table.text('data_subjects'); // Categories of data subjects
      table.text('recipients'); // Recipients of personal data
      table.text('retention_period'); // Data retention period
      table.text('security_measures'); // Technical and organizational measures
      table.boolean('third_country_transfer').defaultTo(false);
      table.text('transfer_safeguards'); // Safeguards for international transfers
      table.timestamps(true, true);
      
      // Indexes
      table.index(['activity_name']);
    }),

    // Data breach incidents for GDPR Article 33/34 compliance
    knex.schema.createTable('data_breaches', table => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('breach_type').notNullable(); // confidentiality, integrity, availability
      table.text('description').notNullable();
      table.timestamp('detected_at').notNullable();
      table.timestamp('occurred_at');
      table.text('affected_data_types'); // Types of data affected
      table.integer('affected_individuals_count').defaultTo(0);
      table.text('consequences'); // Likely consequences
      table.text('measures_taken'); // Measures to address the breach
      table.boolean('authority_notified').defaultTo(false);
      table.timestamp('authority_notification_date');
      table.boolean('individuals_notified').defaultTo(false);
      table.timestamp('individual_notification_date');
      table.string('status').defaultTo('investigating'); // investigating, contained, resolved
      table.timestamps(true, true);
      
      // Indexes
      table.index(['detected_at']);
      table.index(['status']);
      table.index(['authority_notified']);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTable('data_breaches'),
    knex.schema.dropTable('processing_activities'),
    knex.schema.dropTable('consent_history'),
    knex.schema.dropTable('data_exports'),
    knex.schema.dropTable('privacy_requests')
  ]);
};