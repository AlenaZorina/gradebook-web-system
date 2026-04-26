BEGIN;

TRUNCATE TABLE
    attendance,
    attendance_sessions,
    schedule_entries,
    schedule_imports,
    error_reports,
    student_status_history,
    final_grades,
    grades,
    grade_sheets,
    control_elements,
    grading_formulas,
    teaching_assignments,
    students,
    teachers,
    user_auth,
    users,
    enrollments,
    disciplines,
    groups,
    programs,
    student_statuses,
    degree_levels,
    role
RESTART IDENTITY CASCADE;

-- 1. Справочники
INSERT INTO role (role_name)
VALUES
    ('student'),
    ('teacher'),
    ('office_staff');

INSERT INTO degree_levels (degree_level_name)
VALUES
    ('Бакалавриат'),
    ('Магистратура');

INSERT INTO student_statuses (status_name)
VALUES
    ('active'),
    ('expelled'),
    ('restored');

-- 2. Образовательные программы
INSERT INTO programs (program_name, id_degree_level)
VALUES
(
    'Разработка информационных систем для бизнеса',
    (SELECT id_degree_level FROM degree_levels WHERE degree_level_name = 'Бакалавриат')
),
(
    'Юриспруденция',
    (SELECT id_degree_level FROM degree_levels WHERE degree_level_name = 'Бакалавриат')
),
(
    'Международный бакалавриат',
    (SELECT id_degree_level FROM degree_levels WHERE degree_level_name = 'Бакалавриат')
);

-- 3. Группы
INSERT INTO groups (group_name, id_program, course_no, admission_year, is_active)
VALUES
(
    'РИС-22-3',
    (SELECT id_program FROM programs WHERE program_name = 'Разработка информационных систем для бизнеса'),
    4,
    2022,
    TRUE
),
(
    'РИС-23-1',
    (SELECT id_program FROM programs WHERE program_name = 'Разработка информационных систем для бизнеса'),
    3,
    2023,
    TRUE
),
(
    'РИС-24-3',
    (SELECT id_program FROM programs WHERE program_name = 'Разработка информационных систем для бизнеса'),
    2,
    2024,
    TRUE
),
(
    'Ю-24-4',
    (SELECT id_program FROM programs WHERE program_name = 'Юриспруденция'),
    2,
    2024,
    TRUE
),
(
    'МБ-22-1',
    (SELECT id_program FROM programs WHERE program_name = 'Международный бакалавриат'),
    4,
    2022,
    TRUE
),
(
    'МБ-23-1',
    (SELECT id_program FROM programs WHERE program_name = 'Международный бакалавриат'),
    3,
    2023,
    TRUE
),
(
    'Ю-23-2',
    (SELECT id_program FROM programs WHERE program_name = 'Юриспруденция'),
    3,
    2023,
    TRUE
);

-- 4. Пользователь учебного офиса
INSERT INTO users (id_role, name, surname, fathername)
VALUES
(
    (SELECT id_role FROM role WHERE role_name = 'office_staff'),
    'Елена',
    'Смирнова',
    'Олеговна'
);

INSERT INTO user_auth (id_user, login, password_hash)
VALUES
(
    (SELECT id_user FROM users WHERE surname = 'Смирнова' AND name = 'Елена'),
    'office1',
    'office123'
);

-- 5. Преподаватели
WITH teacher_seed AS (
    SELECT * FROM (VALUES
        ('chadov.al',      'Алексей',   'Чадов',       'Леонидович', 'кафедра ИТБ',                                   'Доцент'),
        ('markvirer.vd',   'Владлена',  'Марквирер',   'Дмитриевна', 'кафедра ИТБ',                                   'Старший преподаватель'),
        ('avliyarova.va',  'Вероника',  'Авлиярова',   'Анзоровна',  'Кафедра теории права и юридической практики',   'Доцент'),
        ('vikenteva.ol',   'Ольга',     'Викентьева',  'Леонидовна', 'кафедра ИТБ',                                   'Доцент'),
        ('grabar.vv',      'Вадим',     'Грабарь',     'Валерьевич', 'Департамент менеджмента',                       'Доцент'),
        ('shakina.ma',     'Марина',    'Шакина',      'Анатольевна','Департамент менеджмента',                       'Старший преподаватель')
    ) AS t(login, name, surname, fathername, department, position)
)
INSERT INTO users (id_role, name, surname, fathername)
SELECT
    (SELECT id_role FROM role WHERE role_name = 'teacher'),
    t.name,
    t.surname,
    t.fathername
