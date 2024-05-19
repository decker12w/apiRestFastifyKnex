import cookie from "@fastify/cookie"
import fastify from "fastify"
import { routes as transactions } from "./routes/transactions"

export const app = fastify()

app.register(cookie)
app.register(transactions, {
  prefix: "transactions",
})
/* app.addHook("preHandler", async (request, reply) => {
    console.log([request.method, request.url].join(" "))
  }) */
