'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalize,
  isHoneypot,
  contactKind,
  validate,
  buildMessage,
} = require('../lib/validate');

test('normalize схлопывает пробелы и обрезает края', () => {
  assert.equal(normalize('  Иван   Петров  '), 'Иван Петров');
  assert.equal(normalize(undefined), '');
});

test('isHoneypot: пустое поле — не бот', () => {
  assert.equal(isHoneypot({}), false);
  assert.equal(isHoneypot({ website: '' }), false);
  assert.equal(isHoneypot({ website: '   ' }), false);
});

test('isHoneypot: заполненное поле — бот', () => {
  assert.equal(isHoneypot({ website: 'spam' }), true);
});

test('contactKind распознаёт email и телефон', () => {
  assert.equal(contactKind('a@b.co'), 'email');
  assert.equal(contactKind('+7 922 269-84-46'), 'phone');
  assert.equal(contactKind('просто текст'), null);
});

test('validate: валидная заявка с согласием', () => {
  const r = validate({ name: 'Артём', contact: 'a@b.co', consent: 'yes' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.values, { name: 'Артём', contact: 'a@b.co', consent: true });
});

test('validate: отсутствие согласия', () => {
  const r = validate({ name: 'Артём', contact: 'a@b.co' });
  assert.equal(r.ok, false);
  assert.equal(r.errors.consent, 'consent');
});

test('validate: согласие не подтверждено', () => {
  const r = validate({ name: 'Артём', contact: 'a@b.co', consent: 'no' });
  assert.equal(r.ok, false);
  assert.equal(r.errors.consent, 'consent');
});

test('validate: короткое имя', () => {
  const r = validate({ name: 'A', contact: 'a@b.co' });
  assert.equal(r.ok, false);
  assert.equal(r.errors.name, 'name_length');
});

test('validate: короткий контакт', () => {
  const r = validate({ name: 'Артём', contact: 'zzz' });
  assert.equal(r.errors.contact, 'contact_length');
});

test('validate: неверный формат контакта', () => {
  const r = validate({ name: 'Артём', contact: 'abcdef' });
  assert.equal(r.errors.contact, 'contact_format');
});

test('buildMessage экранирует HTML и включает контакт и согласие', () => {
  const msg = buildMessage(
    { name: '<b>x</b>', contact: 'a@b.co', consent: true },
    '1.1.1.1',
    'UA',
    '2026-01-01 10:00'
  );
  assert.ok(msg.includes('&lt;b&gt;x&lt;/b&gt;'));
  assert.ok(msg.includes('a@b.co'));
  assert.ok(msg.includes('1.1.1.1'));
  assert.ok(msg.includes('Согласие на обработку ПД:'));
});
