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

// --- Student state ----------------------------------------------------------

function userId(email: string): string {
    return query(`SELECT id FROM "User" WHERE email='${email}';`);
}

export function isEnrolled(email: string, courseId: string): boolean {
    return (
        query(
            `SELECT count(*) FROM "Enrollment" WHERE "userId"='${userId(email)}' AND "courseId"='${courseId}';`,
        ) !== '0'
    );
}

// Starting state for scenarios that need an enrolled student without spending
// steps on the enrolment flow itself (CLAUDE.md: set up state via the database,
// not by clicking through the UI).
export function enrollStudent(email: string, courseId: string) {
    query(
        `INSERT INTO "Enrollment" (id, "userId", "courseId", "enrolledAt")
         VALUES ('bdd_' || substr(md5(random()::text), 1, 20), '${userId(email)}', '${courseId}', now())
         ON CONFLICT DO NOTHING;`,
    );
}

// Scoped to one course on purpose: wiping every enrolment for the shared fresh
// student would tear down a fixture another feature file is using in parallel.
export function deleteEnrollment(email: string, courseId: string) {
    query(
        `DELETE FROM "Enrollment" WHERE "userId"='${userId(email)}' AND "courseId"='${courseId}';`,
    );
}

export function deleteLectureProgress(email: string, courseId: string) {
    query(
        `DELETE FROM "LectureProgress" WHERE "userId"='${userId(email)}' AND "lectureId" IN (
            SELECT l.id FROM "Lecture" l
            JOIN "Section" s ON s.id = l."sectionId"
            WHERE s."courseId" = '${courseId}'
         );`,
    );
}

export function deleteQuizAttempts(email: string) {
    query(`DELETE FROM "QuizAttempt" WHERE "userId"='${userId(email)}';`);
}

export function deleteTransactions(email: string, courseId: string) {
    query(
        `DELETE FROM "Transaction" WHERE "userId"='${userId(email)}' AND "courseId"='${courseId}';`,
    );
}

export function getTransactionStatus(email: string, courseId: string): string {
    return query(
        `SELECT status FROM "Transaction"
         WHERE "userId"='${userId(email)}' AND "courseId"='${courseId}'
         ORDER BY "createdAt" DESC LIMIT 1;`,
    );
}

export function countTransactions(email: string, courseId: string): number {
    return Number(
        query(
            `SELECT count(*) FROM "Transaction" WHERE "userId"='${userId(email)}' AND "courseId"='${courseId}';`,
        ),
    );
}

// --- Instructor state -------------------------------------------------------

// Removed by exact title so one feature's cleanup can't delete the scratch
// course another feature is using at the same time, while still clearing a
// leftover from a run that died before its After hook.
export function deleteCoursesByTitle(title: string) {
    query(`DELETE FROM "Course" WHERE title='${title}';`);
}

export function getCourseIdByTitle(title: string): string {
    return query(`SELECT id FROM "Course" WHERE title='${title}' LIMIT 1;`);
}

// A draft course with one section and `lessonTitles` lectures in the given
// order — the starting point for lesson-management scenarios, which are about
// reordering and deleting lessons rather than creating a course.
export function createDraftCourseWithLessons(
    title: string,
    slug: string,
    instructorEmail: string,
    lessonTitles: readonly string[],
): string {
    const courseId = `bdd_course_${Date.now()}`;
    const sectionId = `${courseId}_sec`;

    query(
        `INSERT INTO "Course" (id, slug, title, description, "instructorId", "categoryId", status, "updatedAt")
         VALUES ('${courseId}', '${slug}', '${title}',
                 'Scratch course created by the automated suite for lesson management scenarios.',
                 '${userId(instructorEmail)}',
                 (SELECT id FROM "Category" LIMIT 1), 'DRAFT', now());`,
    );
    query(
        `INSERT INTO "Section" (id, "courseId", title, "order", "createdAt")
         VALUES ('${sectionId}', '${courseId}', 'Kurikulum', 0, now());`,
    );
    lessonTitles.forEach((lessonTitle, index) => {
        query(
            `INSERT INTO "Lecture" (id, "sectionId", title, type, "order", "createdAt", "durationSeconds", "videoUrl")
             VALUES ('${sectionId}_lec_${index}', '${sectionId}', '${lessonTitle}', 'VIDEO', ${index}, now(), 10, '/sample-lecture.mp4');`,
        );
    });

    return courseId;
}

export function deleteCourse(courseId: string) {
    query(`DELETE FROM "Course" WHERE id='${courseId}';`);
}

export function getCourseStatusById(courseId: string): string {
    return query(`SELECT status FROM "Course" WHERE id='${courseId}';`);
}

export function getLessonTitlesInOrder(courseId: string): string[] {
    const rows = query(
        `SELECT l.title FROM "Lecture" l
         JOIN "Section" s ON s.id = l."sectionId"
         WHERE s."courseId"='${courseId}' ORDER BY l."order";`,
    );
    return rows ? rows.split('\n') : [];
}
