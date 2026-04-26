BEGIN;

-- 1. Создаем view для получения ведомости преподавателя
CREATE OR REPLACE VIEW teacher_gradebook_view AS
WITH selected_sheets AS (
    SELECT DISTINCT ON (id_assignment)
        id_sheet,
        id_assignment,
        approved_by_user_id,
        sheet_type,
        status,
        submitted_at,
        approved_at
    FROM grade_sheets
    WHERE sheet_type = 'gradebook'
    ORDER BY id_assignment, id_sheet DESC
)
SELECT
    gs.id_sheet,
    gs.status AS sheet_status,
    gs.submitted_at,
    gs.approved_at,

    t.id_user AS teacher_user_id,
    ta.id_assignment,

    d.id_discipline,
    d.discipline_name,

    g.id_group,
    g.group_name,
    g.course_no,

    s.id_student,
    su.surname AS student_surname,
    su.name AS student_name,
    su.fathername AS student_fathername,
    s.record_book_no,

    ce.id_element,
    ce.element_name,
    ce.order_no AS element_order_no,
    ce.control_type,

    gr.id_grade,
    gr.grade_value,

    fg.id_final_grade,
    fg.final_grade
FROM selected_sheets gs
JOIN teaching_assignments ta ON gs.id_assignment = ta.id_assignment
JOIN teachers t ON ta.id_teacher = t.id_teacher
JOIN groups g ON ta.id_group = g.id_group
JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
JOIN disciplines d ON e.id_discipline = d.id_discipline
JOIN students s ON s.id_group = g.id_group
JOIN users su ON s.id_user = su.id_user
JOIN grading_formulas gf ON gf.id_assignment = ta.id_assignment
JOIN control_elements ce ON ce.id_formula = gf.id_formula
LEFT JOIN grades gr
    ON gr.id_sheet = gs.id_sheet
   AND gr.id_student = s.id_student
   AND gr.id_element = ce.id_element
LEFT JOIN final_grades fg
    ON fg.id_sheet = gs.id_sheet
   AND fg.id_student = s.id_student
WHERE ta.is_active = TRUE;

-- 2. Убедимся, что для Чадова есть формула
WITH target_assignment AS (
    SELECT ta.id_assignment
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
)
INSERT INTO grading_formulas (id_assignment, formula_text, updated_at)
SELECT
    id_assignment,
    '0.5*кр + 0.4*экз + 0.1*аудит',
    NOW()
FROM target_assignment ta
WHERE NOT EXISTS (
    SELECT 1
    FROM grading_formulas gf
    WHERE gf.id_assignment = ta.id_assignment
);

-- 3. Создаем элементы контроля для ведомости
WITH target_formula AS (
    SELECT gf.id_formula
    FROM grading_formulas gf
    JOIN teaching_assignments ta ON gf.id_assignment = ta.id_assignment
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
element_seed AS (
    SELECT * FROM (VALUES
        ('лр1', 10.00, 1, 'lab'),
        ('лр2', 10.00, 2, 'lab'),
        ('лр3', 10.00, 3, 'lab'),
        ('кр1', 20.00, 4, 'control_work'),
        ('накоп', 30.00, 5, 'accumulated'),
        ('экз', 30.00, 6, 'exam')
    ) AS e(element_name, weight, order_no, control_type)
)
INSERT INTO control_elements (
    id_formula,
    element_name,
    weight,
    order_no,
    control_type
)
SELECT
    tf.id_formula,
    es.element_name,
    es.weight,
    es.order_no,
    es.control_type
FROM target_formula tf
CROSS JOIN element_seed es
WHERE NOT EXISTS (
    SELECT 1
    FROM control_elements ce
    WHERE ce.id_formula = tf.id_formula
      AND ce.element_name = es.element_name
);

-- 4. Создаем ведомость для выбранного назначения
WITH target_assignment AS (
    SELECT ta.id_assignment
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
)
INSERT INTO grade_sheets (
    id_assignment,
    sheet_type,
    status,
    submitted_at,
    approved_at
)
SELECT
    id_assignment,
    'gradebook',
    'draft',
    NULL,
    NULL
FROM target_assignment ta
WHERE NOT EXISTS (
    SELECT 1
    FROM grade_sheets gs
    WHERE gs.id_assignment = ta.id_assignment
      AND gs.sheet_type = 'gradebook'
);

-- 5. Создаем пустые оценки по элементам контроля
WITH target_scope AS (
    SELECT
        gs.id_sheet,
        g.id_group,
        gf.id_formula
    FROM grade_sheets gs
    JOIN teaching_assignments ta ON gs.id_assignment = ta.id_assignment
    JOIN teachers t ON ta.id_teacher = t.id_teacher
    JOIN user_auth ua ON ua.id_user = t.id_user
    JOIN groups g ON ta.id_group = g.id_group
    JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
    JOIN disciplines d ON e.id_discipline = d.id_discipline
    JOIN grading_formulas gf ON gf.id_assignment = ta.id_assignment
    WHERE ua.login = 'chadov.al'
      AND g.group_name = 'РИС-22-3'
      AND d.discipline_name = 'Качественные и количественные методы'
      AND gs.sheet_type = 'gradebook'
    ORDER BY gs.id_sheet DESC
    LIMIT 1
),
student_scope AS (
    SELECT s.id_student
    FROM students s
    JOIN target_scope ts ON s.id_group = ts.id_group
),
element_scope AS (
    SELECT ce.id_element
    FROM control_elements ce
    JOIN target_scope ts ON ce.id_formula = ts.id_formula
)
INSERT INTO grades (
    id_sheet,
    id_student,
    id_element,
    grade_value,
    comment
)
SELECT
    ts.id_sheet,
    ss.id_student,
    es.id_element,
    NULL,
    NULL
FROM target_scope ts
CROSS JOIN student_scope ss
CROSS JOIN element_scope es
ON CONFLICT (id_sheet, id_student, id_element) DO NOTHING;

-- 6. Создаем пустые итоговые оценки
WITH target_scope AS (
    SELECT
        gs.id_sheet,
        g.id_group
    FROM grade_sheets gs
    JOIN teaching_assignments ta ON gs.id_assignment = ta.id_assignment
    JOIN teachers t ON ta.id_teacher = t.id_teacher
    JOIN user_auth ua ON ua.id_user = t.id_user
    JOIN groups g ON ta.id_group = g.id_group
    JOIN enrollments e ON ta.id_enrollment = e.id_enrollment
    JOIN disciplines d ON e.id_discipline = d.id_discipline
    WHERE ua.login = 'chadov.al'
      AND g.group_name = 'РИС-22-3'
      AND d.discipline_name = 'Качественные и количественные методы'
      AND gs.sheet_type = 'gradebook'
    ORDER BY gs.id_sheet DESC
    LIMIT 1
),
student_scope AS (
    SELECT s.id_student
    FROM students s
    JOIN target_scope ts ON s.id_group = ts.id_group
)
INSERT INTO final_grades (
    id_sheet,
    id_student,
    final_grade
)
SELECT
    ts.id_sheet,
    ss.id_student,
    NULL
FROM target_scope ts
CROSS JOIN student_scope ss
ON CONFLICT (id_sheet, id_student) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;