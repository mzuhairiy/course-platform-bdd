// Fixed seed data from the SUT's Prisma seed — deterministic across every
// `npm run db:seed`, so scenarios can name courses, instructors and categories
// the way a business reader would and let the steps resolve the technical ids.

export const ACCOUNTS = {
    admin: 'admin@example.com',
    student: 'student@example.com',
    studentFresh: 'student2@example.com',
    instructor: 'instructor@example.com',
    instructorOther: 'instructor2@example.com',
} as const;

export const ROLES = {
    student: 'STUDENT',
    instructor: 'INSTRUCTOR',
    admin: 'ADMIN',
} as const;

// The course moderation scenarios act on. Published with no enrolled students,
// so archiving it has the smallest possible blast radius.
export const MODERATION_COURSE = {
    id: 'course_excel',
    title: 'Excel untuk Analisis Bisnis',
    originalStatus: 'PUBLISHED',
} as const;

// Seeded already-archived course, used to exercise the restore path.
export const ARCHIVED_COURSE = {
    id: 'course_product_mgmt',
    title: 'Manajemen Produk untuk Pemula',
    originalStatus: 'ARCHIVED',
} as const;

// Business-facing names -> the value each admin course filter <select> submits.
const STATUS_FILTER_VALUES: Record<string, string> = {
    Draft: 'DRAFT',
    Published: 'PUBLISHED',
    Archived: 'ARCHIVED',
};

const INSTRUCTOR_FILTER_VALUES: Record<string, string> = {
    'Budi Santoso': 'user_instructor',
    'Sarah Wijaya': 'user_instructor_2',
};

const CATEGORY_FILTER_VALUES: Record<string, string> = {
    'AI & Machine Learning': 'cat_ai',
    Business: 'cat_business',
    'Data & Analytics': 'cat_data',
    Design: 'cat_design',
    'Personal Development': 'cat_personal',
    'Product & Engineering': 'cat_prodeng',
    Programming: 'cat_programming',
};

const FILTER_VALUES: Record<string, Record<string, string>> = {
    status: STATUS_FILTER_VALUES,
    instructor: INSTRUCTOR_FILTER_VALUES,
    category: CATEGORY_FILTER_VALUES,
};

// Resolves "category" + "Design" -> "cat_design". Throws loudly so a typo in a
// feature file fails on the spot instead of silently filtering by nothing.
export function resolveFilterValue(criterion: string, businessName: string): string {
    const values = FILTER_VALUES[criterion];
    if (!values) {
        throw new Error(`Unknown filter criterion: "${criterion}"`);
    }

    const value = values[businessName];
    if (value === undefined) {
        throw new Error(`Unknown ${criterion} filter value: "${businessName}"`);
    }

    return value;
}

// --- Student journeys -------------------------------------------------------

// Playwright runs feature files in parallel, and the suite has only one fresh
// student account to share. Each feature therefore owns its own course, so two
// features acting on student2 at the same time never touch the same enrolment.
//
// Free, published course used by the enrolment scenarios: free means enrolling
// is one click with no checkout.
export const FREE_COURSE = {
    id: 'course_dataviz',
    slug: 'dasar-data-visualization',
    title: 'Dasar Data Visualization',
    firstLectureId: 'lec_dasar-data-visualization_0_0',
    secondLectureId: 'lec_dasar-data-visualization_0_1',
} as const;

// Free course owned by the video-progress scenarios alone. Every lecture is a
// 10-second dummy video, so "watch it to the end" is fast and deterministic.
export const PROGRESS_COURSE = {
    id: 'course_deep_work',
    slug: 'deep-work-fokus-di-era-distraksi',
    title: 'Deep Work: Fokus di Era Distraksi',
    firstLectureId: 'lec_deep-work-fokus-di-era-distraksi_0_0',
} as const;

// Paid course the enrolment scenarios only look at — they assert the offer is
// a purchase and that the lecture player stays shut, without buying anything.
export const PAID_COURSE = {
    id: 'course_figma_ui',
    slug: 'figma-untuk-ui-designer',
    title: 'Figma untuk UI Designer',
    firstLectureId: 'lec_figma-untuk-ui-designer_0_0',
    price: 199000,
} as const;

// Paid course owned by the checkout scenarios alone, so the orders they create
// can never race the enrolment scenarios.
export const CHECKOUT_COURSE = {
    id: 'course_digital_marketing',
    slug: 'digital-marketing-umkm',
    title: 'Digital Marketing untuk UMKM',
    firstLectureId: 'lec_digital-marketing-umkm_0_0',
    price: 179000,
} as const;