FROM teacher_seed t;

WITH teacher_seed AS (
    SELECT * FROM (VALUES
        ('chadov.al',      'Алексей',   'Чадов',       'Леонидович', 'кафедра ИТБ',                                   'Доцент'),
        ('markvirer.vd',   'Владлена',  'Марквирер',   'Дмитриевна', 'кафедра ИТБ',                                   'Старший преподаватель'),
        ('avliyarova.va',  'Вероника',  'Авлиярова',   'Анзоровна',  'Кафедра теории права и юридической практики',   'Доцент'),
        ('vikenteva.ol',   'Ольга',     'Викентьева',  'Леонидовна', 'кафедра ИТБ',                                   'Доцент'),
        ('grabar.vv',      'Вадим',     'Грабарь',     'Валерьевич', 'Департамент менеджмента',                       'Доцент'),
        ('shakina.ma',     'Марина',    'Шакина',      'Анатольевна','Департамент менеджмента',                       'Старший преподаватель')
    ) AS t(login, name, surname, fathername, department, position)
)
INSERT INTO user_auth (id_user, login, password_hash)
SELECT
    u.id_user,
    t.login,
    'teacher123'
FROM teacher_seed t
JOIN users u
    ON u.name = t.name
   AND u.surname = t.surname
   AND COALESCE(u.fathername, '') = COALESCE(t.fathername, '');

WITH teacher_seed AS (
    SELECT * FROM (VALUES
        ('chadov.al',      'Алексей',   'Чадов',       'Леонидович', 'кафедра ИТБ',                                   'Доцент'),
        ('markvirer.vd',   'Владлена',  'Марквирер',   'Дмитриевна', 'кафедра ИТБ',                                   'Старший преподаватель'),
        ('avliyarova.va',  'Вероника',  'Авлиярова',   'Анзоровна',  'Кафедра теории права и юридической практики',   'Доцент'),
        ('vikenteva.ol',   'Ольга',     'Викентьева',  'Леонидовна', 'кафедра ИТБ',                                   'Доцент'),
        ('grabar.vv',      'Вадим',     'Грабарь',     'Валерьевич', 'Департамент менеджмента',                       'Доцент'),
        ('shakina.ma',     'Марина',    'Шакина',      'Анатольевна','Департамент менеджмента',                       'Старший преподаватель')
    ) AS t(login, name, surname, fathername, department, position)
)
INSERT INTO teachers (id_user, department, position)
SELECT
    u.id_user,
    t.department,
    t.position
FROM teacher_seed t
JOIN users u
    ON u.name = t.name
   AND u.surname = t.surname
   AND COALESCE(u.fathername, '') = COALESCE(t.fathername, '');

