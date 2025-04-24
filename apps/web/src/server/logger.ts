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
import pino from 'pino';

// create pino logger
const getLogger = (name: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const transport = pino.transport({
    targets: [
      // 파일 출력
      {
        target: 'pino/file',
        level: 'info',
        options: {
          destination: `${process.cwd()}/logs/app.log`,
          mkdir: true,         // logs 디렉토리 자동 생성
          sync: true,
          append: true,
        },
      },
    ],
  });

  return pino({
    name,
    base: { env: process.env.NODE_ENV },
    enabled: true,
    level: 'info',
    formatters: {
      level: (label: string) => {
        return { level: label };
      },
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  }, transport);

}

export default getLogger;
