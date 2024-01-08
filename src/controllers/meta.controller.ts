import catchAsync from '../utils/catchAsync';
import metaService from '../services/meta.service';
import { AuthedUser } from '../types/authed-user';

const listAccess = catchAsync(async (req, res) => {
  let { page, limit } = req.query;
  const { sort, order } = req.query;
  if (!page) {
    page = '1';
  }

  if (!limit) {
    limit = '10';
  }

  const result = await metaService.listAccessPaginated(
    req.user as AuthedUser,
    Number(page),
    Number(limit)
  );
  res.send(result);
});

export default { listAccess };
