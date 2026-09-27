<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../lib/submit.php';

$pass = 0;
$fail = 0;
function check(string $label, bool $cond): void
{
    global $pass, $fail;
    if ($cond) {
        $pass++;
        echo "PASS $label\n";
    } else {
        $fail++;
        echo "FAIL $label\n";
    }
}

/* honeypot */
check('honeypot empty -> false', artkull_is_honeypot(['website' => '']) === false);
check('honeypot missing -> false', artkull_is_honeypot([]) === false);
check('honeypot filled -> true', artkull_is_honeypot(['website' => 'spam']) === true);

/* validate: email / phone */
$r = artkull_validate(['name' => 'Артём', 'contact' => 'artkull@gmail.com']);
check('valid email ok', $r['ok'] === true);
$r = artkull_validate(['name' => 'Артём', 'contact' => '+7 922 269-84-46']);
check('valid phone ok', $r['ok'] === true);
$r = artkull_validate(['name' => 'A', 'contact' => 'artkull@gmail.com']);
check('short name rejected', $r['ok'] === false && $r['errors']['name'] === 'name_length');
$r = artkull_validate(['name' => 'Артём', 'contact' => 'abcdef']);
check('bad contact rejected', $r['ok'] === false && $r['errors']['contact'] === 'contact_format');
$r = artkull_validate(['name' => 'Артём', 'contact' => 'abc']);
check('short contact rejected', $r['ok'] === false && $r['errors']['contact'] === 'contact_length');
$r = artkull_validate(['name' => 'Артём', 'contact' => str_repeat('a', 121) . '@x.io']);
check('long contact rejected', $r['ok'] === false);

/* rate limit: deterministic with injected $now */
$dir = sys_get_temp_dir() . '/artkull_rl_test_' . uniqid();
check('rl 1st allowed', artkull_rate_limit($dir, '1.2.3.4', 2, 600, 1000) === true);
check('rl 2nd allowed', artkull_rate_limit($dir, '1.2.3.4', 2, 600, 1001) === true);
check('rl 3rd blocked', artkull_rate_limit($dir, '1.2.3.4', 2, 600, 1002) === false);
check('rl window expiry allows', artkull_rate_limit($dir, '1.2.3.4', 2, 600, 2000) === true);
array_map('unlink', glob($dir . '/*'));
@rmdir($dir);

/* message building escapes HTML */
$msg = artkull_build_message(
    ['name' => '<b>Злой</b>', 'contact' => 'x@y.io'],
    '10.0.0.1',
    'UA<test>',
    '2026-09-27 12:00'
);
check('message escapes name', strpos($msg, '&lt;b&gt;') !== false && strpos($msg, '<b>Злой</b>') === false);
check('message has contact', strpos($msg, 'x@y.io') !== false);

echo "\n$pass passed, $fail failed\n";
exit($fail === 0 ? 0 : 1);
