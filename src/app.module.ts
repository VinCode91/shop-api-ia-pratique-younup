import { Module } from '@nestjs/common'
import { ProductsModule } from './products/products.module'
import { OrdersModule } from './orders/orders.module'
import { PrismaService } from './common/prisma/prisma.service'

@Module({
  imports: [ProductsModule, OrdersModule],
  providers: [PrismaService],
})
export class AppModule {}
