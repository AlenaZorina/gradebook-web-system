INSERT INTO role (role_name) VALUES
('student'),
('teacher'),
('office_staff')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO degree_levels (degree_level_name) VALUES
('Бакалавриат'),
('Магистратура')
ON CONFLICT (degree_level_name) DO NOTHING;

INSERT INTO student_statuses (status_name) VALUES
('active'),
('expelled'),
('restored')
ON CONFLICT (status_name) DO NOTHING;