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
import { faker } from '@faker-js/faker';
import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClsModule, ClsService } from 'nestjs-cls';
import type { Repository, SelectQueryBuilder } from 'typeorm';

import {
  FieldFormatEnum,
  FieldPropertyEnum,
  FieldStatusEnum,
} from '@/common/enums';
import { createFieldDto, feedbackDataFixture } from '@/test-utils/fixtures';
import type { ChannelRepositoryStub } from '@/test-utils/stubs';
import { createQueryBuilder, TestConfig } from '@/test-utils/util-functions';
import { FeedbackServiceProviders } from '../../../test-utils/providers/feedback.service.providers';
import { ChannelEntity } from '../channel/channel/channel.entity';
import { RESERVED_FIELD_KEYS } from '../channel/field/field.constants';
import { FieldEntity } from '../channel/field/field.entity';
import { IssueEntity } from '../project/issue/issue.entity';
import { FeedbackIssueStatisticsEntity } from '../statistics/feedback-issue/feedback-issue-statistics.entity';
import { FeedbackStatisticsEntity } from '../statistics/feedback/feedback-statistics.entity';
import { IssueStatisticsEntity } from '../statistics/issue/issue-statistics.entity';
import { CreateFeedbackDto } from './dtos';
import { FeedbackService } from './feedback.service';

