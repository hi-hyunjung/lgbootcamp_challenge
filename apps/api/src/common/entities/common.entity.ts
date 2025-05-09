/**
 * Copyright 2025 LY Corporation
 *
 * LY Corporation licenses this file to you under the Apache License,
 * version 2.0 (the "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at:
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 */
import { DateTime } from 'luxon';
import {
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class CommonEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @BeforeInsert()
  beforeInsertHook() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!this.createdAt) {
      this.createdAt = DateTime.utc().toJSDate();
    }
    this.updatedAt = DateTime.utc().toJSDate();
  }

  @BeforeUpdate()
  beforeUpdateHook() {
    this.updatedAt = DateTime.utc().toJSDate();
  }
}
