import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'
import { GoogleTablesService } from './google-tables.service'

@Controller('google-tables')
export class GoogleTablesController {
    constructor(private readonly googleTablesService: GoogleTablesService) {}
}
