import { test } from 'node:test';
import assert from 'node:assert/strict';
import { customerOwnsOrder, escapeHtml, messageBody, portalUrl } from './logic.ts';

test('account ownership rejects another user, anonymous sessions, and guest ownership shortcuts', () => {
  const order = { customer_id: 'owner', checkout_type: 'account' };
  assert.equal(customerOwnsOrder({ id: 'owner' }, order), true);
  assert.equal(customerOwnsOrder({ id: 'other' }, order), false);
  assert.equal(customerOwnsOrder({ id: 'owner', is_anonymous: true }, order), false);
  assert.equal(customerOwnsOrder(null, order), false);
  assert.equal(customerOwnsOrder({ id: 'owner' }, { ...order, checkout_type: 'guest' }), false);
});
test('messages normalize text and reject empty, oversized, or control character payloads', () => {
  assert.equal(messageBody(' hi\r\nthere '), 'hi\nthere');
  for (const input of ['', '  ', null, {}, 'x'.repeat(4001), 'hello\u0000']) assert.throws(() => messageBody(input));
  assert.equal(messageBody('<script>alert(1)</script>'), '<script>alert(1)</script>');
  assert.equal(escapeHtml('<img src="x"> & \'hi\''), '&lt;img src=&quot;x&quot;&gt; &amp; &#039;hi&#039;');
});
test('guest links contain only the selected token and all links enforce canonical HTTPS', () => {
  assert.equal(portalUrl('one', 'guest', 'token-one'), 'https://pressedinpink.com/order-status/?order=one&token=token-one');
  assert.throws(() => portalUrl('one', 'guest', ''));
  assert.equal(portalUrl('two', 'account', 'ignored'), 'https://pressedinpink.com/order-status/?order=two');
});
