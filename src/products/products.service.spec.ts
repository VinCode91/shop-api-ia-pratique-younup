import { Test, TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductsService } from "./products.service";

describe("ProductsService", () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ProductsService,
          useFactory: (prismaService: PrismaService) =>
            new ProductsService(prismaService),
          inject: [PrismaService],
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it("findAll() retourne la liste des produits", async () => {
    const products = [
      { id: "product-1", name: "Clavier", price: 50, stock: 4 },
      { id: "product-2", name: "Souris", price: 25, stock: 8 },
    ];
    prisma.product.findMany.mockResolvedValue(products);

    await expect(service.findAll()).resolves.toEqual(products);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("findOne() retourne le produit trouvé", async () => {
    const product = { id: "product-1", name: "Clavier", price: 50, stock: 4 };
    prisma.product.findUnique.mockResolvedValue(product);

    await expect(service.findOne(product.id)).resolves.toEqual(product);
    expect(prisma.product.findUnique).toHaveBeenCalledWith({
      where: { id: product.id },
    });
  });

  it("findOne() lève une erreur si le produit n'est pas trouvé", async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.findOne("unknown-product")).rejects.toThrow(
      "Produit unknown-product introuvable",
    );
  });

  it("create() crée et retourne le produit", async () => {
    const dto: CreateProductDto = {
      name: "Clavier",
      price: 50,
      stock: 4,
    };
    const product = { id: "product-1", ...dto };
    prisma.product.create.mockResolvedValue(product);

    await expect(service.create(dto)).resolves.toEqual(product);
    expect(prisma.product.create).toHaveBeenCalledWith({ data: dto });
  });

  it("updateStock() décrémente correctement le stock", async () => {
    const product = { id: "product-1", name: "Clavier", price: 50, stock: 4 };
    const updatedProduct = { ...product, stock: 2 };
    prisma.product.findUnique.mockResolvedValue(product);
    prisma.product.update.mockResolvedValue(updatedProduct);

    await expect(service.updateStock(product.id, -2)).resolves.toEqual(
      updatedProduct,
    );
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: product.id },
      data: { stock: 2 },
    });
  });

  it("updateStock() transmet un stock négatif lorsque le stock devient inférieur à 0", async () => {
    const product = { id: "product-1", name: "Clavier", price: 50, stock: 1 };
    const updatedProduct = { ...product, stock: -1 };
    prisma.product.findUnique.mockResolvedValue(product);
    prisma.product.update.mockResolvedValue(updatedProduct);

    await expect(service.updateStock(product.id, -2)).resolves.toEqual(
      updatedProduct,
    );
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: product.id },
      data: { stock: -1 },
    });
  });
});