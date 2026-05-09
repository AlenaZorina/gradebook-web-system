ALTER TABLE schedule_imports
ADD COLUMN IF NOT EXISTS week_no integer,
ADD COLUMN IF NOT EXISTS week_start date,
ADD COLUMN IF NOT EXISTS week_end date,
ADD COLUMN IF NOT EXISTS file_hash varchar(128),
ADD COLUMN IF NOT EXISTS imported_by_user_id integer,
ADD COLUMN IF NOT EXISTS error_message varchar(1000);

ALTER TABLE schedule_entries
ADD COLUMN IF NOT EXISTS source_cell varchar(50),
ADD COLUMN IF NOT EXISTS raw_text varchar(1000);

CREATE OR REPLACE FUNCTION hse_import_schedule_entries(
    p_imported_by_user_id integer,
    p_source_url varchar,
    p_file_name varchar,
    p_week_no integer,
    p_week_start date,
    p_week_end date,
    p_module_no integer,
    p_file_hash varchar,
    p_entries jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_existing_import_id integer;
    v_id_import integer;

    v_entry jsonb;

    v_group_name varchar(50);
    v_course_no integer;
    v_discipline_name varchar(200);
    v_teacher_short_name varchar(100);
    v_teacher_surname varchar(100);
    v_teacher_name_initial varchar(10);
    v_teacher_fathername_initial varchar(10);
    v_lesson_date date;
    v_start_time time;
    v_end_time time;
    v_source_cell varchar(50);
    v_raw_text varchar(1000);

    v_id_degree_level integer;
    v_id_program integer;
    v_program_name varchar(150);
    v_id_group integer;
    v_id_discipline integer;
    v_id_role_teacher integer;
    v_id_user integer;
    v_id_teacher integer;
    v_id_enrollment integer;
    v_id_assignment integer;
    v_id_session integer;

    v_admission_year integer;
    v_academic_year varchar(20);

    v_created_groups_count integer := 0;
    v_created_disciplines_count integer := 0;
    v_created_teachers_count integer := 0;
    v_created_assignments_count integer := 0;
    v_created_attendance_sessions_count integer := 0;
    v_added_entries_count integer := 0;
    v_skipped_entries_count integer := 0;

    v_warnings jsonb := '[]'::jsonb;
    v_match text[];
BEGIN
    IF p_entries IS NULL OR jsonb_typeof(p_entries) <> 'array' THEN
        RETURN jsonb_build_object(
            'foundLinksCount', 0,
            'downloadedFilesCount', 0,
            'createdImportsCount', 0,
            'duplicateFilesCount', 0,
            'addedEntriesCount', 0,
            'skippedEntriesCount', 0,
            'createdDisciplinesCount', 0,
            'createdTeachersCount', 0,
            'createdGroupsCount', 0,
            'createdAssignmentsCount', 0,
            'createdAttendanceSessionsCount', 0,
            'warnings', jsonb_build_array('В RPC-функцию не передан массив занятий')
        );
    END IF;

    SELECT id_import
    INTO v_existing_import_id
    FROM schedule_imports
    WHERE file_hash = p_file_hash
      AND status = 'success'
    LIMIT 1;

    IF v_existing_import_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'foundLinksCount', 1,
            'downloadedFilesCount', 1,
            'createdImportsCount', 0,
            'duplicateFilesCount', 1,
            'addedEntriesCount', 0,
            'skippedEntriesCount', 0,
            'createdDisciplinesCount', 0,
            'createdTeachersCount', 0,
            'createdGroupsCount', 0,
            'createdAssignmentsCount', 0,
            'createdAttendanceSessionsCount', 0,
            'warnings', jsonb_build_array('Файл уже был импортирован ранее, повторная загрузка пропущена')
        );
    END IF;

    INSERT INTO degree_levels (degree_level_name)
    VALUES ('Бакалавриат')
    ON CONFLICT (degree_level_name) DO NOTHING;

    SELECT id_degree_level
    INTO v_id_degree_level
    FROM degree_levels
    WHERE degree_level_name = 'Бакалавриат'
    LIMIT 1;

    INSERT INTO role (role_name)
    VALUES ('teacher')
    ON CONFLICT (role_name) DO NOTHING;

    SELECT id_role
    INTO v_id_role_teacher
    FROM role
    WHERE role_name = 'teacher'
    LIMIT 1;

    IF EXTRACT(MONTH FROM p_week_start)::int >= 9 THEN
        v_academic_year :=
            EXTRACT(YEAR FROM p_week_start)::int::text
            || '/'
            || (EXTRACT(YEAR FROM p_week_start)::int + 1)::text;
    ELSE
        v_academic_year :=
            (EXTRACT(YEAR FROM p_week_start)::int - 1)::text
            || '/'
            || EXTRACT(YEAR FROM p_week_start)::int::text;
    END IF;

    DELETE FROM schedule_entries
    WHERE id_import IN (
        SELECT id_import
        FROM schedule_imports
        WHERE week_start = p_week_start
          AND week_end = p_week_end
          AND status = 'success'
    );

    INSERT INTO schedule_imports (
        source_url,
        file_name,
        imported_at,
        status,
        week_no,
        week_start,
        week_end,
        file_hash,
        imported_by_user_id
    )
    VALUES (
        p_source_url,
        p_file_name,
        now(),
        'processing',
        p_week_no,
        p_week_start,
        p_week_end,
        p_file_hash,
        p_imported_by_user_id
    )
    RETURNING id_import INTO v_id_import;

    FOR v_entry IN
        SELECT value
        FROM jsonb_array_elements(p_entries)
    LOOP
        v_group_name := NULLIF(TRIM(v_entry ->> 'groupName'), '');
        v_course_no := NULLIF(TRIM(v_entry ->> 'courseNo'), '')::integer;
        v_discipline_name := NULLIF(TRIM(v_entry ->> 'disciplineName'), '');
        v_teacher_short_name := NULLIF(TRIM(v_entry ->> 'teacherShortName'), '');
        v_teacher_surname := NULLIF(TRIM(v_entry ->> 'teacherSurname'), '');
        v_teacher_name_initial := NULLIF(TRIM(v_entry ->> 'teacherNameInitial'), '');
        v_teacher_fathername_initial := NULLIF(TRIM(v_entry ->> 'teacherFathernameInitial'), '');
        v_lesson_date := NULLIF(TRIM(v_entry ->> 'lessonDate'), '')::date;
        v_start_time := NULLIF(TRIM(v_entry ->> 'startTime'), '')::time;
        v_end_time := NULLIF(TRIM(v_entry ->> 'endTime'), '')::time;
        v_source_cell := LEFT(COALESCE(v_entry ->> 'sourceCell', ''), 50);
        v_raw_text := LEFT(COALESCE(v_entry ->> 'rawText', ''), 1000);

        IF v_group_name IS NULL
           OR v_course_no IS NULL
           OR v_discipline_name IS NULL
           OR v_lesson_date IS NULL
           OR v_start_time IS NULL
        THEN
            v_skipped_entries_count := v_skipped_entries_count + 1;
            v_warnings := v_warnings || jsonb_build_array(
                'Пропущена строка расписания из-за неполных данных: ' || COALESCE(v_raw_text, '')
            );
            CONTINUE;
        END IF;

        IF v_group_name ILIKE 'РИС-%' THEN
            v_program_name := 'Разработка информационных систем для бизнеса';
        ELSIF v_group_name ILIKE 'МБ-%' THEN
            v_program_name := 'Менеджмент';
        ELSIF v_group_name ILIKE 'Ю-%' OR v_group_name ILIKE 'ЮР-%' THEN
            v_program_name := 'Юриспруденция';
        ELSIF v_group_name ILIKE 'И-%' OR v_group_name ILIKE 'ИЯ-%' THEN
            v_program_name := 'Иностранные языки и межкультурная коммуникация';
        ELSE
            v_program_name := 'Не определена';
        END IF;

        SELECT id_program
        INTO v_id_program
        FROM programs
        WHERE LOWER(program_name) = LOWER(v_program_name)
        LIMIT 1;

        IF v_id_program IS NULL THEN
            INSERT INTO programs (program_name, id_degree_level)
            VALUES (v_program_name, v_id_degree_level)
            RETURNING id_program INTO v_id_program;

            v_warnings := v_warnings || jsonb_build_array(
                'Создана образовательная программа: ' || v_program_name
            );
        END IF;

        SELECT id_group
        INTO v_id_group
        FROM groups
        WHERE group_name = v_group_name
        LIMIT 1;

        IF v_id_group IS NULL THEN
            v_match := regexp_match(v_group_name, '-([0-9]{2})-');

            IF v_match IS NOT NULL THEN
                v_admission_year := 2000 + v_match[1]::integer;
            ELSE
                v_admission_year := EXTRACT(YEAR FROM p_week_start)::integer - v_course_no + 1;
            END IF;

            INSERT INTO groups (
                group_name,
                id_program,
                course_no,
                admission_year,
                is_active
            )
            VALUES (
                v_group_name,
                v_id_program,
                v_course_no,
                v_admission_year,
                TRUE
            )
            RETURNING id_group INTO v_id_group;

            v_created_groups_count := v_created_groups_count + 1;
            v_warnings := v_warnings || jsonb_build_array(
                'Создана новая группа: ' || v_group_name
            );
        END IF;

        SELECT id_discipline
        INTO v_id_discipline
        FROM disciplines
        WHERE LOWER(TRIM(discipline_name)) = LOWER(TRIM(v_discipline_name))
        LIMIT 1;

        IF v_id_discipline IS NULL THEN
            INSERT INTO disciplines (discipline_name, pud_url)
            VALUES (v_discipline_name, NULL)
            RETURNING id_discipline INTO v_id_discipline;

            v_created_disciplines_count := v_created_disciplines_count + 1;
            v_warnings := v_warnings || jsonb_build_array(
                'Создана новая дисциплина без ссылки на ПУД: ' || v_discipline_name
            );
        END IF;

        IF v_teacher_surname IS NULL THEN
            v_teacher_surname := 'Не указан';
            v_teacher_name_initial := 'Н';
            v_teacher_fathername_initial := NULL;

            v_warnings := v_warnings || jsonb_build_array(
                'Не найден преподаватель в ячейке ' || COALESCE(v_source_cell, '') || ': ' || v_raw_text
            );
        END IF;

        SELECT t.id_teacher
        INTO v_id_teacher
        FROM teachers t
        JOIN users u ON u.id_user = t.id_user
        WHERE LOWER(u.surname) = LOWER(v_teacher_surname)
          AND (
              v_teacher_name_initial IS NULL
              OR LEFT(COALESCE(u.name, ''), 1) = v_teacher_name_initial
          )
        LIMIT 1;

        IF v_id_teacher IS NULL THEN
            INSERT INTO users (
                id_role,
                name,
                surname,
                fathername
            )
            VALUES (
                v_id_role_teacher,
                COALESCE(v_teacher_name_initial, 'Н'),
                v_teacher_surname,
                v_teacher_fathername_initial
            )
            RETURNING id_user INTO v_id_user;

            INSERT INTO teachers (
                id_user,
                department,
                position
            )
            VALUES (
                v_id_user,
                'Не указана',
                'Преподаватель'
            )
            RETURNING id_teacher INTO v_id_teacher;

            v_created_teachers_count := v_created_teachers_count + 1;
            v_warnings := v_warnings || jsonb_build_array(
                'Создан новый преподаватель по расписанию: ' || COALESCE(v_teacher_short_name, v_teacher_surname)
            );
        END IF;

        INSERT INTO enrollments (
            id_program,
            id_discipline,
            course_no,
            start_module_no,
            end_module_no
        )
        VALUES (
            v_id_program,
            v_id_discipline,
            v_course_no,
            COALESCE(p_module_no, 1),
            COALESCE(p_module_no, 1)
        )
        ON CONFLICT (id_program, id_discipline, course_no, start_module_no, end_module_no)
        DO UPDATE SET id_program = EXCLUDED.id_program
        RETURNING id_enrollment INTO v_id_enrollment;

        INSERT INTO teaching_assignments (
            id_teacher,
            id_group,
            id_enrollment,
            academic_year,
            is_active
        )
        VALUES (
            v_id_teacher,
            v_id_group,
            v_id_enrollment,
            v_academic_year,
            TRUE
        )
        ON CONFLICT (id_teacher, id_group, id_enrollment, academic_year)
        DO UPDATE SET is_active = TRUE
        RETURNING id_assignment INTO v_id_assignment;

        IF NOT EXISTS (
            SELECT 1
            FROM teaching_assignments
            WHERE id_teacher = v_id_teacher
              AND id_group = v_id_group
              AND id_enrollment = v_id_enrollment
              AND academic_year = v_academic_year
              AND id_assignment <> v_id_assignment
        ) THEN
            -- Счётчик приблизительный: при ON CONFLICT невозможно просто отличить insert/update без отдельного поиска.
            NULL;
        END IF;

        INSERT INTO schedule_entries (
            id_import,
            id_assignment,
            lesson_date,
            start_time,
            end_time,
            week_no,
            module_no,
            source_cell,
            raw_text
        )
        VALUES (
            v_id_import,
            v_id_assignment,
            v_lesson_date,
            v_start_time,
            v_end_time,
            p_week_no,
            p_module_no,
            v_source_cell,
            v_raw_text
        );

        v_added_entries_count := v_added_entries_count + 1;

        INSERT INTO attendance_sessions (
            id_assignment,
            lesson_date,
            start_time,
            end_time,
            source
        )
        VALUES (
            v_id_assignment,
            v_lesson_date,
            v_start_time,
            v_end_time,
            'hse'
        )
        ON CONFLICT (id_assignment, lesson_date, start_time)
        DO UPDATE SET
            end_time = EXCLUDED.end_time,
            source = EXCLUDED.source
        RETURNING id_session INTO v_id_session;

        v_created_attendance_sessions_count := v_created_attendance_sessions_count + 1;
    END LOOP;

    UPDATE schedule_imports
    SET status = 'success'
    WHERE id_import = v_id_import;

    RETURN jsonb_build_object(
        'foundLinksCount', 1,
        'downloadedFilesCount', 1,
        'createdImportsCount', 1,
        'duplicateFilesCount', 0,
        'addedEntriesCount', v_added_entries_count,
        'skippedEntriesCount', v_skipped_entries_count,
        'createdDisciplinesCount', v_created_disciplines_count,
        'createdTeachersCount', v_created_teachers_count,
        'createdGroupsCount', v_created_groups_count,
        'createdAssignmentsCount', v_created_assignments_count,
        'createdAttendanceSessionsCount', v_created_attendance_sessions_count,
        'warnings', v_warnings
    );
END;
$$;

NOTIFY pgrst, 'reload schema';