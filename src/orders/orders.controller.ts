import { Controller, Get, Post, Param, Body } from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { AddItemDto } from './dto/add-item.dto'

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll() {
    return this.ordersService.getOrders()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.getOrderById(id)
  }

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto)
  }

  @Post(':id/items')
  addItem(@Param('id') id: string, @Body() dto: AddItemDto) {
    return this.ordersService.addItem(id, dto)
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.ordersService.confirmOrder(id)
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id)
  }
}
