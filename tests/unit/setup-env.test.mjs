import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { setupEnv } from '../../scripts/setup-env.mjs';

test('cria .env a partir do exemplo, não sobrescreve e ignora apps sem exemplo', () => {
	const apps = fs.mkdtempSync(path.join(os.tmpdir(), 'apps-'));
	for (const app of ['a', 'b', 'c']) fs.mkdirSync(path.join(apps, app));
	fs.writeFileSync(path.join(apps, 'a/.env.example'), 'X=1\n');
	fs.writeFileSync(path.join(apps, 'b/.env.example'), 'Y=1\n');
	fs.writeFileSync(path.join(apps, 'b/.env'), 'Y=real\n');
	const created = setupEnv(apps);
	assert.equal(created.length, 1);
	assert.equal(fs.readFileSync(path.join(apps, 'a/.env'), 'utf8'), 'X=1\n');
	assert.equal(fs.readFileSync(path.join(apps, 'b/.env'), 'utf8'), 'Y=real\n');
	assert.ok(!fs.existsSync(path.join(apps, 'c/.env')));
	assert.deepEqual(setupEnv(apps), []);
});