-- 6. Студенты (по 4 на каждую группу)
WITH student_seed AS (
    SELECT * FROM (VALUES
        ('РИС-22-3', 'anuchina.aa',      'Алёна',       'Анучина',      'Александровна', 'RB-RIS22-001'),
        ('РИС-22-3', 'pakulina.ul',      'Ульяна',      'Пакулина',     'Леонидовна',    'RB-RIS22-002'),
        ('РИС-22-3', 'orlov.dm',         'Дмитрий',     'Орлов',        'Михайлович',    'RB-RIS22-003'),
        ('РИС-22-3', 'ermakova.ps',      'Полина',      'Ермакова',     'Сергеевна',     'RB-RIS22-004'),

        ('РИС-23-1', 'kolesnikov.eg',    'Егор',        'Колесников',   'Григорьевич',   'RB-RIS23-001'),
        ('РИС-23-1', 'belova.sa',        'Софья',       'Белова',       'Андреевна',     'RB-RIS23-002'),
        ('РИС-23-1', 'zotov.ka',         'Кирилл',      'Зотов',        'Александрович', 'RB-RIS23-003'),
        ('РИС-23-1', 'dementeva.ms',     'Мария',       'Дементьева',   'Сергеевна',     'RB-RIS23-004'),

        ('РИС-24-3', 'lobanov.av',       'Артём',       'Лобанов',      'Владимирович',  'RB-RIS24-001'),
        ('РИС-24-3', 'kuznetsova.ds',    'Дарья',       'Кузнецова',    'Сергеевна',     'RB-RIS24-002'),
        ('РИС-24-3', 'semenov.na',       'Никита',      'Семёнов',      'Александрович', 'RB-RIS24-003'),
        ('РИС-24-3', 'frolova.vi',       'Валерия',     'Фролова',      'Игоревна',      'RB-RIS24-004'),

        ('Ю-24-4',   'kovaleva.an',      'Анна',        'Ковалева',     'Николаевна',    'RB-LAW24-001'),
        ('Ю-24-4',   'vlasov.il',        'Илья',        'Власов',       'Львович',       'RB-LAW24-002'),
        ('Ю-24-4',   'guseva.ek',        'Екатерина',   'Гусева',       'Константиновна','RB-LAW24-003'),
        ('Ю-24-4',   'rozhkov.mv',       'Максим',      'Рожков',       'Викторович',    'RB-LAW24-004'),

        ('МБ-22-1',  'sergeeva.al',      'Алина',       'Сергеева',     'Львовна',       'RB-MB22-001'),
        ('МБ-22-1',  'morozov.do',       'Даниил',      'Морозов',      'Олегович',      'RB-MB22-002'),
        ('МБ-22-1',  'abramova.vv',      'Вероника',    'Абрамова',     'Валерьевна',    'RB-MB22-003'),
        ('МБ-22-1',  'basyrov.ta',       'Тимур',       'Басыров',      'Альбертович',   'RB-MB22-004'),

        ('МБ-23-1',  'popova.el',        'Елизавета',   'Попова',       'Леонидовна',    'RB-MB23-001'),
        ('МБ-23-1',  'vishnyakov.rm',    'Роман',       'Вишняков',     'Михайлович',    'RB-MB23-002'),
        ('МБ-23-1',  'sokolova.ar',      'Арина',       'Соколова',     'Руслановна',    'RB-MB23-003'),
        ('МБ-23-1',  'titov.pd',         'Павел',       'Титов',        'Дмитриевич',    'RB-MB23-004'),

        ('Ю-23-2',   'chernova.ma',      'Марина',      'Чернова',      'Александровна', 'RB-LAW23-001'),
        ('Ю-23-2',   'nikitin.vs',       'Владислав',   'Никитин',      'Сергеевич',     'RB-LAW23-002'),
        ('Ю-23-2',   'lebedeva.an',      'Анастасия',   'Лебедева',     'Николаевна',    'RB-LAW23-003'),
        ('Ю-23-2',   'martynov.og',      'Олег',        'Мартынов',     'Геннадьевич',   'RB-LAW23-004')
    ) AS s(group_name, login, name, surname, fathername, record_book_no)
)
INSERT INTO users (id_role, name, surname, fathername)
SELECT
    (SELECT id_role FROM role WHERE role_name = 'student'),
    s.name,
    s.surname,
    s.fathername
FROM student_seed s;

