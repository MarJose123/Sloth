import type { DB } from '@op-engineering/op-sqlite';
import { SCHEMA_STATEMENTS } from './schema';

interface Migration {
    version: number;
    statements: readonly string[];
}

// Append new migrations here; never mutate a previously-shipped entry.
const MIGRATIONS: readonly Migration[] = [
    { version: 1, statements: SCHEMA_STATEMENTS },
];

export async function runMigrations(db: DB): Promise<void> {
    const { rows } = await db.execute('PRAGMA user_version;');
    const currentVersion = Number(rows[0]?.user_version ?? 0);

    const pending = MIGRATIONS.filter((m) => m.version > currentVersion).sort(
        (a, b) => a.version - b.version
    );

    for (const migration of pending) {
        await db.transaction(async (tx) => {
            for (const statement of migration.statements) {
                await tx.execute(statement);
            }
        });
        // PRAGMA writes can't run inside the transaction on all platforms reliably;
        // set it immediately after each migration commits.
        await db.execute(`PRAGMA user_version = ${migration.version};`);
    }
}
