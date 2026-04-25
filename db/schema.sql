CREATE TABLE IF NOT EXISTS role (
    id_role INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS degree_levels (
    id_degree_level INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    degree_level_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS student_statuses (
    id_status INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status_name VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS programs (
    id_program INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    program_name VARCHAR(150) NOT NULL,
    id_degree_level INTEGER NOT NULL,
    CONSTRAINT fk_program_degree_level
        FOREIGN KEY (id_degree_level) REFERENCES degree_levels(id_degree_level)
);

CREATE TABLE IF NOT EXISTS groups (
    id_group INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_name VARCHAR(50) NOT NULL UNIQUE,
    id_program INTEGER NOT NULL,
    course_no INTEGER NOT NULL,
    admission_year INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_group_program
        FOREIGN KEY (id_program) REFERENCES programs(id_program)
);

CREATE TABLE IF NOT EXISTS enrollments (
    id_enrollment INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_program INTEGER NOT NULL,
    id_discipline INTEGER NOT NULL,
    course_no INTEGER NOT NULL,
    start_module_no INTEGER NOT NULL,
    end_module_no INTEGER NOT NULL,
    CONSTRAINT fk_enrollment_program
        FOREIGN KEY (id_program) REFERENCES programs(id_program),
    CONSTRAINT fk_enrollment_discipline
        FOREIGN KEY (id_discipline) REFERENCES disciplines(id_discipline)
);

CREATE TABLE IF NOT EXISTS "user" (
    id_user INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_role INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    fathername VARCHAR(100),
    CONSTRAINT fk_user_role
        FOREIGN KEY (id_role) REFERENCES role(id_role)
);

CREATE TABLE IF NOT EXISTS user_auth (
    id_auth INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_user INTEGER NOT NULL UNIQUE,
    login VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    CONSTRAINT fk_auth_user
        FOREIGN KEY (id_user) REFERENCES "user"(id_user)
);

CREATE TABLE IF NOT EXISTS students (
    id_student INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_user INTEGER NOT NULL UNIQUE,
    id_group INTEGER NOT NULL,
    record_book_no VARCHAR(50) NOT NULL UNIQUE,
    id_status INTEGER NOT NULL,
    CONSTRAINT fk_student_user
        FOREIGN KEY (id_user) REFERENCES "user"(id_user),
    CONSTRAINT fk_student_group
        FOREIGN KEY (id_group) REFERENCES groups(id_group),
    CONSTRAINT fk_student_status
        FOREIGN KEY (id_status) REFERENCES student_statuses(id_status)
);

CREATE TABLE IF NOT EXISTS teachers (
    id_teacher INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_user INTEGER NOT NULL UNIQUE,
    department VARCHAR(150),
    position VARCHAR(100),
    CONSTRAINT fk_teacher_user
        FOREIGN KEY (id_user) REFERENCES "user"(id_user)
);
CREATE TABLE IF NOT EXISTS teaching_assignments (
    id_assignment INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_teacher INTEGER NOT NULL,
    id_group INTEGER NOT NULL,
    id_enrollment INTEGER NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    module_no INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_assignment_teacher
        FOREIGN KEY (id_teacher) REFERENCES teachers(id_teacher),
    CONSTRAINT fk_assignment_group
        FOREIGN KEY (id_group) REFERENCES groups(id_group),
    CONSTRAINT fk_assignment_enrollment
        FOREIGN KEY (id_enrollment) REFERENCES enrollments(id_enrollment)
);

CREATE TABLE IF NOT EXISTS grading_formulas (
    id_formula INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_assignment INTEGER NOT NULL,
    formula_text VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT fk_formula_assignment
        FOREIGN KEY (id_assignment) REFERENCES teaching_assignments(id_assignment)
);

CREATE TABLE IF NOT EXISTS control_elements (
    id_element INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_formula INTEGER NOT NULL,
    element_name VARCHAR(100) NOT NULL,
    weight NUMERIC(5,2) NOT NULL,
    order_no INTEGER NOT NULL,
    control_type VARCHAR(50) NOT NULL,
    CONSTRAINT fk_element_formula
        FOREIGN KEY (id_formula) REFERENCES grading_formulas(id_formula)
);

CREATE TABLE IF NOT EXISTS grade_sheets (
    id_sheet INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_assignment INTEGER NOT NULL,
    approved_by_user_id INTEGER,
    sheet_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    CONSTRAINT fk_sheet_assignment
        FOREIGN KEY (id_assignment) REFERENCES teaching_assignments(id_assignment),
    CONSTRAINT fk_sheet_approved_by_user
        FOREIGN KEY (approved_by_user_id) REFERENCES "user"(id_user)
);

CREATE TABLE IF NOT EXISTS grades (
    id_grade INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_sheet INTEGER NOT NULL,
    id_student INTEGER NOT NULL,
    id_element INTEGER NOT NULL,
    grade_value NUMERIC(5,2),
    comment VARCHAR(255),
    CONSTRAINT fk_grade_sheet
        FOREIGN KEY (id_sheet) REFERENCES grade_sheets(id_sheet),
    CONSTRAINT fk_grade_student
        FOREIGN KEY (id_student) REFERENCES students(id_student),
    CONSTRAINT fk_grade_element
        FOREIGN KEY (id_element) REFERENCES control_elements(id_element),
    CONSTRAINT uq_grade_sheet_student_element
        UNIQUE (id_sheet, id_student, id_element)
);

CREATE TABLE IF NOT EXISTS final_grades (
    id_final_grade INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_sheet INTEGER NOT NULL,
    id_student INTEGER NOT NULL,
    final_grade NUMERIC(5,2),
    CONSTRAINT fk_final_grade_sheet
        FOREIGN KEY (id_sheet) REFERENCES grade_sheets(id_sheet),
    CONSTRAINT fk_final_grade_student
        FOREIGN KEY (id_student) REFERENCES students(id_student),
    CONSTRAINT uq_final_grade_sheet_student
        UNIQUE (id_sheet, id_student)
);
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id_session INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_assignment INTEGER NOT NULL,
    lesson_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    source VARCHAR(30) NOT NULL,
    CONSTRAINT fk_session_assignment
        FOREIGN KEY (id_assignment) REFERENCES teaching_assignments(id_assignment)
);

CREATE TABLE IF NOT EXISTS attendance (
    id_attendance INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_session INTEGER NOT NULL,
    id_student INTEGER NOT NULL,
    updated_by_user_id INTEGER,
    status VARCHAR(30) NOT NULL,
    CONSTRAINT fk_attendance_session
        FOREIGN KEY (id_session) REFERENCES attendance_sessions(id_session),
    CONSTRAINT fk_attendance_student
        FOREIGN KEY (id_student) REFERENCES students(id_student),
    CONSTRAINT fk_attendance_updated_by_user
        FOREIGN KEY (updated_by_user_id) REFERENCES "user"(id_user),
    CONSTRAINT uq_attendance_session_student
        UNIQUE (id_session, id_student)
);

CREATE TABLE IF NOT EXISTS schedule_imports (
    id_import INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_url VARCHAR(500),
    file_name VARCHAR(255) NOT NULL,
    imported_at TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule_entries (
    id_entry INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_import INTEGER NOT NULL,
    id_assignment INTEGER NOT NULL,
    lesson_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    week_no INTEGER,
    module_no INTEGER,
    CONSTRAINT fk_schedule_import
        FOREIGN KEY (id_import) REFERENCES schedule_imports(id_import),
    CONSTRAINT fk_schedule_assignment
        FOREIGN KEY (id_assignment) REFERENCES teaching_assignments(id_assignment)
);

CREATE TABLE IF NOT EXISTS error_reports (
    id_report INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_student INTEGER NOT NULL,
    id_assignment INTEGER NOT NULL,
    report_type VARCHAR(30) NOT NULL,
    related_date DATE,
    description VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL,
    CONSTRAINT fk_report_student
        FOREIGN KEY (id_student) REFERENCES students(id_student),
    CONSTRAINT fk_report_assignment
        FOREIGN KEY (id_assignment) REFERENCES teaching_assignments(id_assignment)
);

CREATE TABLE IF NOT EXISTS student_status_history (
    id_history INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_student INTEGER NOT NULL,
    action_type VARCHAR(30) NOT NULL,
    from_group_id INTEGER,
    to_group_id INTEGER,
    action_date DATE NOT NULL,
    reason VARCHAR(255),
    changed_by_user_id INTEGER NOT NULL,
    CONSTRAINT fk_history_student
        FOREIGN KEY (id_student) REFERENCES students(id_student),
    CONSTRAINT fk_history_from_group
        FOREIGN KEY (from_group_id) REFERENCES groups(id_group),
    CONSTRAINT fk_history_to_group
        FOREIGN KEY (to_group_id) REFERENCES groups(id_group),
    CONSTRAINT fk_history_changed_by_user
        FOREIGN KEY (changed_by_user_id) REFERENCES "user"(id_user)
);