import { AppError } from './AppError.js';

export const ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Completed'];

export const ALLOWED_TRANSITIONS = {
  Pending: ['Preparing'],
  Preparing: ['Ready'],
  Ready: ['Completed'],
  Completed: [],
};

export function canTransitionOrderStatus(currentStatus, nextStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed) {
    return false;
  }
  return allowed.includes(nextStatus);
}

export function validateOrderStatusTransition(currentStatus, nextStatus) {
  if (!ORDER_STATUSES.includes(nextStatus)) {
    throw new AppError(
      `Invalid status "${nextStatus}". Valid statuses are: ${ORDER_STATUSES.join(', ')}.`,
      400
    );
  }

  if (currentStatus === nextStatus) {
    throw new AppError(`Order is already in "${currentStatus}" status.`, 400);
  }

  if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    const hint =
      allowed.length > 0
        ? `Allowed next status: ${allowed.join(', ')}.`
        : 'Completed orders cannot be transitioned further.';
    throw new AppError(
      `Cannot move order from "${currentStatus}" to "${nextStatus}". ${hint}`,
      400
    );
  }
}

