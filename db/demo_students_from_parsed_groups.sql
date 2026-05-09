-- Демо-наполнение студентов на основе реальных групп,
-- которые появились после импорта расписания с сайта ВШЭ.
-- Преподаватели, дисциплины, группы и назначения НЕ придумываются,
-- а используются только уже существующие в БД после парсинга.

INSERT INTO role (role_name)
VALUES ('student')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO student_statuses (status_name)
VALUES ('обучается')
ON CONFLICT (status_name) DO NOTHING;

DO $$
DECLARE
    v_student_role_id integer;
    v_active_status_id integer;

    v_group record;

    v_id_user integer;
    v_record_book_no varchar(50);

    v_counter integer := 0;
    v_i integer;

    v_names text[] := ARRAY[
        'Алексей', 'Мария', 'Дмитрий', 'Анна', 'Иван',
        'Екатерина', 'Никита', 'Софья', 'Михаил', 'Алина',
        'Артём', 'Полина', 'Максим', 'Виктория', 'Кирилл',
        'Дарья', 'Егор', 'Ксения', 'Матвей', 'Елизавета',
        'Илья', 'Варвара', 'Роман', 'Ульяна', 'Тимофей',
        'Анастасия', 'Даниил', 'Арина', 'Глеб', 'Яна'
    ];

    v_surnames text[] := ARRAY[
        'Анучин', 'Белослудцева', 'Гирева', 'Зорина', 'Пакулина',
        'Попов', 'Фалалеева', 'Федурина', 'Харитонова', 'Смирнов',
        'Кузнецова', 'Волков', 'Морозова', 'Соколова', 'Новиков',
        'Орлова', 'Павлов', 'Козлова', 'Лебедев', 'Егорова',
        'Алексеева', 'Васильев', 'Тихонова', 'Комаров', 'Макарова',
        'Беляев', 'Фролова', 'Громов', 'Николаева', 'Соловьёв'
    ];

    v_fathernames text[] := ARRAY[
        'Алексеевич', 'Дмитриевна', 'Игоревич', 'Андреевна', 'Сергеевич',
        'Олеговна', 'Максимович', 'Павловна', 'Романович', 'Ильинична',
        'Владимирович', 'Евгеньевна', 'Михайлович', 'Артёмовна', 'Николаевич',
        'Константиновна', 'Денисович', 'Викторовна', 'Петрович', 'Станиславовна',
        'Георгиевич', 'Леонидовна', 'Борисович', 'Анатольевна', 'Фёдорович',
        'Александровна', 'Валерьевич', 'Руслановна', 'Кириллович', 'Олеговна'
    ];
BEGIN
    SELECT id_role
    INTO v_student_role_id
    FROM role
    WHERE role_name = 'student'
    LIMIT 1;

    SELECT id_status
    INTO v_active_status_id
    FROM student_statuses
    WHERE status_name = 'обучается'
    LIMIT 1;

    FOR v_group IN
        SELECT DISTINCT
            g.id_group,
            g.group_name
        FROM groups g
        JOIN teaching_assignments ta ON ta.id_group = g.id_group
        JOIN schedule_entries se ON se.id_assignment = ta.id_assignment
        ORDER BY g.group_name
    LOOP
        -- Добавляем по 4 студента в каждую группу, которая реально есть в расписании.
        FOR v_i IN 1..4 LOOP
            v_counter := v_counter + 1;
            v_record_book_no := 'AUTOHSE-' || v_group.id_group || '-' || v_i;

            IF EXISTS (
                SELECT 1
                FROM students
                WHERE record_book_no = v_record_book_no
            ) THEN
                CONTINUE;
            END IF;

            INSERT INTO users (
                id_role,
                name,
                surname,
                fathername
            )
            VALUES (
                v_student_role_id,
                v_names[((v_counter - 1) % array_length(v_names, 1)) + 1],
                v_surnames[((v_counter - 1) % array_length(v_surnames, 1)) + 1],
                v_fathernames[((v_counter - 1) % array_length(v_fathernames, 1)) + 1]
            )
            RETURNING id_user INTO v_id_user;

            INSERT INTO students (
                id_user,
                id_group,
                record_book_no,
                id_status
            )
            VALUES (
                v_id_user,
                v_group.id_group,
                v_record_book_no,
                v_active_status_id
            );
        END LOOP;
    END LOOP;
END $$;

-- Заполнение посещаемости для автоматически созданных студентов.
-- Статусы распределяются случайно, чтобы в аналитике были разные проценты посещаемости.