WITH student_seed AS (
    SELECT * FROM (VALUES
        ('РИС-22-3', 'anuchina.aa',      'Алёна',       'Анучина',      'Александровна', 'RB-RIS22-001'),
        ('РИС-22-3', 'pakulina.ul',      'Ульяна',      'Пакулина',     'Леонидовна',    'RB-RIS22-002'),
        ('РИС-22-3', 'orlov.dm',         'Дмитрий',     'Орлов',        'Михайлович',    'RB-RIS22-003'),
        ('РИС-22-3', 'ermakova.ps',      'Полина',      'Ермакова',     'Сергеевна',     'RB-RIS22-004'),

        ('РИС-23-1', 'kolesnikov.eg',    'Егор',        'Колесников',   'Григорьевич',   'RB-RIS23-001'),
        ('РИС-23-1', 'belova.sa',        'Софья',       'Белова',       'Андреевна',     'RB-RIS23-002'),
        ('РИС-23-1', 'zotov.ka',         'Кирилл',      'Зотов',        'Александрович', 'RB-RIS23-003'),
        ('РИС-23-1', 'dementeva.ms',     'Мария',       'Дементьева',   'Сергеевна',     'RB-RIS23-004'),

        ('РИС-24-3', 'lobanov.av',       'Артём',       'Лобанов',      'Владимирович',  'RB-RIS24-001'),
        ('РИС-24-3', 'kuznetsova.ds',    'Дарья',       'Кузнецова',    'Сергеевна',     'RB-RIS24-002'),
        ('РИС-24-3', 'semenov.na',       'Никита',      'Семёнов',      'Александрович', 'RB-RIS24-003'),
        ('РИС-24-3', 'frolova.vi',       'Валерия',     'Фролова',      'Игоревна',      'RB-RIS24-004'),

        ('Ю-24-4',   'kovaleva.an',      'Анна',        'Ковалева',     'Николаевна',    'RB-LAW24-001'),
        ('Ю-24-4',   'vlasov.il',        'Илья',        'Власов',       'Львович',       'RB-LAW24-002'),
        ('Ю-24-4',   'guseva.ek',        'Екатерина',   'Гусева',       'Константиновна','RB-LAW24-003'),
        ('Ю-24-4',   'rozhkov.mv',       'Максим',      'Рожков',       'Викторович',    'RB-LAW24-004'),

        ('МБ-22-1',  'sergeeva.al',      'Алина',       'Сергеева',     'Львовна',       'RB-MB22-001'),
        ('МБ-22-1',  'morozov.do',       'Даниил',      'Морозов',      'Олегович',      'RB-MB22-002'),
        ('МБ-22-1',  'abramova.vv',      'Вероника',    'Абрамова',     'Валерьевна',    'RB-MB22-003'),
        ('МБ-22-1',  'basyrov.ta',       'Тимур',       'Басыров',      'Альбертович',   'RB-MB22-004'),

        ('МБ-23-1',  'popova.el',        'Елизавета',   'Попова',       'Леонидовна',    'RB-MB23-001'),
        ('МБ-23-1',  'vishnyakov.rm',    'Роман',       'Вишняков',     'Михайлович',    'RB-MB23-002'),
        ('МБ-23-1',  'sokolova.ar',      'Арина',       'Соколова',     'Руслановна',    'RB-MB23-003'),
        ('МБ-23-1',  'titov.pd',         'Павел',       'Титов',        'Дмитриевич',    'RB-MB23-004'),

        ('Ю-23-2',   'chernova.ma',      'Марина',      'Чернова',      'Александровна', 'RB-LAW23-001'),
        ('Ю-23-2',   'nikitin.vs',       'Владислав',   'Никитин',      'Сергеевич',     'RB-LAW23-002'),
        ('Ю-23-2',   'lebedeva.an',      'Анастасия',   'Лебедева',     'Николаевна',    'RB-LAW23-003'),
        ('Ю-23-2',   'martynov.og',      'Олег',        'Мартынов',     'Геннадьевич',   'RB-LAW23-004')
    ) AS s(group_name, login, name, surname, fathername, record_book_no)
)
INSERT INTO user_auth (id_user, login, password_hash)
SELECT
    u.id_user,
    s.login,
    'student123'
FROM student_seed s
JOIN users u
    ON u.name = s.name
   AND u.surname = s.surname
   AND COALESCE(u.fathername, '') = COALESCE(s.fathername, '');

