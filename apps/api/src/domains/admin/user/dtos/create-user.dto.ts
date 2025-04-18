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
import type { SignUpMethodEnum } from '../entities/enums';
import type { CreateEmailUserDto } from './create-email-user.dto';
import type { CreateInvitationUserDto } from './create-invitation-user.dto';
import type { CreateOAuthUserDto } from './create-oauth-user.dto';

export type CreateUserDto = (
  | Omit<CreateEmailUserDto & { method: 'email' }, 'password'>
  | Omit<CreateInvitationUserDto & { method: 'invitation' }, 'password'>
  | (CreateOAuthUserDto & { method: 'oauth' })
) & { hashPassword: string; signUpMethod: SignUpMethodEnum };
