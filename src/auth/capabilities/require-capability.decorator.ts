import { SetMetadata } from '@nestjs/common';
import { Capability } from './capability.enum';

export const CAPABILITY_KEY = 'requiredCapability';

export const RequireCapability = (capability: Capability) =>
  SetMetadata(CAPABILITY_KEY, capability);
