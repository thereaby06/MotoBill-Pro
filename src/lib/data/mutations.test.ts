import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  convertQuoteToInvoice,
  DomainError,
  loginSnapshot,
  upsertAppointment,
  upsertUser,
} from "./mutations";
import { createSeedSnapshot } from "./seed";

describe("dominio MotoBill", () => {
  it("inicia sesión con las credenciales demo", () => {
    const next = loginSnapshot(createSeedSnapshot(), "admin@demo.motobill", "demo1234");
    assert.equal(next.currentUserId, "user_admin");
  });

  it("rechaza contraseñas incorrectas", () => {
    assert.throws(
      () => loginSnapshot(createSeedSnapshot(), "admin@demo.motobill", "otra"),
      DomainError,
    );
  });

  it("convierte una cotización a factura una sola vez", () => {
    const first = convertQuoteToInvoice(createSeedSnapshot(), "cot_1");
    assert.equal(first.invoices[0]?.quoteId, "cot_1");
    assert.equal(first.quotes.find((item) => item.id === "cot_1")?.status, "convertida");
    assert.throws(() => convertQuoteToInvoice(first, "cot_1"), DomainError);
  });

  it("exige hora de fin posterior al inicio en citas", () => {
    const seed = createSeedSnapshot();
    assert.throws(
      () =>
        upsertAppointment(seed, {
          customerId: "cus_1",
          motorcycleId: "moto_1",
          startsAt: "2026-10-20T12:00:00.000Z",
          endsAt: "2026-10-20T11:00:00.000Z",
          serviceType: "Revisión",
          notes: "",
          status: "programada",
          reminderSentAt: "",
        }),
      DomainError,
    );
  });

  it("impide dejar el taller sin administrador activo", () => {
    const seed = createSeedSnapshot();
    const admin = seed.users.find((item) => item.id === "user_admin");
    assert.ok(admin);
    assert.throws(
      () =>
        upsertUser(seed, {
          id: admin.id,
          fullName: admin.fullName,
          email: admin.email,
          password: "",
          role: "cashier",
          active: true,
        }),
      DomainError,
    );
  });
});
