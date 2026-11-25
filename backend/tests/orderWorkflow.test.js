import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionOrderStatus,
  validateOrderStatusTransition,
} from '../src/utils/orderWorkflow.js';

test('allows valid sequential order transitions', () => {
  assert.equal(canTransitionOrderStatus('Pending', 'Preparing'), true);
  assert.equal(canTransitionOrderStatus('Preparing', 'Ready'), true);
  assert.equal(canTransitionOrderStatus('Ready', 'Completed'), true);
});

test('blocks skipping states or moving backwards', () => {
  assert.throws(
    () => validateOrderStatusTransition('Pending', 'Completed'),
    /Cannot move order from "Pending" to "Completed"/
  );
  assert.throws(
    () => validateOrderStatusTransition('Ready', 'Preparing'),
    /Cannot move order from "Ready" to "Preparing"/
  );
  assert.throws(
    () => validateOrderStatusTransition('Completed', 'Pending'),
    /Completed orders cannot be transitioned further/
  );
});

test('blocks unknown status or same-status transition', () => {
  assert.throws(
    () => validateOrderStatusTransition('Pending', 'Cancelled'),
    /Invalid status/
  );
  assert.throws(
    () => validateOrderStatusTransition('Pending', 'Pending'),
    /already in "Pending"/
  );
});
