import { Controller, Get, Post, HttpStatus, Res, Query, Param } from '@nestjs/common';
const listServices = require("../services/list");

@Controller()
export class UsersController {
    @Get('search')
    async search(@Res() res, @Query() query) {
      const [list, rows] = await listServices.search(query)
      res.status(HttpStatus.OK).json({
        list,
        totals: rows
      })
    }
    @Get('category/:category')
    async category(@Res() res, @Param("category") category) {
      const [list, rows] = await listServices.getListbyCategory(category)
      res.status(HttpStatus.OK).json({
        list,
        totals: rows
      })
    }
    @Get('author/:author')
    async author(@Res() res, @Param("author") author) {
      const [list, rows] = await listServices.getListbyAuthor(author)
      res.status(HttpStatus.OK).json({
        list,
        totals: rows
      })
    }

    @Get('users/:id')
    getUser() {}

    @Post('users')
    addUser() {}
}