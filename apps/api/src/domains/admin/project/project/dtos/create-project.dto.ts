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

import type { IssueTrackerDataDto } from '../../issue-tracker/dtos/issue-tracker-data.dto';
import type { CreateRoleDto } from '../../role/dtos';
import type { Timezone } from '../project.entity';

export class CreateProjectDto {
  name: string;
  description: string | null;
  timezone: Timezone;
  roles?: Omit<CreateRoleDto, 'projectId'>[];
  members?: {
    roleName: string;
    userId: number;
  }[];
  apiKeys?: {
    value: string;
    createdAt?: Date;
    deletedAt?: Date;
  }[];
  issueTracker?: {
    data: IssueTrackerDataDto;
  };
}
