import { execFileSync } from 'node:child_process';

// Direct database access, used ONLY to set up starting state and to restore
// seed data in After hooks — never to assert behaviour the UI should prove.
//
// CLAUDE.md calls for a Prisma fixture. @prisma/client isn't installed in this
// repo and the SUT repo (which owns the schema a client would be generated
// from) isn't checked out alongside it, so cleanup shells out to psql in the
// SUT's Postgres container instead. Swapping these helpers for Prisma later
// requires no changes anywhere else.
const CONTAINER = 'course-platform-db';
const DB_USER = 'postgres';
const DB_NAME = 'course_platform';

function query(sql: string): string {
    return execFileSync(
        'docker',
        ['exec', CONTAINER, 'psql', '-U', DB_USER, '-d', DB_NAME, '-tAc', sql],
        { encoding: 'utf-8' },
    ).trim();
}

export function setCourseStatus(courseId: string, status: string) {
    query(`UPDATE "Course" SET status='${status}' WHERE id='${courseId}';`);
}

export function getCourseStatus(courseId: string): string {
    return query(`SELECT status FROM "Course" WHERE id='${courseId}';`);
}

export function setUserRole(email: string, role: string) {
    query(`UPDATE "User" SET role='${role}' WHERE email='${email}';`);
}

export function getUserRole(email: string): string {
    return query(`SELECT role FROM "User" WHERE email='${email}';`);
}
