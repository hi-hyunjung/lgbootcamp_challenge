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

import path from 'path';
const isProd = process.env.NODE_ENV === 'production';
const isServer = typeof window === 'undefined';
const basePath = isProd ? '/lgweb' : '';

/** @type {import('next-i18next').UserConfig} */
const i18nConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh', 'de', 'ja', 'ko'],
  },
  fallbackLng: {
    default: ['en'],
  },
  nonExplicitSupportedLngs: true,
  serializeConfig: false,

    localePath: path.resolve('./public/locales'), // 서버에서는 파일 시스템 사용

    ...(isServer
        ? {
            backend: {
                loadPath: path.resolve('./public/locales/{{lng}}/{{ns}}.json'),
            },
        }
        : {
            backend: {
                loadPath: `${basePath}/locales/{{lng}}/{{ns}}.json`,
            },
        }),
};

export default i18nConfig;
