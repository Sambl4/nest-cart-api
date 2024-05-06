import { Injectable } from '@nestjs/common';

import { v4 } from 'uuid';

import { User } from '../models';

@Injectable()
export class UsersService {
  private readonly users: Record<string, User>;

  constructor() {
    this.users = {
      'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11': {
        id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'testUser1',
        password: '111111',
      }
      // TODO: add users
      // b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a12
      // b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a13
    }
  }

  findOne(userId: string): User {
    return this.users[ userId ];
  }

  createOne({ name, password }: User): User {
    const id = v4(v4());
    const newUser = { id: name || id, name, password };

    this.users[ id ] = newUser;

    return newUser;
  }

}
