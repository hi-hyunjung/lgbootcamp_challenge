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
import type { UserDto } from '@/domains/admin/user/dtos';
import type { UserTypeEnum } from '@/domains/admin/user/entities/enums';
import type { CodeTypeEnum } from '../code-type.enum';

export type SetCodeDto =
  | SetCodeEmailVerificationDto
  | SetCodeResetPasswordDto
  | SetCodeUserInvitationDto;

export class SetCodeEmailVerificationDto {
  type: CodeTypeEnum.EMAIL_VEIRIFICATION;
  key: string;
  durationSec?: number;
}
export class SetCodeResetPasswordDto {
  type: CodeTypeEnum.RESET_PASSWORD;
  key: string;
  durationSec?: number;
}
export class SetCodeUserInvitationDto {
  type: CodeTypeEnum.USER_INVITATION;
  key: string;
  durationSec?: number;
  data: SetCodeUserInvitationDataDto;
}
export class SetCodeUserInvitationDataDto {
  roleId: number;
  userType: UserTypeEnum;
  invitedBy: UserDto;
}