WITH student_seed AS (
    SELECT * FROM (VALUES
        ('РИС-22-3', 'anuchina.aa',      'Алёна',       'Анучина',      'Александровна', 'RB-RIS22-001'),
        ('РИС-22-3', 'pakulina.ul',      'Ульяна',      'Пакулина',     'Леонидовна',    'RB-RIS22-002'),
        ('РИС-22-3', 'orlov.dm',         'Дмитрий',     'Орлов',        'Михайлович',    'RB-RIS22-003'),
        ('РИС-22-3', 'ermakova.ps',      'Полина',      'Ермакова',     'Сергеевна',     'RB-RIS22-004'),

        ('РИС-23-1', 'kolesnikov.eg',    'Егор',        'Колесников',   'Григорьевич',   'RB-RIS23-001'),
        ('РИС-23-1', 'belova.sa',        'Софья',       'Белова',       'Андреевна',     'RB-RIS23-002'),
        ('РИС-23-1', 'zotov.ka',         'Кирилл',      'Зотов',        'Александрович', 'RB-RIS23-003'),
        ('РИС-23-1', 'dementeva.ms',     'Мария',       'Дементьева',   'Сергеевна',     'RB-RIS23-004'),

        ('РИС-24-3', 'lobanov.av',       'Артём',       'Лобанов',      'Владимирович',  'RB-RIS24-001'),
        ('РИС-24-3', 'kuznetsova.ds',    'Дарья',       'Кузнецова',    'Сергеевна',     'RB-RIS24-002'),
        ('РИС-24-3', 'semenov.na',       'Никита',      'Семёнов',      'Александрович', 'RB-RIS24-003'),
        ('РИС-24-3', 'frolova.vi',       'Валерия',     'Фролова',      'Игоревна',      'RB-RIS24-004'),

        ('Ю-24-4',   'kovaleva.an',      'Анна',        'Ковалева',     'Николаевна',    'RB-LAW24-001'),
        ('Ю-24-4',   'vlasov.il',        'Илья',        'Власов',       'Львович',       'RB-LAW24-002'),
        ('Ю-24-4',   'guseva.ek',        'Екатерина',   'Гусева',       'Константиновна','RB-LAW24-003'),
        ('Ю-24-4',   'rozhkov.mv',       'Максим',      'Рожков',       'Викторович',    'RB-LAW24-004'),

        ('МБ-22-1',  'sergeeva.al',      'Алина',       'Сергеева',     'Львовна',       'RB-MB22-001'),
        ('МБ-22-1',  'morozov.do',       'Даниил',      'Морозов',      'Олегович',      'RB-MB22-002'),
        ('МБ-22-1',  'abramova.vv',      'Вероника',    'Абрамова',     'Валерьевна',    'RB-MB22-003'),
        ('МБ-22-1',  'basyrov.ta',       'Тимур',       'Басыров',      'Альбертович',   'RB-MB22-004'),

        ('МБ-23-1',  'popova.el',        'Елизавета',   'Попова',       'Леонидовна',    'RB-MB23-001'),
        ('МБ-23-1',  'vishnyakov.rm',    'Роман',       'Вишняков',     'Михайлович',    'RB-MB23-002'),
        ('МБ-23-1',  'sokolova.ar',      'Арина',       'Соколова',     'Руслановна',    'RB-MB23-003'),
        ('МБ-23-1',  'titov.pd',         'Павел',       'Титов',        'Дмитриевич',    'RB-MB23-004'),

        ('Ю-23-2',   'chernova.ma',      'Марина',      'Чернова',      'Александровна', 'RB-LAW23-001'),
        ('Ю-23-2',   'nikitin.vs',       'Владислав',   'Никитин',      'Сергеевич',     'RB-LAW23-002'),
        ('Ю-23-2',   'lebedeva.an',      'Анастасия',   'Лебедева',     'Николаевна',    'RB-LAW23-003'),
        ('Ю-23-2',   'martynov.og',      'Олег',        'Мартынов',     'Геннадьевич',   'RB-LAW23-004')
    ) AS s(group_name, login, name, surname, fathername, record_book_no)
)
INSERT INTO students (id_user, id_group, record_book_no, id_status)
SELECT
    u.id_user,
    g.id_group,
    s.record_book_no,
    (SELECT id_status FROM student_statuses WHERE status_name = 'active')
FROM student_seed s
JOIN users u
    ON u.name = s.name
   AND u.surname = s.surname
   AND COALESCE(u.fathername, '') = COALESCE(s.fathername, '')
JOIN groups g
    ON g.group_name = s.group_name;

-- 7. Дисциплины
INSERT INTO disciplines (discipline_name, pud_url)
VALUES
('Качественные и количественные методы', 'https://pud.example/quantitative-methods'),
('Введение в DevOps', 'https://pud.example/devops'),
('Прикладная информатика', 'https://pud.example/applied-informatics'),
('Уголовное право', 'https://pud.example/criminal-law'),
('Экономика', 'https://pud.example/economics'),
('Лидерство и управление командой', 'https://pud.example/leadership'),
('Корпоративное право', 'https://pud.example/corporate-law'),
('Введение в криминалистику', 'https://pud.example/criminology');