describe('FeedbackService Test Suite', () => {
  let feedbackService: FeedbackService;
  let clsService: ClsService;
  let fieldRepo: Repository<FieldEntity>;
  let issueRepo: Repository<IssueEntity>;
  let channelRepo: ChannelRepositoryStub;
  let feedbackStatsRepo: Repository<FeedbackStatisticsEntity>;
  let issueStatsRepo: Repository<IssueStatisticsEntity>;
  let feedbackIssueStatsRepo: Repository<FeedbackIssueStatisticsEntity>;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [TestConfig, ClsModule.forFeature()],
      providers: FeedbackServiceProviders,
    }).compile();

    feedbackService = module.get<FeedbackService>(FeedbackService);
    clsService = module.get<ClsService>(ClsService);
    fieldRepo = module.get(getRepositoryToken(FieldEntity));
    issueRepo = module.get(getRepositoryToken(IssueEntity));
    channelRepo = module.get(getRepositoryToken(ChannelEntity));
    feedbackStatsRepo = module.get(
      getRepositoryToken(FeedbackStatisticsEntity),
    );
    issueStatsRepo = module.get(getRepositoryToken(IssueStatisticsEntity));
    feedbackIssueStatsRepo = module.get(
      getRepositoryToken(FeedbackIssueStatisticsEntity),
    );
  });

  describe('create', () => {
    beforeEach(() => {
      channelRepo.setImageConfig({
        domainWhiteList: ['example.com'],
      });
    });
    it('creating a feedback succeeds with valid inputs', async () => {
      const dto = new CreateFeedbackDto();
      dto.channelId = faker.number.int();
      dto.data = JSON.parse(JSON.stringify(feedbackDataFixture)) as object;
      jest
        .spyOn(feedbackStatsRepo, 'findOne')
        .mockResolvedValue({ count: 1 } as FeedbackStatisticsEntity);

      const feedback = await feedbackService.create(dto);

      expect(feedback.id).toBeDefined();
    });
    it('creating a feedback fails with an invalid channel', async () => {
      const dto = new CreateFeedbackDto();
      dto.channelId = faker.number.int();
      dto.data = JSON.parse(JSON.stringify(feedbackDataFixture)) as object;
      jest.spyOn(fieldRepo, 'find').mockResolvedValue([]);

      await expect(feedbackService.create(dto)).rejects.toThrow(
        new BadRequestException('invalid channel'),
      );
    });
    it('creating a feedback fails with a reserved field key', async () => {
      const dto = new CreateFeedbackDto();
      dto.channelId = faker.number.int();
      dto.data = JSON.parse(JSON.stringify(feedbackDataFixture)) as object;
      const reservedFieldKey = faker.helpers.arrayElement(
        RESERVED_FIELD_KEYS.filter((key) => key !== 'createdAt'),
      );
      dto.data[reservedFieldKey] = faker.string.sample();

      await expect(feedbackService.create(dto)).rejects.toThrow(
        new BadRequestException(
          'reserved field key is unavailable: ' + reservedFieldKey,
        ),
      );
    });
    it('creating a feedback fails with an invalid field key', async () => {
      const dto = new CreateFeedbackDto();
      dto.channelId = faker.number.int();
      dto.data = JSON.parse(JSON.stringify(feedbackDataFixture)) as object;
      const invalidFieldKey = 'invalidFieldKey';
      dto.data[invalidFieldKey] = faker.string.sample();

      await expect(feedbackService.create(dto)).rejects.toThrow(
        new BadRequestException('invalid field key: ' + invalidFieldKey),
      );
    });
    it('creating a feedback fails with an invalid value for a field format', async () => {
      const formats = [
        {
          format: FieldFormatEnum.text,
          invalidValues: [123, true, {}, [], new Date()],
        },
        {
          format: FieldFormatEnum.keyword,
          invalidValues: [123, true, {}, [], new Date()],
        },
        {
          format: FieldFormatEnum.number,
          invalidValues: ['not a number', true, {}, [], new Date()],
        },
        {
          format: FieldFormatEnum.select,
          invalidValues: [['option1', 'option2'], 123, true, {}, new Date()],
        },
        {
          format: FieldFormatEnum.multiSelect,
          invalidValues: ['option1', 123, true, {}, new Date(), [{}]],
        },
        {
          format: FieldFormatEnum.date,
          invalidValues: ['not a date', 123, true, {}, []],
        },
        {
          format: FieldFormatEnum.images,
          invalidValues: ['not images', 123, true, {}, new Date()],
        },
      ];
      for (const { format, invalidValues } of formats) {
        for (const invalidValue of invalidValues) {
          const field = createFieldDto({
            format,
            property: FieldPropertyEnum.EDITABLE,
            status: FieldStatusEnum.ACTIVE,
          });
          const dto = new CreateFeedbackDto();
          dto.channelId = faker.number.int();
          dto.data = {
            [field.key]: invalidValue,
          };
          const spy = jest
            .spyOn(fieldRepo, 'find')
            .mockResolvedValue([field] as FieldEntity[]);

          await expect(feedbackService.create(dto)).rejects.toThrow(
            new BadRequestException(
              `invalid value: (value: ${JSON.stringify(
                dto.data[field.key],
              )}, type: ${field.format}, fieldKey: ${field.key})`,
            ),
          );

          spy.mockClear();
        }
      }
    });
    it('creating a feedback succeeds with valid inputs and issue names', async () => {
      const dto = new CreateFeedbackDto();
      dto.channelId = faker.number.int();
      dto.data = JSON.parse(JSON.stringify(feedbackDataFixture)) as object;
      const issueNames = Array.from({
        length: faker.number.int({ min: 1, max: 1 }),
      }).map(() => faker.string.sample());
      dto.data.issueNames = [...issueNames, faker.string.sample()];
      jest.spyOn(issueRepo, 'findOneBy').mockResolvedValue(null);
      jest
        .spyOn(feedbackStatsRepo, 'findOne')
        .mockResolvedValue({ count: 1 } as FeedbackStatisticsEntity);
      jest
        .spyOn(issueStatsRepo, 'createQueryBuilder')
        .mockImplementation(
          () =>
            createQueryBuilder as unknown as SelectQueryBuilder<IssueStatisticsEntity>,
        );
      jest
        .spyOn(feedbackIssueStatsRepo, 'createQueryBuilder')
        .mockImplementation(
          () =>
            createQueryBuilder as unknown as SelectQueryBuilder<FeedbackIssueStatisticsEntity>,
        );
      clsService.set = jest.fn();

      const feedback = await feedbackService.create(dto);

      expect(feedback.id).toBeDefined();
    });
    it('creating a feedback succeeds with valid inputs and an existent issue name', async () => {
      const dto = new CreateFeedbackDto();
      dto.channelId = faker.number.int();
      dto.data = JSON.parse(JSON.stringify(feedbackDataFixture)) as object;
      const issueNames = Array.from({
        length: faker.number.int({ min: 1, max: 1 }),
      }).map(() => faker.string.sample());
      dto.data.issueNames = [...issueNames];
      jest.spyOn(issueRepo, 'findOneBy').mockResolvedValue(null);
      jest
        .spyOn(feedbackStatsRepo, 'findOne')
        .mockResolvedValue({ count: 1 } as FeedbackStatisticsEntity);
      jest
        .spyOn(feedbackIssueStatsRepo, 'createQueryBuilder')
        .mockImplementation(
          () =>
            createQueryBuilder as unknown as SelectQueryBuilder<FeedbackIssueStatisticsEntity>,
        );
      jest
        .spyOn(issueStatsRepo, 'createQueryBuilder')
        .mockImplementation(
          () =>
            createQueryBuilder as unknown as SelectQueryBuilder<IssueStatisticsEntity>,
        );
      clsService.set = jest.fn();

      const feedback = await feedbackService.create(dto);

      expect(feedback.id).toBeDefined();
    });
    it('creating a feedback succeeds with valid inputs and a nonexistent issue name', async () => {
      const dto = new CreateFeedbackDto();
      dto.channelId = faker.number.int();
      dto.data = JSON.parse(JSON.stringify(feedbackDataFixture)) as object;
      dto.data.issueNames = [faker.string.sample()];
      jest.spyOn(issueRepo, 'findOneBy').mockResolvedValue(null);
      jest
        .spyOn(feedbackStatsRepo, 'findOne')
        .mockResolvedValue({ count: 1 } as FeedbackStatisticsEntity);
      jest
        .spyOn(issueStatsRepo, 'createQueryBuilder')
        .mockImplementation(
          () =>
            createQueryBuilder as unknown as SelectQueryBuilder<IssueStatisticsEntity>,
        );
      jest
        .spyOn(feedbackIssueStatsRepo, 'createQueryBuilder')
        .mockImplementation(
          () =>
            createQueryBuilder as unknown as SelectQueryBuilder<FeedbackIssueStatisticsEntity>,
        );
      clsService.set = jest.fn();

      const feedback = await feedbackService.create(dto);

      expect(feedback.id).toBeDefined();
    });
  });
});
