BEGIN;

CREATE OR REPLACE VIEW teacher_attendance_view AS
SELECT
    ats.id_session,
    a.id_attendance,
    t.id_user AS teacher_user_id,
    ta.id_assignment,
    d.id_discipline,
    d.discipline_name,
    g.id_group,
    g.group_name,
    g.course_no,
    ats.lesson_date,
    ats.start_time,
    ats.end_time,
    s.id_student,
    su.surname AS student_surname,
    su.name AS student_name,
    su.fathername AS student_fathername,
    s.record_book_no,
    a.status
FROM attendance a
JOIN attendance_sessions ats ON a.id_session = ats.id_session
JOIN teaching_assignments ta ON ats.id_assignment = ta.id_assignment
JOIN teachers t ON ta.id_teacher = t.id_teacher
JOIN groups g ON ta.id_group = g.id_group
JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
JOIN disciplines d ON e.id_discipline = d.id_discipline
JOIN students s ON a.id_student = s.id_student
JOIN users su ON s.id_user = su.id_user
WHERE ta.is_active = TRUE;

TRUNCATE TABLE attendance, attendance_sessions RESTART IDENTITY CASCADE;

WITH target_assignment AS (
    SELECT
        ta.id_assignment,
        t.id_user AS teacher_user_id,
        g.id_group
    FROM teaching_assignments ta
    JOIN teachers t ON ta.id_teacher = t.id_teacher
    JOIN user_auth ua ON ua.id_user = t.id_user
    JOIN groups g ON ta.id_group = g.id_group
    JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
    JOIN disciplines d ON e.id_discipline = d.id_discipline
    WHERE ua.login = 'chadov.al'
      AND g.group_name = 'РИС-22-3'
      AND d.discipline_name = 'Качественные и количественные методы'
    LIMIT 1
),
session_seed AS (
    SELECT * FROM (VALUES
        (1, DATE '2026-02-02', TIME '08:00', TIME '09:30'),
        (2, DATE '2026-02-02', TIME '09:40', TIME '11:10'),
        (3, DATE '2026-02-04', TIME '11:30', TIME '13:00'),
        (4, DATE '2026-02-06', TIME '13:10', TIME '14:40'),
        (5, DATE '2026-02-09', TIME '08:00', TIME '09:30'),
        (6, DATE '2026-02-11', TIME '09:40', TIME '11:10'),
        (7, DATE '2026-02-13', TIME '11:30', TIME '13:00'),
        (8, DATE '2026-02-16', TIME '13:10', TIME '14:40')
    ) AS s(session_no, lesson_date, start_time, end_time)
)
INSERT INTO attendance_sessions (
    id_assignment,
    lesson_date,
    start_time,
    end_time,
    source
)
SELECT
    ta.id_assignment,
    ss.lesson_date,
    ss.start_time,
    ss.end_time,
    'manual'
FROM target_assignment ta
CROSS JOIN session_seed ss;

WITH target_assignment AS (
    SELECT
        ta.id_assignment,
        t.id_user AS teacher_user_id,
        g.id_group
    FROM teaching_assignments ta
    JOIN teachers t ON ta.id_teacher = t.id_teacher
    JOIN user_auth ua ON ua.id_user = t.id_user
    JOIN groups g ON ta.id_group = g.id_group
    JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
    JOIN disciplines d ON e.id_discipline = d.id_discipline
    WHERE ua.login = 'chadov.al'
      AND g.group_name = 'РИС-22-3'
      AND d.discipline_name = 'Качественные и количественные методы'
    LIMIT 1
),
session_seed AS (
    SELECT * FROM (VALUES
        (1, DATE '2026-02-02', TIME '08:00'),
        (2, DATE '2026-02-02', TIME '09:40'),
        (3, DATE '2026-02-04', TIME '11:30'),
        (4, DATE '2026-02-06', TIME '13:10'),
        (5, DATE '2026-02-09', TIME '08:00'),
        (6, DATE '2026-02-11', TIME '09:40'),
        (7, DATE '2026-02-13', TIME '11:30'),
        (8, DATE '2026-02-16', TIME '13:10')
    ) AS s(session_no, lesson_date, start_time)
),
session_scope AS (
    SELECT
        ss.session_no,
        ats.id_session
    FROM session_seed ss
    JOIN target_assignment ta ON TRUE
    JOIN attendance_sessions ats
        ON ats.id_assignment = ta.id_assignment
       AND ats.lesson_date = ss.lesson_date
       AND ats.start_time = ss.start_time
),
student_scope AS (
    SELECT
        s.id_student,
        s.record_book_no
    FROM students s
    JOIN target_assignment ta ON s.id_group = ta.id_group
),
status_seed AS (
    SELECT * FROM (VALUES
        ('RB-RIS22-001', 1, 'present'),
        ('RB-RIS22-001', 2, 'present'),
        ('RB-RIS22-001', 3, 'present'),
        ('RB-RIS22-001', 4, 'absent'),
        ('RB-RIS22-001', 5, 'present'),
        ('RB-RIS22-001', 6, 'present'),
        ('RB-RIS22-001', 7, 'absent'),
        ('RB-RIS22-001', 8, 'present'),

        ('RB-RIS22-002', 1, 'present'),
        ('RB-RIS22-002', 2, 'absent'),
        ('RB-RIS22-002', 3, 'present'),
        ('RB-RIS22-002', 4, 'present'),
        ('RB-RIS22-002', 5, 'present'),
        ('RB-RIS22-002', 6, 'absent'),
        ('RB-RIS22-002', 7, 'present'),
        ('RB-RIS22-002', 8, 'present'),

        ('RB-RIS22-003', 1, 'present'),
        ('RB-RIS22-003', 2, 'present'),
        ('RB-RIS22-003', 3, 'absent'),
        ('RB-RIS22-003', 4, 'present'),
        ('RB-RIS22-003', 5, 'present'),
        ('RB-RIS22-003', 6, 'present'),
        ('RB-RIS22-003', 7, 'present'),
        ('RB-RIS22-003', 8, 'absent'),

        ('RB-RIS22-004', 1, 'present'),
        ('RB-RIS22-004', 2, 'absent'),
        ('RB-RIS22-004', 3, 'present'),
        ('RB-RIS22-004', 4, 'absent'),
        ('RB-RIS22-004', 5, 'present'),
        ('RB-RIS22-004', 6, 'present'),
        ('RB-RIS22-004', 7, 'present'),
        ('RB-RIS22-004', 8, 'present')
    ) AS s(record_book_no, session_no, status)
)
INSERT INTO attendance (
    id_session,
    id_student,
    updated_by_user_id,
    status
)
SELECT
    sess.id_session,
    st.id_student,
    ta.teacher_user_id,
    ss.status
FROM status_seed ss
JOIN student_scope st ON st.record_book_no = ss.record_book_no
JOIN session_scope sess ON sess.session_no = ss.session_no
JOIN target_assignment ta ON TRUE;

NOTIFY pgrst, 'reload schema';

COMMIT;