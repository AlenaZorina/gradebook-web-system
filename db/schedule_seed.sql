/*BEGIN;

TRUNCATE TABLE schedule_entries, schedule_imports RESTART IDENTITY CASCADE;

INSERT INTO schedule_imports (source_url, file_name, imported_at, status)
VALUES
('https://perm.hse.ru/students/timetable/', 'teacher_week_current.xls', NOW(), 'imported'),
('https://perm.hse.ru/students/timetable/', 'teacher_week_next.xls', NOW(), 'imported');

WITH base AS (
    SELECT date_trunc('week', CURRENT_DATE)::date AS monday
),
current_import AS (
    SELECT id_import
    FROM schedule_imports
    WHERE file_name = 'teacher_week_current.xls'
),
next_import AS (
    SELECT id_import
    FROM schedule_imports
    WHERE file_name = 'teacher_week_next.xls'
)
INSERT INTO schedule_entries (
    id_import,
    id_assignment,
    lesson_date,
    start_time,
    end_time,
    week_no,
    module_no
)

-- Текущая неделя
SELECT
    ci.id_import,
    ta.id_assignment,
    b.monday + 0,
    TIME '08:00',
    TIME '09:40',
    1,
    4
FROM current_import ci
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'РИС-22-3'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'chadov.al'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Качественные и количественные методы'

UNION ALL

SELECT
    ci.id_import,
    ta.id_assignment,
    b.monday + 2,
    TIME '13:10',
    TIME '14:50',
    1,
    4
FROM current_import ci
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'РИС-22-3'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'chadov.al'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Качественные и количественные методы'

UNION ALL

SELECT
    ci.id_import,
    ta.id_assignment,
    b.monday + 1,
    TIME '09:50',
    TIME '11:30',
    1,
    4
FROM current_import ci
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'РИС-22-3'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'grabar.vv'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Лидерство и управление командой'

UNION ALL

SELECT
    ci.id_import,
    ta.id_assignment,
    b.monday + 1,
    TIME '11:40',
    TIME '13:10',
    1,
    4
FROM current_import ci
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'РИС-23-1'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'vikenteva.ol'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Введение в DevOps'

UNION ALL

SELECT
    ci.id_import,
    ta.id_assignment,
    b.monday + 3,
    TIME '15:00',
    TIME '16:40',
    1,
    4
FROM current_import ci
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'РИС-23-1'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'markvirer.vd'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Прикладная информатика'

UNION ALL

SELECT
    ci.id_import,
    ta.id_assignment,
    b.monday + 4,
    TIME '11:40',
    TIME '13:10',
    1,
    4
FROM current_import ci
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'МБ-22-1'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'shakina.ma'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Экономика'

UNION ALL

-- Следующая неделя
SELECT
    ni.id_import,
    ta.id_assignment,
    b.monday + 7,
    TIME '08:00',
    TIME '09:40',
    2,
    4
FROM next_import ni
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'РИС-22-3'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'chadov.al'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Качественные и количественные методы'

UNION ALL

SELECT
    ni.id_import,
    ta.id_assignment,
    b.monday + 9,
    TIME '13:10',
    TIME '14:50',
    2,
    4
FROM next_import ni
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'РИС-22-3'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'chadov.al'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Качественные и количественные методы'

UNION ALL

SELECT
    ni.id_import,
    ta.id_assignment,
    b.monday + 8,
    TIME '09:50',
    TIME '11:30',
    2,
    4
FROM next_import ni
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'РИС-22-3'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'grabar.vv'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Лидерство и управление командой'

UNION ALL

SELECT
    ni.id_import,
    ta.id_assignment,
    b.monday + 8,
    TIME '11:40',
    TIME '13:10',
    2,
    4
FROM next_import ni
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'РИС-23-1'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'vikenteva.ol'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Введение в DevOps'

UNION ALL

SELECT
    ni.id_import,
    ta.id_assignment,
    b.monday + 10,
    TIME '15:00',
    TIME '16:40',
    2,
    4
FROM next_import ni
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'РИС-23-1'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'markvirer.vd'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Прикладная информатика'

UNION ALL

SELECT
    ni.id_import,
    ta.id_assignment,
    b.monday + 11,
    TIME '11:40',
    TIME '13:10',
    2,
    4
FROM next_import ni
CROSS JOIN base b
JOIN teaching_assignments ta ON ta.id_group = g.id_group
JOIN groups g ON g.group_name = 'МБ-22-1'
JOIN teachers t ON t.id_teacher = ta.id_teacher
JOIN user_auth ua ON ua.id_user = t.id_user AND ua.login = 'shakina.ma'
JOIN enrollments e ON e.id_enrollment = ta.id_enrollment
JOIN disciplines d ON d.id_discipline = e.id_discipline AND d.discipline_name = 'Экономика';

COMMIT;*/