// Course student@example.com is already enrolled in by the seed. Its quiz is
// the one the quiz scenarios exercise.
export const ENROLLED_COURSE = {
    id: 'course_nextjs_pemula',
    slug: 'next-js-14-untuk-pemula',
    title: 'Next.js 14 untuk Pemula',
    firstLectureId: 'lec_next-js-14-untuk-pemula_0_0',
    quizLectureId: 'lec_next-js-14-untuk-pemula_3_quiz',
    quizId: 'quiz_next-js-14-untuk-pemula',
    passingScore: 60,
} as const;

// Business-facing course titles -> the fixture a step needs, so feature files
// name courses the way a reader would and steps resolve ids and slugs.
export type CourseFixture = {
    readonly id: string;
    readonly slug: string;
    readonly title: string;
    readonly firstLectureId: string;
};

const COURSES_BY_TITLE: Record<string, CourseFixture> = {
    [FREE_COURSE.title]: FREE_COURSE,
    [PROGRESS_COURSE.title]: PROGRESS_COURSE,
    [PAID_COURSE.title]: PAID_COURSE,
    [CHECKOUT_COURSE.title]: CHECKOUT_COURSE,
    [ENROLLED_COURSE.title]: ENROLLED_COURSE,
};

export function resolveCourse(title: string): CourseFixture {
    const course = COURSES_BY_TITLE[title];
    if (!course) {
        throw new Error(`Unknown course: "${title}"`);
    }
    return course;
}

const QUIZ = ENROLLED_COURSE.quizId;

// Answer sets for the seeded quiz, taken from QuizQuestion.correctAnswerIds so
// no scenario has to name an option id. Question 2 is the only multi-answer
// question (correct = q2_a AND q2_b), which is what makes all-or-nothing
// grading observable: answering it partially scores zero for that question
// while the rest still count.
export const QUIZ_ANSWERS: Record<string, readonly string[]> = {
    // 5/5 -> 100%
    'all correct': [
        `${QUIZ}_q1_a`,
        `${QUIZ}_q2_a`,
        `${QUIZ}_q2_b`,
        `${QUIZ}_q3_true`,
        `${QUIZ}_q4_a`,
        `${QUIZ}_q5_false`,
    ],
    // 0/5 -> 0%
    'all wrong': [
        `${QUIZ}_q1_b`,
        `${QUIZ}_q2_c`,
        `${QUIZ}_q3_false`,
        `${QUIZ}_q4_b`,
        `${QUIZ}_q5_true`,
    ],
    // Everything right except one half of question 2 -> 4/5 -> 80%
    'correct except one half of the multi-answer question': [
        `${QUIZ}_q1_a`,
        `${QUIZ}_q2_a`,
        `${QUIZ}_q3_true`,
        `${QUIZ}_q4_a`,
        `${QUIZ}_q5_false`,
    ],
};

export function resolveQuizAnswers(setName: string): readonly string[] {
    const answers = QUIZ_ANSWERS[setName];
    if (!answers) {
        throw new Error(`Unknown quiz answer set: "${setName}"`);
    }
    return answers;
}

// --- Instructor journeys ----------------------------------------------------

// The two instructor features each own a distinctly named scratch course, for
// the same reason the student features own separate courses: they run in
// parallel, and cleanup keyed to a shared prefix would delete the other
// feature's fixture mid-run. Cleanup is by exact title, which also clears a
// leftover from a run that crashed before its After hook.
//
// The create-course form rejects a description under 50 characters, so the
// fixture text is deliberately long enough to pass validation.
export const SCRATCH_COURSE = {
    title: 'BDD Scratch Course',
    expectedSlug: 'bdd-scratch-course',
    description:
        'A scratch course created by the automated suite to exercise the course lifecycle end to end.',
    category: 'Programming',
} as const;

// Seeded straight into the database by the lesson-management scenarios, so its
// title never has to appear in a feature file.
export const LESSON_COURSE = {
    title: 'BDD Lessons Course',
    slug: 'bdd-lessons-course',
} as const;

// The lesson form requires an absolute URL for video lessons — the seed itself
// stores a relative path ("/sample-lecture.mp4") that the form rejects, so this
// placeholder exists purely to get past validation (BUG-004).
export const SCRATCH_LESSON_VIDEO_URL = 'https://cdn.example.com/bdd-sample.mp4';
