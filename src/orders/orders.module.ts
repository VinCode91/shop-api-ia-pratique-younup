import { Module } from '@nestjs/common'
import { OrdersController } from './orders.controller'
import { OrdersService } from './orders.service'
import { ProductsModule } from '../products/products.module'
import { PrismaService } from '../common/prisma/prisma.service'

@Module({
  imports: [ProductsModule],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
})
export class OrdersModule {}
