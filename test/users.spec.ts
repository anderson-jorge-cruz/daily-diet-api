import { afterAll, beforeAll, describe, it, beforeEach, expect } from 'vitest'
import { app } from '../src/app'
import request from 'supertest'
import { execSync } from 'node:child_process'
import { knex } from '../src/database'

describe('Users Routes', () => {
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

	it('should be able to create a new user', async () => {
		await request(app.server)
			.post('/users')
			.send({
				name: 'Anderson Jorge Cruz',
				email: 'andersonjorge.ti@gmail.com',
			})
			.expect(201)
	})

	it('should be able to get the identifier of that user', async () => {
		const createUserResponse = await request(app.server).post('/users').send({
			name: 'Anderson Jorge Cruz',
			email: 'andersonjorge.ti@gmail.com',
		})

		const sessionId = createUserResponse.get('Set-Cookie') ?? []

		expect(sessionId[0]).toContain(['sessionId'])
	})
})
