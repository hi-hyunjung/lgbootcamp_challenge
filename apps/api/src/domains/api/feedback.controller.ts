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
import { Multipart, MultipartFile } from '@fastify/multipart';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import filetypemime from 'magic-bytes.js';

import { ApiKeyAuthGuard } from '@/domains/admin/auth/guards';
import { ChannelService } from '../admin/channel/channel/channel.service';
import {
  DeleteFeedbacksRequestDto,
  FindFeedbacksByChannelIdRequestDto,
} from '../admin/feedback/dtos/requests';
import {
  AddIssueResponseDto,
  FindFeedbacksByChannelIdResponseDto,
} from '../admin/feedback/dtos/responses';
import { FeedbackService } from '../admin/feedback/feedback.service';

interface File {
  fieldname: string;
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

@ApiTags('feedbacks')
@Controller('/projects/:projectId/channels/:channelId')
@ApiSecurity('apiKey')
@UseGuards(ApiKeyAuthGuard)
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly channelService: ChannelService,
  ) {}

  @ApiOperation({
    summary: 'Create Feedback',
    description: `Creates a new feedback for the specified channel with json data.
    You can include 'issueNames' to associate issues with the feedback.
    You can put an array of image urls in the 'images format field' in the request data.
    Make sure to set image domain whitelist in the channel settings.`,
  })
  @ApiParam({
    name: 'projectId',
    type: Number,
    description: 'Project id',
    example: 1,
  })
  @ApiParam({
    name: 'channelId',
    type: Number,
    description: 'Channel id',
    example: 1,
  })
  @ApiBody({
    type: Object,
    description: 'Feedback data in json',
    examples: {
      'Create feedback': {
        summary: 'Create feedback',
        value: {
          message: 'feedback message',
          issueNames: ['issue name 1', 'issue name 2'],
        },
      },
    },
  })
  @ApiOkResponse({
    type: Object,
    description: 'Feedback id',
    schema: {
      example: {
        id: 1,
      },
    },
  })
  @Post('feedbacks')
  async create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('channelId', ParseIntPipe) channelId: number,
    @Body() body: Record<string, any> & { issueNames?: string[] },
  ) {
    const channel = await this.channelService.findById({ channelId });
    if (channel.project.id !== projectId) {
      throw new BadRequestException('Invalid channel id');
    }

    const { id } = await this.feedbackService.create({ data: body, channelId });

    return { id };
  }

  @ApiOperation({
    summary: 'Create Feedback with Image Files',
    description: `Create feedback with data and image files by multi-part. If you want to create feedback with issues, you can add 'issueNames' in the request data.`,
  })
  @ApiParam({
    name: 'projectId',
    type: Number,
    description: 'Project id',
    example: 1,
  })
  @ApiParam({
    name: 'channelId',
    type: Number,
    description: 'Channel id',
    example: 1,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: Object,
    description: 'Feedback data by multipart/form-data',
    examples: {
      'Create feedback': {
        summary: 'Create feedback',
        value: {
          message: 'feedback message',
          issueNames: ['issue name 1', 'issue name 2'],
          images: ['image file 1', 'image file 2'],
        },
      },
    },
  })
  @ApiOkResponse({
    type: Object,
    description: 'Feedback id',
    schema: {
      example: {
        id: 1,
      },
    },
  })
  @Post('feedbacks-with-images')
  async createWithImageFiles(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('channelId', ParseIntPipe) channelId: number,
    @Req() request,
  ) {
    const channel = await this.channelService.findById({ channelId });
    if (channel.project.id !== projectId) {
      throw new BadRequestException('Invalid channel id');
    }

    const files: File[] = [];
    const body = {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const parts = (await request.parts()) as AsyncIterableIterator<
      Multipart | MultipartFile
    >;
    for await (const part of parts) {
      if (part.type === 'file') {
        if (part.mimetype.includes('image') === false) {
          throw new BadRequestException(`Not Image File (${part.mimetype})`);
        }
        const buffer = await part.toBuffer();

        const mimes = filetypemime(buffer).map((mime) => mime.mime);

        if (mimes.includes(part.mimetype) === false) {
          throw new BadRequestException(
            `Invalid file (sent type: ${
              part.mimetype
            }, detected type: ${JSON.stringify(mimes)})`,
          );
        }
        files.push({
          fieldname: part.fieldname,
          buffer,
          mimetype: part.mimetype,
          originalname: part.filename,
        });
      } else {
        body[part.fieldname] = part.value;
      }
    }

    if (files.length === 0) {
      const { id } = await this.feedbackService.create({
        data: body,
        channelId,
      });

      return { id };
    } else {
      const imageUrlsByKeys = await this.feedbackService.uploadImages({
        channelId,
        files,
      });

      const feedbackData = {
        ...body,
        ...imageUrlsByKeys,
      };

      const { id } = await this.feedbackService.create({
        data: feedbackData,
        channelId,
      });

      return { id };
    }
  }

  @ApiOperation({
    summary: 'Search Feedbacks by Channel',
    description: `Searches for feedback entries by channel ID with various filters.`,
  })
  @ApiParam({
    name: 'projectId',
    type: Number,
    description: 'Project id',
    example: 1,
  })
  @ApiParam({
    name: 'channelId',
    type: Number,
    description: 'Channel id',
    example: 1,
  })
  @ApiBody({ type: FindFeedbacksByChannelIdRequestDto })
  @ApiOkResponse({ type: FindFeedbacksByChannelIdResponseDto })
  @Post('feedbacks/search')
  async findByChannelId(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Body() body: FindFeedbacksByChannelIdRequestDto,
  ) {
    return FindFeedbacksByChannelIdResponseDto.transform(
      await this.feedbackService.findByChannelId({ ...body, channelId }),
    );
  }

  @ApiOperation({
    summary: 'Add Issue to Feedback',
    description: `Adds an issue to an existing feedback by specifying the feedback id and issue id.`,
  })
  @ApiParam({
    name: 'projectId',
    type: Number,
    description: 'Project id',
    example: 1,
  })
  @ApiParam({
    name: 'channelId',
    type: Number,
    description: 'Channel id',
    example: 1,
  })
  @ApiParam({
    name: 'feedbackId',
    type: Number,
    description: 'Feedback id to add an issue',
    example: 1,
  })
  @ApiParam({
    name: 'issueId',
    type: Number,
    description: 'Issue id to be added to the feedback',
    example: 1,
  })
  @ApiOkResponse({ type: AddIssueResponseDto })
  @Post('feedbacks/:feedbackId/issue/:issueId')
  async addIssue(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
    @Param('issueId', ParseIntPipe) issueId: number,
  ) {
    return await this.feedbackService.addIssue({
      issueId,
      channelId,
      feedbackId,
    });
  }

  @ApiOperation({
    summary: 'Remove Issue from Feedback',
    description: `Removes an issue from an existing feedback.`,
  })
  @ApiParam({
    name: 'projectId',
    type: Number,
    description: 'Project id',
    example: 1,
  })
  @ApiParam({
    name: 'channelId',
    type: Number,
    description: 'Channel id',
    example: 1,
  })
  @ApiParam({
    name: 'feedbackId',
    type: Number,
    description: 'Feedback id to remove the added issue',
    example: 1,
  })
  @ApiParam({
    name: 'issueId',
    type: Number,
    description: 'Issue id to remove from the feedback',
    example: 1,
  })
  @ApiOkResponse({ type: AddIssueResponseDto })
  @Delete('feedbacks/:feedbackId/issue/:issueId')
  async removeIssue(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
    @Param('issueId', ParseIntPipe) issueId: number,
  ) {
    return await this.feedbackService.removeIssue({
      issueId,
      channelId,
      feedbackId,
    });
  }

  @ApiOperation({
    summary: 'Update Feedback',
    description: `Updates an existing feedback with new information.
    Only Editable fields can be updated.`,
  })
  @ApiParam({
    name: 'projectId',
    type: Number,
    description: 'Project id',
    example: 1,
  })
  @ApiParam({
    name: 'channelId',
    type: Number,
    description: 'Channel id',
    example: 1,
  })
  @ApiParam({
    name: 'feedbackId',
    type: Number,
    description: 'Feedback id to update',
    example: 1,
  })
  @ApiBody({
    type: Object,
    description: 'Feedback data to be updated in json',
    examples: {
      'Update feedback': {
        summary: 'Update feedback',
        value: {
          message: 'updated feedback message',
          issueNames: ['issue name 1'],
        },
      },
    },
  })
  @Put('feedbacks/:feedbackId')
  async updateFeedback(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
    @Body() body: Record<string, any>,
  ) {
    await this.feedbackService.updateFeedback({
      channelId,
      feedbackId,
      data: body,
    });
  }

  @ApiOperation({
    summary: 'Delete Multiple Feedbacks',
    description: `Deletes multiple feedback entries based on the provided array of feedback ids.`,
  })
  @ApiParam({
    name: 'projectId',
    type: Number,
    description: 'Project id',
    example: 1,
  })
  @ApiParam({
    name: 'channelId',
    type: Number,
    description: 'Channel id',
    example: 1,
  })
  @ApiBody({ type: DeleteFeedbacksRequestDto })
  @Delete('feedbacks')
  async deleteMany(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Body() { feedbackIds }: DeleteFeedbacksRequestDto,
  ) {
    await this.feedbackService.deleteByIds({ channelId, feedbackIds });
  }

  @ApiOperation({
    summary: 'Get Feedback by ID',
    description: `Retrieves a specific feedback by its id.`,
  })
  @ApiParam({
    name: 'projectId',
    type: Number,
    description: 'Project id',
    example: 1,
  })
  @ApiParam({
    name: 'channelId',
    type: Number,
    description: 'Channel id',
    example: 1,
  })
  @ApiParam({
    name: 'feedbackId',
    type: Number,
    description: 'Feedback id to find',
    example: 1,
  })
  @ApiOkResponse({ type: Object, description: 'Feedback data' })
  @Get('feedbacks/:feedbackId')
  async findFeedback(
    @Param('channelId', ParseIntPipe) channelId: number,
    @Param('feedbackId', ParseIntPipe) feedbackId: number,
  ) {
    return await this.feedbackService.findById({
      channelId,
      feedbackId,
    });
  }
}
