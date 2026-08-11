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