INSERT INTO attendance (
    id_session,
    id_student,
    updated_by_user_id,
    status
)
SELECT
    ats.id_session,
    s.id_student,
    NULL,
    CASE
        WHEN random() < 0.82 THEN 'present'
        ELSE 'absent'
    END AS status
FROM attendance_sessions ats
JOIN teaching_assignments ta ON ta.id_assignment = ats.id_assignment
JOIN students s ON s.id_group = ta.id_group
WHERE s.record_book_no LIKE 'AUTOHSE-%'
ON CONFLICT (id_session, id_student)
DO NOTHING;

-- Создаём формулы оценивания для назначений, где формулы ещё нет.

INSERT INTO grading_formulas (
    id_assignment,
    formula_text,
    updated_at
)
SELECT DISTINCT
    ta.id_assignment,
    '0.25*ЛР1 + 0.25*ЛР2 + 0.20*КР + 0.30*Экзамен',
    now()
FROM teaching_assignments ta
JOIN schedule_entries se ON se.id_assignment = ta.id_assignment
WHERE NOT EXISTS (
    SELECT 1
    FROM grading_formulas gf
    WHERE gf.id_assignment = ta.id_assignment
);

-- Создаём элементы контроля для новых формул.

WITH formulas_without_elements AS (
    SELECT gf.id_formula
    FROM grading_formulas gf
    WHERE NOT EXISTS (
        SELECT 1
        FROM control_elements ce
        WHERE ce.id_formula = gf.id_formula
    )
),
elements AS (
    SELECT *
    FROM (
        VALUES
            ('ЛР1', 0.25::numeric, 1, 'lab'),
            ('ЛР2', 0.25::numeric, 2, 'lab'),
            ('КР', 0.20::numeric, 3, 'control'),
            ('Экзамен', 0.30::numeric, 4, 'exam')
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
    f.id_formula,
    e.element_name,
    e.weight,
    e.order_no,
    e.control_type
FROM formulas_without_elements f
CROSS JOIN elements e;

-- Создаём итоговые ведомости по назначениям.

INSERT INTO grade_sheets (
    id_assignment,
    sheet_type,
    status,
    submitted_at,
    approved_at
)
SELECT DISTINCT
    ta.id_assignment,
    'final',
    'approved',
    now(),
    now()
FROM teaching_assignments ta
JOIN schedule_entries se ON se.id_assignment = ta.id_assignment
ON CONFLICT (id_assignment, sheet_type)
DO NOTHING;

-- Создаём текущие ведомости по назначениям.

INSERT INTO grade_sheets (
    id_assignment,
    sheet_type,
    status,
    submitted_at,
    approved_at
)
SELECT DISTINCT
    ta.id_assignment,
    'gradebook',
    'approved',
    now(),
    now()
FROM teaching_assignments ta
JOIN schedule_entries se ON se.id_assignment = ta.id_assignment
ON CONFLICT (id_assignment, sheet_type)
DO NOTHING;

-- Заполняем оценки по контрольным элементам.
-- Небольшая часть оценок специально ниже 4, чтобы работали пересдачи и риски.

INSERT INTO grades (
    id_sheet,
    id_student,
    id_element,
    grade_value,
    comment
)
SELECT
    gs.id_sheet,
    s.id_student,
    ce.id_element,
    CASE
        WHEN random() < 0.14 THEN ROUND((2 + random() * 1.8)::numeric, 1)
        ELSE ROUND((4 + random() * 6)::numeric, 1)
    END AS grade_value,
    NULL
FROM grade_sheets gs
JOIN teaching_assignments ta ON ta.id_assignment = gs.id_assignment
JOIN students s ON s.id_group = ta.id_group
JOIN grading_formulas gf ON gf.id_assignment = ta.id_assignment
JOIN control_elements ce ON ce.id_formula = gf.id_formula
WHERE s.record_book_no LIKE 'AUTOHSE-%'
ON CONFLICT (id_sheet, id_student, id_element)
DO NOTHING;

-- Рассчитываем итоговую оценку как среднее по заполненным оценкам.
-- Для демо-данных этого достаточно, а основная формула дисциплины всё равно хранится отдельно.

INSERT INTO final_grades (
    id_sheet,
    id_student,
    final_grade
)
SELECT
    g.id_sheet,
    g.id_student,
    ROUND(AVG(g.grade_value)::numeric, 1) AS final_grade
FROM grades g
JOIN grade_sheets gs ON gs.id_sheet = g.id_sheet
WHERE gs.sheet_type IN ('final', 'gradebook')
  AND g.grade_value IS NOT NULL
GROUP BY g.id_sheet, g.id_student
ON CONFLICT (id_sheet, id_student)
DO UPDATE SET final_grade = EXCLUDED.final_grade;