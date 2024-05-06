import { Injectable } from '@nestjs/common';

import { v4 } from 'uuid';
import { Client } from 'pg';

import { Cart } from '../models';

const { PG_HOST, PG_PORT, PG_DATABASE, PG_USERNAME, PG_PASSWORD } = process.env;
const dbOptions = {
  host: PG_HOST,
  port: PG_PORT,
  database: PG_DATABASE,
  user: PG_USERNAME,
  password: PG_PASSWORD,
  ssl: {
    rejectUnauthorized: false, // to avoid warrning
  },
  connectionTimeoutMillis: 5000
};

@Injectable()
export class CartService {
  async findByUserId(userId: string): Promise<Cart> {
    const client = new Client(dbOptions);
    await client.connect();

    try {
      const { rows } = await client.query(`
        SELECT ci.product_id
        FROM carts c
        JOIN cart_items ci ON c.id = ci.cart_id
        WHERE c.user_id = '${userId}';
      `);
      console.log('all carts: ', rows);

      return {
        id: rows[0].id,
        items: rows.map(row => ({
          count: row.count,
          product: {
            id: row.product_id
          },
        })),
      }
    } catch (error) {
      console.log(error);
    } finally {
      client.end();
    }
  }

  async createByUserId(userId: string): Promise<Cart> {
    const client = new Client(dbOptions);
    await client.connect();

    const id = v4(v4());
    const currentDate = new Date().toISOString().slice(0, 10);

    try {
      const { rows } = await client.query(`
      INSERT INTO carts (user_id, created_at, updated_at, status)
      VALUES
      ('${userId}', ${currentDate}, ${currentDate}, 'OPEN');
      `);

      return {
        id,
        items: [],
      }
    } catch (error) {
      console.log(error);
    } finally {
      client.end();
    }
  }

  async findOrCreateByUserId(userId: string): Promise<Cart> {
    const userCart = await this.findByUserId(userId);

    if (userCart) {
      return userCart;
    }

    return this.createByUserId(userId);
  }

  async updateByUserId(userId: string, { items }: Cart): Promise<Cart> {
    const client = new Client(dbOptions);
    await client.connect();

    try {
      const { id, ...rest } = await this.findOrCreateByUserId(userId);

      const updatedCart = {
        id,
        ...rest,
        items: [ ...items ],
      }

      await Promise.all(items.map(item => client.query(`
        INSERT INTO cart_items (cart_id, product_id, count)
        VALUES
        (${id}, ${item.product.id}, ${item.count})
      `)));

      return { ...updatedCart };
    } catch (error) {
      console.log(error);
    } finally {
      client.end();
    }
  }

  async removeByUserId(userId): Promise<void> {
    const client = new Client(dbOptions);
    await client.connect();

    try {
      await client.query(`
        DELETE FROM carts WHERE user_id = ${userId}
      `);
    } catch (error) {
      console.log(error);
    } finally {
      client.end();
    }
  }

}
