import httpStatus from 'http-status';
import ApiError from '../ApiError';

class UnauthedError extends ApiError {
  constructor() {
    super(httpStatus.UNAUTHORIZED, 'Unauthenticated', true, '', 'UNAUTHED');
  }
}

export default UnauthedError;
