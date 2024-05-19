import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import request from "supertest"

import { execSync } from "child_process"

import { app } from "../src/app"

describe("Transactions", () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync("npm run knex migrate:rollback --all")
    execSync("npm run knex migrate:latest")
  })

  it("should be able to create a new transaction", async () => {
    await request(app.server)
      .post("/transactions")
      .send({
        title: "Salary",
        amount: 3000,
        type: "credit",
      })
      .expect(201)
  })

  //it.todo, it.only , it.skip
  it("should be able to list all transactions", async () => {
    const transaction = {
      title: "Salary",
      amount: 3000,
      type: "credit",
    }
    const creationResponse = await request(app.server)
      .post("/transactions")
      .send(transaction)

    const cookies = creationResponse.get("Set-Cookie") as string[]

    const response = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200)

    expect(response.body).toEqual({
      transactions: [
        expect.objectContaining({
          title: transaction.title,
          amount: transaction.amount,
        }),
      ],
    })
  })

  //it.todo, it.only , it.skip
  it("should be able to get a specific transaction", async () => {
    const transaction = {
      title: "Salary",
      amount: 3000,
      type: "credit",
    }

    const creationResponse = await request(app.server)
      .post("/transactions")
      .send(transaction)

    const cookies = creationResponse.get("Set-Cookie") as string[]

    const ListTransactionResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200)

    const transactionId = ListTransactionResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: transaction.title,
        amount: transaction.amount,
      }),
    )
  }) // Add this closing curly brace

  it("should be able to get transactions summary", async () => {
    const credito = {
      title: "çeg",
      amount: 5000,
      type: "credit",
    }

    const debito = {
      title: "çeg",
      amount: 5000,
      type: "debit",
    }
    const creationResponse = await request(app.server)
      .post("/transactions")
      .send(credito)
    const cookies = creationResponse.get("Set-Cookie") as string[]

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send(debito)

    const response = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .expect(200)

    expect(response.body).toEqual({
      summary: {
        amount: credito.amount - debito.amount,
      },
    })
  })
})
