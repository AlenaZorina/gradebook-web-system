-- Очистка старых тестовых дисциплин.
-- Реальными считаются дисциплины, которые связаны с успешным импортом расписания ВШЭ.
-- Скрипт сначала удаляет зависимые данные, потом enrollments и сами disciplines.

BEGIN;

CREATE TEMP TABLE tmp_real_hse_disciplines AS
SELECT DISTINCT
    e.id_discipline
FROM schedule_entries se
JOIN schedule_imports si
    ON si.id_import = se.id_import
JOIN teaching_assignments ta
    ON ta.id_assignment = se.id_assignment
JOIN enrollments e
    ON e.id_enrollment = ta.id_enrollment
WHERE si.status = 'success'
  AND si.source_url ILIKE '%perm.hse.ru%';

CREATE TEMP TABLE tmp_obsolete_disciplines AS
SELECT
    d.id_discipline,
    d.discipline_name
FROM disciplines d
WHERE NOT EXISTS (
    SELECT 1
    FROM tmp_real_hse_disciplines rd
    WHERE rd.id_discipline = d.id_discipline
);

CREATE TEMP TABLE tmp_obsolete_enrollments AS
SELECT
    e.id_enrollment
FROM enrollments e
JOIN tmp_obsolete_disciplines od
    ON od.id_discipline = e.id_discipline;

CREATE TEMP TABLE tmp_obsolete_assignments AS
SELECT
    ta.id_assignment
FROM teaching_assignments ta
JOIN tmp_obsolete_enrollments oe
    ON oe.id_enrollment = ta.id_enrollment;

CREATE TEMP TABLE tmp_obsolete_sessions AS
SELECT
    ats.id_session
FROM attendance_sessions ats
JOIN tmp_obsolete_assignments oa
    ON oa.id_assignment = ats.id_assignment;

CREATE TEMP TABLE tmp_obsolete_sheets AS
SELECT
    gs.id_sheet
FROM grade_sheets gs
JOIN tmp_obsolete_assignments oa
    ON oa.id_assignment = gs.id_assignment;

CREATE TEMP TABLE tmp_obsolete_formulas AS
SELECT
    gf.id_formula
FROM grading_formulas gf
JOIN tmp_obsolete_assignments oa
    ON oa.id_assignment = gf.id_assignment;

CREATE TEMP TABLE tmp_obsolete_elements AS
SELECT
    ce.id_element
FROM control_elements ce
JOIN tmp_obsolete_formulas ofm
    ON ofm.id_formula = ce.id_formula;

-- Контрольный вывод перед удалением.
SELECT
    'obsolete_disciplines' AS entity,
    COUNT(*) AS rows_count
FROM tmp_obsolete_disciplines

UNION ALL

SELECT
    'obsolete_enrollments',
    COUNT(*)
FROM tmp_obsolete_enrollments

UNION ALL

SELECT
    'obsolete_assignments',
    COUNT(*)
FROM tmp_obsolete_assignments

UNION ALL

SELECT
    'obsolete_schedule_entries',
    COUNT(*)
FROM schedule_entries
WHERE id_assignment IN (
    SELECT id_assignment
    FROM tmp_obsolete_assignments
)

UNION ALL

SELECT
    'obsolete_attendance_sessions',
    COUNT(*)
FROM tmp_obsolete_sessions

UNION ALL

SELECT
    'obsolete_grade_sheets',
    COUNT(*)
FROM tmp_obsolete_sheets

UNION ALL

SELECT
    'obsolete_grades',
    COUNT(*)
FROM grades
WHERE id_sheet IN (
    SELECT id_sheet
    FROM tmp_obsolete_sheets
)
OR id_element IN (
    SELECT id_element
    FROM tmp_obsolete_elements
)

UNION ALL

SELECT
    'obsolete_final_grades',
    COUNT(*)
FROM final_grades
WHERE id_sheet IN (
    SELECT id_sheet
    FROM tmp_obsolete_sheets
);

-- Ошибки студентов по старым дисциплинам.
DELETE FROM error_reports
WHERE id_assignment IN (
    SELECT id_assignment
    FROM tmp_obsolete_assignments
);

-- Посещаемость по старым дисциплинам.
DELETE FROM attendance
WHERE id_session IN (
    SELECT id_session
    FROM tmp_obsolete_sessions
);

DELETE FROM attendance_sessions
WHERE id_session IN (
    SELECT id_session
    FROM tmp_obsolete_sessions
);

-- Оценки и ведомости по старым дисциплинам.
DELETE FROM final_grades
WHERE id_sheet IN (
    SELECT id_sheet
    FROM tmp_obsolete_sheets
);

DELETE FROM grades
WHERE id_sheet IN (
    SELECT id_sheet
    FROM tmp_obsolete_sheets
)
OR id_element IN (
    SELECT id_element
    FROM tmp_obsolete_elements
);

DELETE FROM grade_sheets
WHERE id_sheet IN (
    SELECT id_sheet
    FROM tmp_obsolete_sheets
);

-- Формулы и элементы контроля по старым дисциплинам.
DELETE FROM control_elements
WHERE id_element IN (
    SELECT id_element
    FROM tmp_obsolete_elements
);

DELETE FROM grading_formulas
WHERE id_formula IN (
    SELECT id_formula
    FROM tmp_obsolete_formulas
);

-- Старые записи расписания.
DELETE FROM schedule_entries
WHERE id_assignment IN (
    SELECT id_assignment
    FROM tmp_obsolete_assignments
);

-- Старые назначения преподавателей.
DELETE FROM teaching_assignments
WHERE id_assignment IN (
    SELECT id_assignment
    FROM tmp_obsolete_assignments
);

-- Старые связи ОП-дисциплина-курс-модуль.
DELETE FROM enrollments
WHERE id_enrollment IN (
    SELECT id_enrollment
    FROM tmp_obsolete_enrollments
)
AND NOT EXISTS (
    SELECT 1
    FROM teaching_assignments ta
    WHERE ta.id_enrollment = enrollments.id_enrollment
);

-- Старые дисциплины.
DELETE FROM disciplines
WHERE id_discipline IN (
    SELECT id_discipline
    FROM tmp_obsolete_disciplines
)
AND NOT EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.id_discipline = disciplines.id_discipline
);

COMMIT;