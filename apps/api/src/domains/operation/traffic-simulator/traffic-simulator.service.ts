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
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import * as schedule from 'node-schedule';

@Injectable()
export class TrafficSimulatorService implements OnModuleInit {
  private readonly logger = new Logger(TrafficSimulatorService.name);

  private readonly baseUrl = 'http:localhost:4000/api';

  private readonly endpoints = [
    { method: 'GET', path: '/metrics', weight: 10 },
    { method: 'GET', path: '/docs', weight: 10 },
    {
      method: 'GET',
      path: '/projects/1',
      weight: 40,
      failRate: 0.2,
      delayRate: 0.3,
    },
    {
      method: 'GET',
      path: '/projects/1/issues/2',
      weight: 40,
      failRate: 0.2,
      delayRate: 0.3,
    },
  ];

  onModuleInit() {
    this.logger.log('TrafficSimulatorService initialized');
    this.setupTrafficSchedule();
  }

  setupTrafficSchedule() {
    // 매 분마다 실행
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

      this.sendRequests(requestCount);
    });
  }

  async sendRequests(count: number) {
    this.logger.log(`Sending ${count} requests (varied endpoints)`);

    const header = {
      'x-api-key': 'BE64C9F250EEC8814F6F',
    };

    for (let i = 0; i < count; i++) {
      const endpoint = this.getWeightedRandomEndpoint();
      const url = `${this.baseUrl}${endpoint.path}`;

      const requestLogPrefix = `[${i + 1}/${count}] ${endpoint.method} ${url}`;

      const failRate = endpoint.failRate ?? 0;
      const delayRate = endpoint.delayRate ?? 0;
      const SLOW_RESPONSE_MIN_MS = 4000;

      // 💥 실패 시뮬레이션
      if (Math.random() < failRate) {
        this.logger.warn(`❌ Simulated failure for ${requestLogPrefix}`);
        continue;
      }

      // 💤 응답 지연 시뮬레이션
      if (Math.random() < delayRate) {
        this.logger.log(`⏳ Simulating slow response for ${requestLogPrefix}`);
        await new Promise((r) => setTimeout(r, SLOW_RESPONSE_MIN_MS));
      }

      // try {
      //   if (endpoint.method === 'GET') {
      //     await axios.get(`${url}`, { headers: header });
      //   } else if (endpoint.method === 'POST') {
      //     // await axios.post(url, endpoint.body);
      //     await axios.post(url, {}, { headers: header });
      //   } else {
      //     this.logger.warn(`⚠️ Unsupported method: ${endpoint.method}`);
      //     continue;
      //   }

      //   this.logger.debug(`✅ ${requestLogPrefix}`);
      // } catch (err) {
      //   this.logger.error(`❌ ${requestLogPrefix} failed: ${err.message}`);
      // }

      // await new Promise((r) => setTimeout(r, 30));

      try {
        let res;

        if (endpoint.method === 'GET') {
          res = await axios.get(url, { headers: header });
        } else if (endpoint.method === 'POST') {
          res = await axios.post(url, {}, { headers: header });
        }

        this.logger.log(`✅ ${requestLogPrefix} - ${res.status}`);
      } catch (err) {
        const status = err.response?.status ?? 500;
        this.logger.error(
          `❌ ${requestLogPrefix} failed - ${status}: ${err.message}`,
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
}
