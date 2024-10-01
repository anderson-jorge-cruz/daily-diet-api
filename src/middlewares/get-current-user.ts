import type { FastifyReply, FastifyRequest } from 'fastify'

export async function getCurrentUser(
	request: FastifyRequest,
	reply: FastifyReply,
) {
	const { sessionId } = request.cookies

	if (!sessionId) {
		reply.code(401).send()
	}
}
