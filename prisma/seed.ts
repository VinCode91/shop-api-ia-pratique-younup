import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()

  const laptop = await prisma.product.create({
    data: {
      name: 'Laptop Pro 15',
      description: 'Ordinateur portable haute performance',
      price: 1299.99,
      stock: 10,
    },
  })

  const mouse = await prisma.product.create({
    data: {
      name: 'Souris ergonomique',
      description: 'Souris sans fil ergonomique',
      price: 49.99,
      stock: 50,
    },
  })

  const keyboard = await prisma.product.create({
    data: {
      name: 'Clavier mécanique',
      description: 'Clavier mécanique rétroéclairé',
      price: 129.99,
      stock: 25,
    },
  })

  const monitor = await prisma.product.create({
    data: {
      name: 'Écran 27 pouces 4K',
      description: 'Écran IPS 4K 144Hz',
      price: 599.99,
      stock: 0, // rupture de stock intentionnelle
    },
  })

  // Commande avec bug de total intentionnel (quantity > 1)
  await prisma.order.create({
    data: {
      status: 'CONFIRMED',
      total: 49.99, // BUG: devrait être 99.98 (2 * 49.99)
      items: {
        create: [
          {
            productId: mouse.id,
            quantity: 2,
            unitPrice: 49.99,
          },
        ],
      },
    },
  })

  // Commande normale
  await prisma.order.create({
    data: {
      status: 'PENDING',
      total: 1299.99,
      items: {
        create: [
          {
            productId: laptop.id,
            quantity: 1,
            unitPrice: 1299.99,
          },
        ],
      },
    },
  })

  console.log('Seed terminé')
  console.log(`Produits : ${laptop.name}, ${mouse.name}, ${keyboard.name}, ${monitor.name}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
