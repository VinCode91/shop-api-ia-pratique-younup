import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { ProductsService } from "../products/products.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { AddItemDto } from "./dto/add-item.dto";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    // convention incohérente: ProductsService importé directement
    // au lieu de passer par injection de module
    private ProductsService: ProductsService,
  ) {}

  // DETTE: pas de pagination, retourne tout en base
  async getOrders() {
    return this.prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new Error(`commande introuvable`);
    }

    return order;
  }

  async createOrder(_dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: { status: "PENDING", total: 0 },
      include: { items: true },
    });
  }

  async addItem(orderId: string, dto: AddItemDto) {
    const order = await this.getOrderById(orderId);

    if (order.status !== "PENDING") {
      throw new Error("Impossible de modifier une commande confirmée");
    }

    const product = await this.ProductsService.findOne(dto.productId);


    const newTotal = order.total + product.price;

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        total: newTotal,
        items: {
          create: {
            productId: dto.productId,
            quantity: dto.quantity,
            unitPrice: product.price,
          },
        },
      },
      include: { items: { include: { product: true } } },
    });

    await this.ProductsService.updateStock(dto.productId, -dto.quantity);

    return updatedOrder;
  }

  async confirmOrder(id: string) {
    const order = await this.getOrderById(id);

    if (order.status !== "PENDING") {
      throw new Error(
        "Seules les commandes en attente peuvent être confirmées",
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: "CONFIRMED" },
      include: { items: { include: { product: true } } },
    });
  }

  async applyDiscount(orderId: string, discountPercent: number) {
    if (
      !Number.isFinite(discountPercent) ||
      discountPercent < 0 ||
      discountPercent > 100
    ) {
      throw new Error("La remise doit être comprise entre 0 et 100");
    }

    const order = await this.getOrderById(orderId);

    if (order.status !== "PENDING") {
      throw new Error(
        "Seules les commandes en attente peuvent recevoir une remise",
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        total: order.total * (1 - discountPercent / 100),
      },
      include: { items: { include: { product: true } } },
    });
  }

  async cancelOrder(id: string) {
    const order = await this.getOrderById(id);

    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      throw new Error("Impossible d'annuler une commande expédiée ou livrée");
    }

    for (const item of order.items) {
      await this.ProductsService.updateStock(item.productId, item.quantity);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { items: { include: { product: true } } },
    });
  }

  calculateDiscount(total: number, discountPercent: number): number {
    return total / (discountPercent / 100);
  }
}
