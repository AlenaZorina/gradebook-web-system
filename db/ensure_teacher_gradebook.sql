CREATE OR REPLACE FUNCTION ensure_teacher_gradebook(
    p_teacher_user_id integer,
    p_id_discipline integer,
    p_id_group integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_assignment integer;
    v_id_formula integer;
    v_source_formula_id integer;
    v_formula_text text;
    v_id_sheet integer;
    v_elements_count integer;
BEGIN
    /*
      Выбираем одно актуальное назначение преподавателя на дисциплину и группу.
      Если есть несколько назначений, предпочитаем то, которое связано с HSE-расписанием.
    */
    SELECT ta.id_assignment
    INTO v_id_assignment
    FROM teaching_assignments ta
    JOIN teachers t
        ON t.id_teacher = ta.id_teacher
    JOIN enrollments e
        ON e.id_enrollment = ta.id_enrollment
    WHERE t.id_user = p_teacher_user_id
      AND e.id_discipline = p_id_discipline
      AND ta.id_group = p_id_group
    ORDER BY
      (
        SELECT COUNT(*)
        FROM schedule_entries se
        JOIN schedule_imports si
            ON si.id_import = se.id_import
        WHERE se.id_assignment = ta.id_assignment
          AND si.status = 'success'
          AND si.source_url ILIKE '%perm.hse.ru%'
      ) DESC,
      ta.id_assignment DESC
    LIMIT 1;

    IF v_id_assignment IS NULL THEN
        RAISE EXCEPTION 'Назначение дисциплины не найдено или не принадлежит преподавателю';
    END IF;

    /*
      Ищем формулу для выбранного назначения.
    */
    SELECT gf.id_formula, gf.formula_text
    INTO v_id_formula, v_formula_text
    FROM grading_formulas gf
    WHERE gf.id_assignment = v_id_assignment
    LIMIT 1;

    /*
      Если формулы нет, копируем последнюю формулу этой дисциплины из другой группы.
      Если формул вообще нет, создаем дефолтную.
    */
    IF v_id_formula IS NULL THEN
        SELECT gf.id_formula, gf.formula_text
        INTO v_source_formula_id, v_formula_text
        FROM grading_formulas gf
        JOIN teaching_assignments ta
            ON ta.id_assignment = gf.id_assignment
        JOIN enrollments e
            ON e.id_enrollment = ta.id_enrollment
        WHERE e.id_discipline = p_id_discipline
        ORDER BY gf.updated_at DESC NULLS LAST, gf.id_formula DESC
        LIMIT 1;

        IF v_formula_text IS NULL THEN
            v_formula_text := '0.25*ЛР1 + 0.25*ЛР2 + 0.20*КР + 0.30*Экзамен';
        END IF;

        INSERT INTO grading_formulas (
            id_assignment,
            formula_text,
            updated_at
        )
        VALUES (
            v_id_assignment,
            v_formula_text,
            now()
        )
        RETURNING id_formula INTO v_id_formula;

        IF v_source_formula_id IS NOT NULL THEN
            INSERT INTO control_elements (
                id_formula,
                element_name,
                weight,
                order_no,
                control_type
            )
            SELECT
                v_id_formula,
                ce.element_name,
                ce.weight,
                ce.order_no,
                ce.control_type
            FROM control_elements ce
            WHERE ce.id_formula = v_source_formula_id
            ORDER BY ce.order_no;
        END IF;
    END IF;

    SELECT COUNT(*)
    INTO v_elements_count
    FROM control_elements
    WHERE id_formula = v_id_formula;

    IF v_elements_count = 0 THEN
        INSERT INTO control_elements (
            id_formula,
            element_name,
            weight,
            order_no,
            control_type
        )
        VALUES
            (v_id_formula, 'ЛР1', 0.25, 1, 'lab'),
            (v_id_formula, 'ЛР2', 0.25, 2, 'lab'),
            (v_id_formula, 'КР', 0.20, 3, 'control'),
            (v_id_formula, 'Экзамен', 0.30, 4, 'exam');
    END IF;

    /*
      Создаем ведомость, если ее нет.
    */
    SELECT id_sheet
    INTO v_id_sheet
    FROM grade_sheets
    WHERE id_assignment = v_id_assignment
      AND sheet_type = 'gradebook'
    ORDER BY id_sheet DESC
    LIMIT 1;

    IF v_id_sheet IS NULL THEN
        INSERT INTO grade_sheets (
            id_assignment,
            sheet_type,
            status,
            submitted_at,
            approved_at
        )
        VALUES (
            v_id_assignment,
            'gradebook',
            'draft',
            NULL,
            NULL
        )
        RETURNING id_sheet INTO v_id_sheet;
    END IF;

    /*
      Удаляем оценки по элементам, которых больше нет в текущей формуле.
      Это важно после удаления элементов формулы.
    */
    DELETE FROM grades g
    WHERE g.id_sheet = v_id_sheet
      AND NOT EXISTS (
          SELECT 1
          FROM control_elements ce
          WHERE ce.id_formula = v_id_formula
            AND ce.id_element = g.id_element
      );

    /*
      Создаем пустые оценки по всем элементам формулы для всех студентов группы.
    */
    INSERT INTO grades (
        id_sheet,
        id_student,
        id_element,
        grade_value,
        comment
    )
    SELECT
        v_id_sheet,
        s.id_student,
        ce.id_element,
        NULL,
        NULL
    FROM students s
    CROSS JOIN control_elements ce
    WHERE s.id_group = p_id_group
      AND ce.id_formula = v_id_formula
      AND NOT EXISTS (
          SELECT 1
          FROM grades g
          WHERE g.id_sheet = v_id_sheet
            AND g.id_student = s.id_student
            AND g.id_element = ce.id_element
      );

    /*
      Создаем итоговую оценку для каждого студента, если ее еще нет.
    */
    INSERT INTO final_grades (
        id_sheet,
        id_student,
        final_grade
    )
    SELECT
        v_id_sheet,
        s.id_student,
        NULL
    FROM students s
    WHERE s.id_group = p_id_group
      AND NOT EXISTS (
          SELECT 1
          FROM final_grades fg
          WHERE fg.id_sheet = v_id_sheet
            AND fg.id_student = s.id_student
      );

    RETURN jsonb_build_object(
        'idAssignment', v_id_assignment,
        'idSheet', v_id_sheet
    );
END;
$$;

NOTIFY pgrst, 'reload schema';