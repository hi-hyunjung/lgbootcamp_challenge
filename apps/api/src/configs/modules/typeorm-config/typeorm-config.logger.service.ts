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
import type { PoolConnection } from 'mysql2';
import { QueryRunner, Logger as TypeOrmLogger } from 'typeorm';

// import {Logger} from ''

@Injectable()
export class TypeOrmCustomLogger implements TypeOrmLogger {
  private logger = new Logger('TypeORM');

  logQuery(
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner,
  ): void {
    const context: Record<string, unknown> | undefined =
      _queryRunner ? this.extractContextFromRunner(_queryRunner) : {};

    this.logger.debug(
      {
        type: 'query',
        query,
        parameters,
        timestamp: new Date().toISOString(),
        context: context,
      },
      'TypeORM Query',
    );
  }

  logQueryError(
    error: string,
    query: string,
    parameters?: any[],
    _queryRunner?: QueryRunner,
  ) {
    this.logger.error(
      {
        type: 'query_error',
        error,
        query,
        parameters,
        timestamp: new Date().toISOString(),
      },
      'TypeORM Query Error',
    );
  }

  logQuerySlow(time: number, query: string, parameters?: any[], _queryRunner?: QueryRunner): void {
    const context: Record<string, unknown> | undefined =
        _queryRunner ? this.extractContextFromRunner(_queryRunner) : {};
    this.logger.warn(
      {
        type: 'slow_query',
        timestamp: new Date().toISOString(),
        typeorm: {
          duration: time,
          query,
          parameters,
          context: context,
        },
      },
      'TypeORM Slow Query',
    );
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner) {
    this.logger.debug(
      {
        type: 'schema_build',
        message,
        timestamp: new Date().toISOString(),
      },
      'TypeORM Schema Build',
    );
  }

  logMigration(message: string, _queryRunner?: QueryRunner) {
    this.logger.log(
      {
        type: 'migration',
        message,
        timestamp: new Date().toISOString(),
      },
      'TypeORM Migration',
    );
  }

  log(
    level: 'log' | 'warn' | 'info',
    message: string | number | Record<string, unknown>,
    _queryRunner?: QueryRunner,
  ) {
    const context: Record<string, unknown> | undefined =
        _queryRunner ? this.extractContextFromRunner(_queryRunner) : {};
    if (level === 'info' || level === 'log') {
      this.logger.log(
        {
          type: 'general',
          message,
          timestamp: new Date().toISOString(),
          context: context,
        },
        'TypeORM General Log',
      );
    } else {
      this.logger.warn(
        {
          type: 'general',
          message,
          timestamp: new Date().toISOString(),
          context: context,
        },
        'TypeORM General Log',
      );
    }
  }

  private extractContextFromRunner(queryRunner: QueryRunner) {

    const runner = queryRunner as unknown as {
      databaseConnectionPromise?: Promise<PoolConnection>;
    };

    const conn = runner.databaseConnectionPromise;

    if (!conn) return;

    const symbols = Object.getOwnPropertySymbols(conn);
    const kStore = symbols.find(
      (s) => s.toString() === 'Symbol(kResourceStore)',
    );

   return kStore ? (conn[kStore] as Record<string, unknown>) : {};
  }
}
