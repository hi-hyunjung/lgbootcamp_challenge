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
import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';

import { CommonEntity } from '@/common/entities';
import { ProjectEntity } from '../project/project.entity';
import type { CreateIssueTrackerDto } from './dtos';

@Entity('issue_trackers')
export class IssueTrackerEntity extends CommonEntity {
  @Column({ type: 'json', nullable: true })
  data: object;

  @OneToOne(() => ProjectEntity, (project) => project.issueTracker, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  project: Relation<ProjectEntity>;

  static from({ projectId, data }: CreateIssueTrackerDto) {
    const issueTracker = new IssueTrackerEntity();
    issueTracker.project = new ProjectEntity();
    issueTracker.project.id = projectId;
    issueTracker.data = data;

    return issueTracker;
  }
}
