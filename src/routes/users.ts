import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { knex } from '../database'
import z from 'zod'

export async function usersRoutes(app: FastifyInstance) {
	app.post('/', async (request, reply) => {
		const userCreateSchema = z.object({
			name: z.string(),
			email: z.string().email(),
		})

		const { name, email } = userCreateSchema.parse(request.body)

		const uniqueEmailConstraint = await knex('users')
			.select('id')
			.where('email', email)
			.first()

		if (uniqueEmailConstraint) {
			return reply.code(409).send({
				message: 'There is already an user with this e-mail',
			})
		}

		const sessionId = await knex('users')
			.insert({
				id: randomUUID(),
				name,
				email,
			})
			.returning('id')

		reply.cookie('sessionId', sessionId[0].id, {
			path: '/',
			maxAge: 60 * 60 * 24 * 7, // 7 days
		})

		return reply.code(201).send()
	})
}
