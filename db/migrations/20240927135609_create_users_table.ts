import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
	const result = await knex.schema.createTable('users', (table) => {
		table.uuid('id').primary()
		table.string('name').notNullable()
		table
			.string('email')
			.unique({ indexName: 'users_unique_email' })
			.notNullable()
			.comment('This is the email field')
		table.timestamp('created_at').defaultTo(knex.fn.now())
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('users')
}
