import ApiError from '../utils/ApiError.js';

export const validateCreateComment = (req, res, next) => {
  const body = req.body || {};
  const unexpected = Object.keys(body).find((field) => field !== 'content');
  if (unexpected) return next(new ApiError(400, `Unexpected comment field: ${unexpected}`));
  if (typeof body.content !== 'string' || body.content.trim().length < 1) return next(new ApiError(400, 'Comment content is required'));
  if (body.content.trim().length > 2000) return next(new ApiError(400, 'Comment content cannot exceed 2000 characters'));
  next();
};

export const validateUpdateComment = validateCreateComment;
export default { validateCreateComment, validateUpdateComment };