import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaService } from "../common/prisma/prisma.service";
import { ProductsService } from "../products/products.service";
import { OrdersService } from "./orders.service";

describe("OrdersService.applyDiscount", () => {
  let service: OrdersService;
  let prisma: {
    order: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prisma = {
      order: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    service = new OrdersService(
      prisma as unknown as PrismaService,
      {} as ProductsService,
    );
  });

  it("applique la remise au total d'une commande en attente", async () => {
    const order = { id: "order-1", status: "PENDING", total: 100, items: [] };
    const updatedOrder = { ...order, total: 75 };
    prisma.order.findUnique.mockResolvedValue(order);
    prisma.order.update.mockResolvedValue(updatedOrder);

    await expect(service.applyDiscount(order.id, 25)).resolves.toEqual(
      updatedOrder,
    );
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: order.id },
      data: { total: 75 },
      include: { items: { include: { product: true } } },
    });
  });

  it.each([-1, 101, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejette une remise invalide: %s",
    async (discountPercent) => {
      await expect(
        service.applyDiscount("order-1", discountPercent),
      ).rejects.toThrow("La remise doit être comprise entre 0 et 100");
      expect(prisma.order.findUnique).not.toHaveBeenCalled();
    },
  );

  it("rejette une commande qui n'est pas en attente", async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: "order-1",
      status: "CONFIRMED",
      total: 100,
      items: [],
    });

    await expect(service.applyDiscount("order-1", 25)).rejects.toThrow(
      "Seules les commandes en attente peuvent recevoir une remise",
    );
    expect(prisma.order.update).not.toHaveBeenCalled();
  });
});