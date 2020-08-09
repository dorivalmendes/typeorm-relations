import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsToFind = products.map(product => product.id);

    const productsFound = await this.ormRepository.find({
      id: In(productsToFind),
    });

    if (productsToFind.length !== productsFound.length) {
      throw new AppError('One or more products were not found');
    }

    return productsFound;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsToUpdate = await this.findAllById(products);

    const productsUpdated = productsToUpdate.map(productToUpdate => {
      const productFound = products.find(
        product => product.id === productToUpdate.id,
      );

      if (!productFound) {
        throw new AppError('Product not found');
      }

      if (productFound.quantity >= productToUpdate.quantity) {
        throw new AppError('Quantity of product in stock is insufficient');
      }

      const productUpdated = productToUpdate;

      productUpdated.quantity -= productFound.quantity;

      return productUpdated;
    });

    await this.ormRepository.save(productsUpdated);

    return productsUpdated;
  }
}

export default ProductsRepository;
