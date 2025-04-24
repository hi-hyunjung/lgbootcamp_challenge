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
import { performance } from 'perf_hooks';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios, { AxiosError, AxiosResponse } from 'axios';
import schedule from 'node-schedule';

import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class TrafficSimulatorService implements OnModuleInit {
  private readonly logger = new Logger(TrafficSimulatorService.name);

  constructor(private readonly metricsService: MetricsService) {}

  private readonly baseUrl = 'https://koordinate.xyz/api';
  // private readonly baseUrl = 'http://localhost:4000/api';

  private readonly endpoints = [
    {
      method: 'GET',
      path: '/projects/1',
      weight: 30,
      failRate: 0.2,
      delayRate: 0.3,
    },
    {
      method: 'GET',
      path: '/projects/1/issues/2',
      weight: 30,
      failRate: 0.2,
      delayRate: 0.3,
    },
    {
      method: 'GET',
      path: '/projects/1/issues/{issueId}',
      weight: 10,
      failRate: 0,
      delayRate: 0,
    },
    {
      method: 'PUT',
      path: '/projects/1/categories/2',
      weight: 10,
      failRate: 0,
      delayRate: 0,
      body: {
        name: 'modified_category' + String(Math.floor(Math.random() * 10)),
      },
    },
    {
      method: 'POST',
      path: '/projects/1/issues/search',
      weight: 20,
      failRate: 0.1,
      delayRate: 0.1,
      body: {
        limit: 10,
        page: 1,
        query: {
          name: 'issue name',
        },
        sort: {
          createdAt: 'ASC',
        },
      },
    },
  ];

  onModuleInit() {
    this.logger.log('TrafficSimulatorService initialized');
    this.setupTrafficSchedule();
  }

  setupTrafficSchedule() {
    // 매 분마다 실행
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    schedule.scheduleJob('* * * * *', () => {
      const now = new Date();
      const hour = now.getHours();

      let requestCount = 10;

      if (hour >= 9 && hour < 11) {
        requestCount = 50 + Math.floor(Math.random() * 50); // 증가
      } else if (hour >= 12 && hour < 13) {
        requestCount = 5 + Math.floor(Math.random() * 5); // 감소
      } else if (hour === 15) {
        requestCount = 100 + Math.floor(Math.random() * 50); // 폭증
      } else {
        requestCount = 10 + Math.floor(Math.random() * 10); // 기본
      }

      void this.sendRequests(requestCount);
    });
  }

  async sendRequests(count: number) {
    this.logger.log(`Sending ${count} requests (varied endpoints)`);

    const header = {
      'x-api-key': `${process.env.MASTER_API_KEY}`,
      'x-simulated': 'true',
    };

    for (let i = 0; i < count; i++) {
      const endpoint = this.getWeightedRandomEndpoint();
      const interpolatedPath = this.interpolatePath(endpoint.path);
      const url = `${this.baseUrl}${interpolatedPath}`;

      const requestLogPrefix = `[${i + 1}/${count}] ${endpoint.method} ${url}`;

      const SLOW_RESPONSE_MIN_MS = 4000;

      const start = performance.now();

      // 💥 실패 시뮬레이션
      if (Math.random() < endpoint.failRate) {
        this.logger.warn(`❌ Simulated failure for ${requestLogPrefix}`);

        const duration = (performance.now() - start) / 1000;
        this.metricsService.recordRequest(
          endpoint.method,
          interpolatedPath,
          '500',
          duration,
        );

        continue;
      }

      // 💤 응답 지연 시뮬레이션
      if (Math.random() < endpoint.delayRate) {
        this.logger.log(`⏳ Simulating slow response for ${requestLogPrefix}`);
        await new Promise((r) => setTimeout(r, SLOW_RESPONSE_MIN_MS));
      }

      try {
        let res: AxiosResponse;

        if (endpoint.method === 'GET') {
          res = await axios.get(url, { headers: header });
        } else if (endpoint.method === 'POST') {
          res = await axios.post(url, {}, { headers: header });
        } else {
          throw new Error('Unsupported HTTP method');
        }

        const duration = (performance.now() - start) / 1000;
        this.metricsService.recordRequest(
          endpoint.method,
          interpolatedPath,
          String(res.status),
          duration,
        );

        this.logger.log(`✅ ${requestLogPrefix} - ${res.status}`);
      } catch (err) {
        const error = err as AxiosError;

        const statusCode = error.response?.status ?? 500;
        const duration = (performance.now() - start) / 1000;

        this.metricsService.recordRequest(
          endpoint.method,
          interpolatedPath,
          String(statusCode),
          duration,
        );

        this.logger.error(
          `❌ ${requestLogPrefix} failed - ${error.status}: ${error.message}`,
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  private getWeightedRandomEndpoint() {
    const totalWeight = this.endpoints.reduce((sum, e) => sum + e.weight, 0);
    const random = Math.random() * totalWeight;

    let runningWeight = 0;
    for (const endpoint of this.endpoints) {
      runningWeight += endpoint.weight;
      if (random < runningWeight) return endpoint;
    }

    return this.endpoints[this.endpoints.length - 1]; // fallback
  }

  private interpolatePath(path: string): string {
    return path.replace(
      '{issueId}',
      (Math.floor(Math.random() * 100) + 1).toString(),
    ); // 1~100
  }
}
