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
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import type { CreateHistoryDto } from './create-history.dto';
import { HistoryEntity } from './history.entity';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}
  async createHistory(dto: CreateHistoryDto) {
    try {
      if (!dto.entityId) return;
      const { userId, ...rest } = dto;
      const entityId = dto.entityId;

      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(HistoryEntity);
        const history = HistoryEntity.from({ userId, entityId, ...rest });
        await repo.insert(history);
      });
    } catch (error) {
      this.logger.error(error);
      this.logger.error(dto);
    }
  }
}
