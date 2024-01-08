import { Note, Resource } from '@prisma/client';

export interface NoteResource extends Resource {
  note: Note | null;
  user: Pick<User, 'id', 'name'>;
}
