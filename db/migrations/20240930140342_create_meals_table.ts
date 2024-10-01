import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('meals', (table) => {
		table.uuid('id').primary()
		table.string('user_id')
		table.foreign('user_id').references('users.id').withKeyName('users_meals')
		table.string('name')
		table.string('description')
		table.boolean('in_diet').defaultTo(true)
		table.timestamp('date')
	})
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('meals')
}
