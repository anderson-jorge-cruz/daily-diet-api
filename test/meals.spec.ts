import { afterAll, beforeAll, describe, it, beforeEach, expect } from 'vitest'
import { app } from '../src/app'
import request from 'supertest'
import { execSync } from 'node:child_process'

describe('Meals Routes', () => {
	beforeAll(async () => {
		await app.ready()
	})

	afterAll(async () => {
		await app.close()
	})

	beforeEach(() => {
		execSync('npm run knex migrate:rollback --all')
		execSync('npm run knex migrate:latest')
	})

	it('should be able to register a new meal', async () => {
		const createUserResponse = await request(app.server).post('/users').send({
			name: 'Anderson Jorge Cruz',
			email: 'andersonjorge.ti@gmail.com',
		})

		const sessionId = createUserResponse.get('Set-Cookie') ?? []

		await request(app.server)
			.post('/meals')
			.set('Cookie', sessionId)
			.send({
				name: 'Café da manhã',
				description: 'Café tomado as 07:00',
				date: '2024-09-30 07:00:00',
				in_diet: true,
			})
			.expect(201)
	})

	it('should be able to delete a meal', async () => {
		const createUserResponse = await request(app.server).post('/users').send({
			name: 'Anderson Jorge Cruz',
			email: 'andersonjorge.ti@gmail.com',
		})

		const sessionId = createUserResponse.get('Set-Cookie') ?? []

		const createMealRespose = await request(app.server)
			.post('/meals')
			.set('Cookie', sessionId)
			.send({
				name: 'Café da manhã',
				description: 'Café tomado as 07:00',
				date: '2024-09-30 07:00:00',
				in_diet: true,
			})

		const mealId = JSON.parse(createMealRespose.text).id

		await request(app.server)
			.put(`/meals/${mealId}`)
			.set('Cookie', sessionId)
			.send({
				name: 'Café da tarde',
				description: 'Café tomado as 16:00:00',
				date: '2024-09-30 16:00:00',
				in_diet: true,
			})
			.expect(204)
	})

	it('should be able to edit a meal', async () => {
		const createUserResponse = await request(app.server).post('/users').send({
			name: 'Anderson Jorge Cruz',
			email: 'andersonjorge.ti@gmail.com',
		})

		const sessionId = createUserResponse.get('Set-Cookie') ?? []

		const createMealRespose = await request(app.server)
			.post('/meals')
			.set('Cookie', sessionId)
			.send({
				name: 'Café da manhã',
				description: 'Café tomado as 07:00',
				date: '2024-09-30 07:00:00',
				in_diet: true,
			})

		const mealId = JSON.parse(createMealRespose.text).id

		await request(app.server)
			.delete(`/meals/${mealId}`)
			.set('Cookie', sessionId)
			.send()
			.expect(204)
	})

	it('should be able to list all meals', async () => {
		const createUserResponse = await request(app.server).post('/users').send({
			name: 'Anderson Jorge Cruz',
			email: 'andersonjorge.ti@gmail.com',
		})

		const sessionId = createUserResponse.get('Set-Cookie') ?? []

		const createMealRespose = await request(app.server)
			.post('/meals')
			.set('Cookie', sessionId)
			.send({
				name: 'Café da manhã',
				description: 'Café tomado as 07:00',
				date: '2024-09-30 07:00:00',
				in_diet: true,
				user_id: sessionId,
			})

		const mealId = JSON.parse(createMealRespose.text).id

		const getMealsResponse = await request(app.server)
			.get('/meals/')
			.set('Cookie', sessionId)
			.send()

		const meals = JSON.parse(getMealsResponse.text)

		const userId = sessionId[0]
			.split('; ') // Divide a string por '; '
			.find((item) => item.startsWith('sessionId=')) // Encontra a parte que começa com 'sessionId='
			?.split('=')[1]

		expect(meals.meals[0]).toEqual(
			expect.objectContaining({
				id: mealId,
				user_id: userId,
				name: 'Café da manhã',
				description: 'Café tomado as 07:00',
				in_diet: 1,
				date: '2024-09-30 07:00:00',
			}),
		)
	})

	it('should be able to list a specific meal', async () => {
		const createUserResponse = await request(app.server).post('/users').send({
			name: 'Anderson Jorge Cruz',
			email: 'andersonjorge.ti@gmail.com',
		})

		const sessionId = createUserResponse.get('Set-Cookie') ?? []
		const userId = sessionId[0]
			.split('; ') // Divide a string por '; '
			.find((item) => item.startsWith('sessionId=')) // Encontra a parte que começa com 'sessionId='
			?.split('=')[1]

		const createMealResponse = await request(app.server)
			.post('/meals')
			.set('Cookie', sessionId)
			.send({
				name: 'Café da manhã',
				description: 'Pequeno café',
				date: '2024-10-01 07:00:00',
				in_diet: true,
			})

		const mealId = JSON.parse(createMealResponse.text).id

		const getSpecificMealResponse = await request(app.server)
			.get(`/meals/${mealId}`)
			.set('Cookie', sessionId)

		const specificMeal = JSON.parse(getSpecificMealResponse.text)

		expect(specificMeal).toEqual(
			expect.objectContaining({
				id: mealId,
				user_id: userId,
				name: 'Café da manhã',
				description: 'Pequeno café',
				date: '2024-10-01 07:00:00',
				in_diet: 1,
			}),
		)
	})

	it('should be able to receive the summary', async () => {
		const createUserResponse = await request(app.server).post('/users').send({
			name: 'Anderson Jorge Cruz',
			email: 'andersonjorge.ti@gmail.com',
		})

		const sessionId = createUserResponse.get('Set-Cookie') ?? []

		const createMealResponse = await request(app.server)
			.post('/meals')
			.set('Cookie', sessionId)
			.send({
				name: 'Café da manhã',
				description: 'Pequeno café',
				date: '2024-10-01 07:00:00',
				in_diet: true,
			})

		const getSummaryResponse = await request(app.server)
			.get('/meals/summary')
			.set('Cookie', sessionId)

		const summary = JSON.parse(getSummaryResponse.text)

		expect(summary.summary).toEqual({
			totalMeals: 1,
			totalMealsInDiet: 1,
			totalMealsOutDiet: 0,
			bestSequence: 1,
		})
	})
})
