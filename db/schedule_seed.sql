BEGIN;

CREATE OR REPLACE VIEW teacher_schedule_view AS
SELECT
    se.id_entry,
    t.id_user AS teacher_user_id,
    u.surname || ' ' || LEFT(u.name, 1) || '.' ||
        CASE
            WHEN u.fathername IS NOT NULL THEN LEFT(u.fathername, 1) || '.'
            ELSE ''
        END AS teacher_short_name,
    t.department,
    t.position,
    se.lesson_date,
    se.start_time,
    se.end_time,
    se.week_no,
    se.module_no,
    d.discipline_name,
    g.group_name
FROM schedule_entries se
JOIN teaching_assignments ta ON se.id_assignment = ta.id_assignment
JOIN teachers t ON ta.id_teacher = t.id_teacher
JOIN users u ON t.id_user = u.id_user
JOIN groups g ON ta.id_group = g.id_group
JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
JOIN disciplines d ON e.id_discipline = d.id_discipline;

TRUNCATE TABLE schedule_entries, schedule_imports RESTART IDENTITY CASCADE;

INSERT INTO schedule_imports (source_url, file_name, imported_at, status)
VALUES
('https://perm.hse.ru/students/timetable/', 'teacher_schedule_demo_week_2.xlsx', NOW(), 'imported'),
('https://perm.hse.ru/students/timetable/', 'teacher_schedule_demo_week_3.xlsx', NOW(), 'imported');

WITH schedule_seed AS (
    SELECT * FROM (VALUES
        -- Чадов А.Л. / РИС-22-3 / Качественные и количественные методы
        ('teacher_schedule_demo_week_2.xlsx', 'chadov.al', 'РИС-22-3', 'Качественные и количественные методы', DATE '2026-02-02', TIME '08:00', TIME '09:30', 2, 3),
        ('teacher_schedule_demo_week_2.xlsx', 'chadov.al', 'РИС-22-3', 'Качественные и количественные методы', DATE '2026-02-02', TIME '09:40', TIME '11:10', 2, 3),
        ('teacher_schedule_demo_week_2.xlsx', 'chadov.al', 'РИС-22-3', 'Качественные и количественные методы', DATE '2026-02-02', TIME '15:00', TIME '16:30', 2, 3),
        ('teacher_schedule_demo_week_2.xlsx', 'chadov.al', 'РИС-22-3', 'Качественные и количественные методы', DATE '2026-02-02', TIME '18:20', TIME '19:50', 2, 3),

        ('teacher_schedule_demo_week_3.xlsx', 'chadov.al', 'РИС-22-3', 'Качественные и количественные методы', DATE '2026-02-09', TIME '08:00', TIME '09:30', 3, 3),
        ('teacher_schedule_demo_week_3.xlsx', 'chadov.al', 'РИС-22-3', 'Качественные и количественные методы', DATE '2026-02-11', TIME '13:10', TIME '14:40', 3, 3),

        -- Викентьева О.Л. / РИС-23-1 / DevOps
        ('teacher_schedule_demo_week_2.xlsx', 'vikenteva.ol', 'РИС-23-1', 'Введение в DevOps', DATE '2026-02-03', TIME '11:40', TIME '13:10', 2, 3),
        ('teacher_schedule_demo_week_2.xlsx', 'vikenteva.ol', 'РИС-23-1', 'Введение в DevOps', DATE '2026-02-05', TIME '13:10', TIME '14:40', 2, 3),

        -- Грабарь В.В. / лидерство
        ('teacher_schedule_demo_week_2.xlsx', 'grabar.vv', 'РИС-22-3', 'Лидерство и управление командой', DATE '2026-02-04', TIME '09:40', TIME '11:10', 2, 3),
        ('teacher_schedule_demo_week_2.xlsx', 'grabar.vv', 'РИС-23-1', 'Лидерство и управление командой', DATE '2026-02-06', TIME '15:00', TIME '16:30', 2, 3)
    ) AS s(file_name, teacher_login, group_name, discipline_name, lesson_date, start_time, end_time, week_no, module_no)
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
SELECT
    si.id_import,
    ta.id_assignment,
    s.lesson_date,
    s.start_time,
    s.end_time,
    s.week_no,
    s.module_no
FROM schedule_seed s
JOIN schedule_imports si ON si.file_name = s.file_name
JOIN user_auth ua ON ua.login = s.teacher_login
JOIN teachers t ON t.id_user = ua.id_user
JOIN groups g ON g.group_name = s.group_name
JOIN enrollments e ON e.id_program = g.id_program
JOIN disciplines d ON d.id_discipline = e.id_discipline
JOIN teaching_assignments ta
    ON ta.id_teacher = t.id_teacher
   AND ta.id_group = g.id_group
   AND ta.id_enrollment = e.id_enrollment
WHERE d.discipline_name = s.discipline_name;

COMMIT;