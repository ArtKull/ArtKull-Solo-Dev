'use strict';

function normalize(value) {
  return String(value == null ? '' : value).replace(/\s+/gu, ' ').trim();
}

function charLength(value) {
  return Array.from(String(value == null ? '' : value)).length;
}

function isHoneypot(input) {
  if (input == null) {
    return false;
  }
  return String(input.website == null ? '' : input.website).trim() !== '';
}

function contactKind(contact) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    return 'email';
  }
  if (/^[+]?[0-9\s\-()]{5,}$/.test(contact)) {
    const digits = contact.replace(/\D/g, '');
    if (digits.length >= 5 && digits.length <= 15) {
      return 'phone';
    }
  }
  return null;
}

function validate(input) {
  const name = normalize(input.name);
  const contact = normalize(input.contact);
  const errors = { name: null, contact: null };

  const nameLen = charLength(name);
  if (nameLen < 2 || nameLen > 80) {
    errors.name = 'name_length';
  }

  const contactLen = charLength(contact);
  if (contactLen < 5 || contactLen > 120) {
    errors.contact = 'contact_length';
  } else if (contactKind(contact) === null) {
    errors.contact = 'contact_format';
  }

  return {
    ok: errors.name === null && errors.contact === null,
    errors,
    values: { name, contact },
  };
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildMessage(values, ip, ua, time) {
  const lines = [];
  lines.push('<b>Новая заявка с сайта ArtKull</b>');
  lines.push('');
  lines.push('<b>Имя:</b> ' + escapeHtml(values.name));
  lines.push('<b>Контакт:</b> ' + escapeHtml(values.contact));
  lines.push('');
  lines.push('<b>Время:</b> ' + escapeHtml(time));
  lines.push('<b>IP:</b> ' + escapeHtml(ip));
  if (ua !== '') {
    lines.push('<b>UA:</b> ' + escapeHtml(String(ua).slice(0, 200)));
  }
  return lines.join('\n');
}

module.exports = {
  normalize,
  charLength,
  isHoneypot,
  contactKind,
  validate,
  escapeHtml,
  buildMessage,
};
