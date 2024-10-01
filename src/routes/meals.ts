import type { FastifyInstance } from 'fastify'
import { getCurrentUser } from '../middlewares/get-current-user'
import z, { ZodString } from 'zod'
import { knex } from '../database'
import { randomUUID, setEngine } from 'node:crypto'

export async function mealsRoutes(app: FastifyInstance) {
	app.post(
		'/',
		{
			preHandler: [getCurrentUser],
		},
		async (request, reply) => {
			const { sessionId } = request.cookies

			const createMealSchema = z.object({
				name: z.string(),
				description: z.string(),
				date: z.preprocess((arg) => {
					if (typeof arg === 'string') {
						const parsedDate = new Date(arg)
						return Number.isNaN(parsedDate) ? undefined : arg
					}
				}, z.string()),
				in_diet: z.boolean(),
			})

			const { name, description, date, in_diet } = createMealSchema.parse(
				request.body,
			)

			const mealId = await knex('meals')
				.insert({
					id: randomUUID(),
					name,
					description,
					date,
					in_diet,
					user_id: sessionId,
				})
				.returning('id')

			reply.code(201).send(mealId[0])
		},
	)

	app.delete(
		'/:id',
		{
			preHandler: [getCurrentUser],
		},
		async (request, reply) => {
			const { sessionId } = request.cookies

			const deleteMealSchema = z.object({
				id: z.string().uuid(),
			})

			const { id } = deleteMealSchema.parse(request.params)

			await knex('meals').delete().where({
				user_id: sessionId,
				id,
			})

			return reply.code(204).send()
		},
	)

	app.get(
		'/',
		{
			preHandler: [getCurrentUser],
		},
		async (request, reply) => {
			const { sessionId } = request.cookies

			const meals = await knex('meals').select().where('user_id', sessionId)

			return { meals }
		},
	)

	app.get(
		'/:id',
		{
			preHandler: [getCurrentUser],
		},
		async (request, reply) => {
			const { sessionId } = request.cookies

			const getEspecificMeal = z.object({
				id: z.string().uuid(),
			})

			const { id } = getEspecificMeal.parse(request.params)

			const meal = await knex('meals')
				.where({
					user_id: sessionId,
					id,
				})
				.first()

			return meal
		},
	)

	app.put(
		'/:id',
		{
			preHandler: [getCurrentUser],
		},
		async (request, reply) => {
			const { sessionId } = request.cookies

			const getEspecificMeal = z.object({
				id: z.string().uuid(),
			})

			const { id } = getEspecificMeal.parse(request.params)

			const createMealSchema = z.object({
				name: z.string().optional(),
				description: z.string().optional(),
				date: z
					.preprocess((arg) => {
						if (typeof arg === 'string') {
							const parsedDate = new Date(arg)
							return Number.isNaN(parsedDate) ? undefined : arg
						}
					}, z.string())
					.optional(),
				in_diet: z.boolean().optional(),
			})

			const { name, description, date, in_diet } = createMealSchema.parse(
				request.body,
			)

			await knex('meals')
				.update({
					name,
					description,
					date,
					in_diet,
				})
				.where({
					user_id: sessionId,
					id,
				})

			return reply.code(204).send()
		},
	)

	app.get(
		'/summary',
		{
			preHandler: [getCurrentUser],
		},
		async (request, reply) => {
			const { sessionId } = request.cookies

			const summary = await knex('meals')
				.select(
					knex.raw('COALESCE(COUNT(id), 0) as totalMeals'),
					knex.raw(
						'COALESCE(SUM(CASE WHEN in_diet = 1 THEN 1 ELSE 0 END), 0) as totalMealsInDiet',
					),
					knex.raw(
						'COALESCE(SUM(CASE WHEN in_diet = 0 THEN 1 ELSE 0 END), 0) as totalMealsOutDiet',
					),
				)
				.where('user_id', sessionId)

			const subQuery = knex('meals as r1')
				.select(
					'r1.id',
					'r1.name',
					'r1.date',
					'r1.in_diet',
					knex.raw(`
						(SELECT COUNT(*)
						FROM meals as r2
						WHERE r2.date < r1.date 
							AND r2.user_id = r1.user_id 
							AND r2.in_diet != r1.in_diet) as grupo
						`),
				)
				.where('r1.user_id', sessionId)
				.andWhere('r1.in_diet', 1)
				.as('sequencias')

			const bestSequence = await knex(subQuery)
				.select(knex.raw('COUNT(*) as bestSequence'))
				.groupBy('grupo')
				.orderBy('bestSequence', 'desc')
				.limit(1)

			const result = Object.assign({}, bestSequence[0], summary[0])

			return {
				summary: result,
			}
		},
	)
}