-- 8. Enrollment и teaching assignment
WITH assignment_seed AS (
    SELECT * FROM (VALUES
        ('Качественные и количественные методы', 'РИС-22-3', 'chadov.al',     1, 1),
        ('Введение в DevOps',                     'РИС-23-1', 'vikenteva.ol',  1, 3),
        ('Прикладная информатика',               'РИС-23-1', 'markvirer.vd',  2, 2),
        ('Уголовное право',                      'Ю-24-4',   'avliyarova.va', 1, 2),
        ('Экономика',                            'МБ-22-1',  'shakina.ma',    1, 2),
        ('Лидерство и управление командой',      'РИС-23-1', 'grabar.vv',     2, 2),
        ('Лидерство и управление командой',      'РИС-22-3', 'grabar.vv',     1, 2),
        ('Лидерство и управление командой',      'РИС-24-3', 'grabar.vv',     2, 2),
        ('Корпоративное право',                  'МБ-23-1',  'avliyarova.va', 3, 3),
        ('Введение в криминалистику',            'Ю-23-2',   'shakina.ma',    4, 4)
    ) AS a(discipline_name, group_name, teacher_login, start_module_no, end_module_no)
)
INSERT INTO enrollments (id_program, id_discipline, course_no, start_module_no, end_module_no)
SELECT DISTINCT
    g.id_program,
    d.id_discipline,
    g.course_no,
    a.start_module_no,
    a.end_module_no
FROM assignment_seed a
JOIN groups g
    ON g.group_name = a.group_name
JOIN disciplines d
    ON d.discipline_name = a.discipline_name;

WITH assignment_seed AS (
    SELECT * FROM (VALUES
        ('Качественные и количественные методы', 'РИС-22-3', 'chadov.al',     1, 1),
        ('Введение в DevOps',                     'РИС-23-1', 'vikenteva.ol',  1, 3),
        ('Прикладная информатика',               'РИС-23-1', 'markvirer.vd',  2, 2),
        ('Уголовное право',                      'Ю-24-4',   'avliyarova.va', 1, 2),
        ('Экономика',                            'МБ-22-1',  'shakina.ma',    1, 2),
        ('Лидерство и управление командой',      'РИС-23-1', 'grabar.vv',     2, 2),
        ('Лидерство и управление командой',      'РИС-22-3', 'grabar.vv',     1, 2),
        ('Лидерство и управление командой',      'РИС-24-3', 'grabar.vv',     2, 2),
        ('Корпоративное право',                  'МБ-23-1',  'avliyarova.va', 3, 3),
        ('Введение в криминалистику',            'Ю-23-2',   'shakina.ma',    4, 4)
    ) AS a(discipline_name, group_name, teacher_login, start_module_no, end_module_no)
)
INSERT INTO teaching_assignments (id_teacher, id_group, id_enrollment, academic_year, is_active)
SELECT
    t.id_teacher,
    g.id_group,
    e.id_enrollment,
    '2025/2026',
    TRUE
FROM assignment_seed a
JOIN groups g
    ON g.group_name = a.group_name
JOIN disciplines d
    ON d.discipline_name = a.discipline_name
JOIN enrollments e
    ON e.id_program = g.id_program
   AND e.id_discipline = d.id_discipline
   AND e.course_no = g.course_no
   AND e.start_module_no = a.start_module_no
   AND e.end_module_no = a.end_module_no
JOIN user_auth ua
    ON ua.login = a.teacher_login
JOIN teachers t
    ON t.id_user = ua.id_user;

-- 9. Формулы оценивания
INSERT INTO grading_formulas (id_assignment, formula_text, updated_at)
SELECT
    ta.id_assignment,
    '0.30*Текущая работа + 0.30*Контрольная работа + 0.40*Экзамен',
    NOW()
FROM teaching_assignments ta;

-- 10. Элементы контроля
INSERT INTO control_elements (id_formula, element_name, weight, order_no, control_type)
SELECT
    gf.id_formula,
    ce.element_name,
    ce.weight,
    ce.order_no,
    ce.control_type
FROM grading_formulas gf
CROSS JOIN (
    VALUES
        ('Текущая работа',     0.30::numeric, 1, 'current'),
        ('Контрольная работа', 0.30::numeric, 2, 'quiz'),
        ('Экзамен',            0.40::numeric, 3, 'exam')
) AS ce(element_name, weight, order_no, control_type);

COMMIT;