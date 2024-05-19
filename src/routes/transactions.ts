import { randomUUID } from "crypto"
import { FastifyInstance } from "fastify"
import { z } from "zod"

import { knex } from "../database"
import { checkSessionId } from "../middlewares/check-session-id"

//Unitários:unidade da sua aplicação
//Integração:comunicação entre duas oum mais unidades
//E2E:Teste de ponta a ponta: simulam um usuário operando na nossa aplicação

//front_end: abre a pagina de login, insere o email e senha, clica no botão de login, espera a resposta do servidor
//backend: chamadas HTTP, WebSockets

//Piramide de testes: E2E(não dependem de nenhuma tecnologia, não dependem de arquiteura)
// 2000 testes -> Testes E2E -> 16 min

export async function routes(app: FastifyInstance) {
  app.addHook("preHandler", async (request) => {
    console.log([request.method, request.url].join(" "))
  })

  app.get("/", { preHandler: [checkSessionId] }, async (request) => {
    const { sessionId } = request.cookies
    const transactions = await knex("transactions")
      .where("session_id", sessionId)
      .select()

    return { transactions }
  })

  app.get("/:id", { preHandler: [checkSessionId] }, async (request) => {
    const { sessionId } = request.cookies
    const validator = z.object({
      id: z.string().uuid(),
    })
    const { id } = validator.parse(request.params)

    const transaction = await knex("transactions")
      .where({ id, session_id: sessionId })
      .first()

    return { transaction }
  })

  app.get("/summary", { preHandler: [checkSessionId] }, async (request) => {
    const { sessionId } = request.cookies
    const summary = await knex("transactions")
      .where("session_id", sessionId)
      .sum("amount", {
        as: "amount",
      })
      .first()

    return { summary }
  })

  app.post("/", async (request, reply) => {
    const validator = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    })
    const { amount, title, type } = validator.parse(request.body)

    const sessionId = request.cookies.sessionId ?? randomUUID()
    reply.cookie("sessionId", sessionId, {
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })

    await knex("transactions").insert({
      id: randomUUID(),
      amount: type === "credit" ? amount : amount * -1,
      title,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
