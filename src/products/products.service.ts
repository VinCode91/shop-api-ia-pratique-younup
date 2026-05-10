import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    // DETTE: lève Error générique au lieu de NotFoundException
    if (!product) {
      throw new Error(`Produit ${id} introuvable`);
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }

  // DETTE: ne vérifie pas si le stock descend en dessous de 0
  async updateStock(id: string, delta: number) {
    const product = await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { stock: product.stock + delta },
    });
  }

  async findInStock() {
    return this.prisma.product.findMany({
      where: { stock: { gt: 0 } },
    });
  }
}
