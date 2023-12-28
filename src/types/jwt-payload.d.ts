import { JwtPayload as jwt } from 'jsonwebtoken';

export interface JwtPayload extends jwt {
  tenant: string | undefined;
}
