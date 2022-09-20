import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { PaginationDto } from '../common/dtos/pagination.dto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRespository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      const product = this.productRespository.create(createProductDto);

      await this.productRespository.save(product);

      return product;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;

    return await this.productRespository.find({
      take: limit,
      skip: offset,
      // TODO: relaciones
    });
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {
      product = await this.productRespository.findOneBy({ id: term });
    } else {
      // product = await this.productRespository.findOneBy({ slug: term });
      const queryBuilder = this.productRespository.createQueryBuilder();
      product = await queryBuilder
        .where('LOWER(title) =:title or slug =:slug', {
          title: term.toLowerCase(),
          slug: term.toLocaleLowerCase(),
        })
        .getOne();
    }

    if (!product) throw new NotFoundException(`Product with ${term} not found`);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productRespository.preload({
      id,
      ...updateProductDto,
    });

    if (!product)
      throw new NotFoundException(`Product with id ${id} not found`);

    try {
      await this.productRespository.save(product);
    } catch (error) {
      this.handleDBExceptions(error);
    }
    return product;
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRespository.remove(product);
  }

  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    this.logger.error(error);
    throw new InternalServerErrorException('Unexpected error, check log');
  }
}
