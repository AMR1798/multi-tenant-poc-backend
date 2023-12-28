import { User } from '@prisma/client';

type RequestWithUser = Request & { user: User };
