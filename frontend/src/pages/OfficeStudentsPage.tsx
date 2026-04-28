import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, OfficeStudent } from "../api";
import { getOfficeStudents } from "../api";
import "./TeacherSchedulePage.css";
import "./OfficeStudentsPage.css";

type OfficeStudentsPageProps = {
  user: LoginResponse;
  onLogout: () => void;
  onSelectStudent: (studentId: number) => void;
  onOpenResits: () => void;
  onOpenAttendance: () => void;
  onOpenFinalSheets: () => void;
  onOpenAnalytics: () => void;
};

function getOfficeInitials(user: LoginResponse) {
  const surnameInitial = user.surname?.trim()?.[0] ?? "";
  const nameInitial = user.name?.trim()?.[0] ?? "";

  return `${surnameInitial}${nameInitial}`.toUpperCase();
}

function getOfficeShortName(user: LoginResponse) {
  const nameInitial = user.name?.trim()?.[0] ? `${user.name.trim()[0]}.` : "";
  const fathernameInitial = user.fathername?.trim()?.[0]
    ? `${user.fathername.trim()[0]}.`
    : "";

  return `${user.surname} ${nameInitial}${fathernameInitial}`;
}

function ResitIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7h10M7 12h7M7 17h5M5.5 3.5h13A1.5 1.5 0 0 1 20 5v14a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19V5a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AttendanceIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 12.5 10.5 15 16 9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function FinalSheetsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v12A1.5 1.5 0 0 1 17 19.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8.5 9h7M8.5 12h7M8.5 15h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StudentsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19c.7-3.2 2.4-5 5-5s4.3 1.8 5 5M16.5 10.5a2.5 2.5 0 1 0 0-5M15 14.2c2.5.3 4.1 1.9 4.8 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 19V5M5 19h14M9 16v-5M13 16V8M17 16v-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H10M14 8l4 4-4 4M18 12H9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m15.5 15.5 4 4M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OfficeStudentsPage({
  user,
  onLogout,
  onSelectStudent,
  onOpenResits,
  onOpenAttendance,
  onOpenFinalSheets,
  onOpenAnalytics
}: OfficeStudentsPageProps) {
  const [students, setStudents] = useState<OfficeStudent[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("all");
  const [selectedCourseNo, setSelectedCourseNo] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudents() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getOfficeStudents(user.idUser);
        setStudents(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки списка студентов"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadStudents();
  }, [user.idUser]);

  const programOptions = useMemo(() => {
    const map = new Map<number, string>();

    students.forEach((student) => {
      map.set(student.idProgram, student.programName);
    });

    return Array.from(map.entries())
      .map(([idProgram, programName]) => ({ idProgram, programName }))
      .sort((a, b) => a.programName.localeCompare(b.programName, "ru"));
  }, [students]);

  const courseOptions = useMemo(() => {
    return Array.from(new Set(students.map((student) => student.courseNo))).sort(
      (a, b) => a - b
    );
  }, [students]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return students
      .filter((student) => {
        const matchesProgram =
          selectedProgramId === "all" ||
          String(student.idProgram) === selectedProgramId;

        const matchesCourse =
          selectedCourseNo === "all" ||
          String(student.courseNo) === selectedCourseNo;

        const searchTarget = [
          student.fullName,
          student.groupName,
          student.programName,
          student.recordBookNo,
          student.studentStatus ?? ""
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          normalizedSearch.length === 0 || searchTarget.includes(normalizedSearch);

        return matchesProgram && matchesCourse && matchesSearch;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName, "ru"));
  }, [students, selectedProgramId, selectedCourseNo, search]);

  return (
    <div className="schedule-layout">
      <aside className="app-sidebar">
        <div className="sidebar-main">
          <div className="user-block">
            <div className="avatar-placeholder avatar-initials">
              {getOfficeInitials(user)}
            </div>

            <div>
              <p>{getOfficeShortName(user)}</p>
              <span>Сотрудник учебного офиса</span>
            </div>
          </div>

          <p className="sidebar-section-title">Общее</p>

          <nav className="main-nav">
            <button className="nav-item" type="button" onClick={onOpenResits}>
              <span className="nav-icon">
                <ResitIcon />
              </span>
              Пересдачи
            </button>

            <button className="nav-item" type="button" onClick={onOpenAttendance}>
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button className="nav-item" type="button" onClick={onOpenFinalSheets}>
              <span className="nav-icon">
                <FinalSheetsIcon />
              </span>
              Итоговые ведомости
            </button>

            <button className="nav-item active" type="button">
              <span className="nav-icon">
                <StudentsIcon />
              </span>
              Студенты
            </button>
          </nav>

          <div className="sidebar-divider" />

          <p className="sidebar-section-title">BI-контур</p>

          <nav className="main-nav">
            <button className="nav-item" type="button" onClick={onOpenAnalytics}>
              <span className="nav-icon">
                <AnalyticsIcon />
              </span>
              Модуль аналитики
            </button>
          </nav>
        </div>

        <button className="logout-button" type="button" onClick={onLogout}>
          <span className="nav-icon">
            <LogoutIcon />
          </span>
          Выйти
        </button>
      </aside>

      <main className="office-students-content">
        <section className="office-students-hero">
          <h1>Студенты</h1>
        </section>

        <section className="office-students-filters">
          <select
            value={selectedProgramId}
            onChange={(event) => setSelectedProgramId(event.target.value)}
          >
            <option value="all">ОП</option>

            {programOptions.map((program) => (
              <option key={program.idProgram} value={program.idProgram}>
                {program.programName}
              </option>
            ))}
          </select>

          <select
            value={selectedCourseNo}
            onChange={(event) => setSelectedCourseNo(event.target.value)}
          >
            <option value="all">Курс</option>

            {courseOptions.map((courseNo) => (
              <option key={courseNo} value={courseNo}>
                {courseNo} курс
              </option>
            ))}
          </select>

          <label className="office-students-search">
            <SearchIcon />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по студенту"
            />
          </label>
        </section>

        {isLoading && <div className="schedule-state">Загружаем студентов...</div>}

        {error && <div className="schedule-error">{error}</div>}

        {!isLoading && !error && filteredStudents.length === 0 && (
          <div className="schedule-state">Студенты не найдены</div>
        )}

        {!isLoading && !error && filteredStudents.length > 0 && (
          <section className="office-students-list">
            {filteredStudents.map((student) => (
              <button
                className="office-student-card"
                key={student.idStudent}
                type="button"
                onClick={() => onSelectStudent(student.idStudent)}
              >
                <span>
                  <h2>{student.fullName}</h2>

                  <p>Группа: {student.groupName}</p>

                  <small>
                    {student.programName} · {student.courseNo} курс
                    {student.recordBookNo
                      ? ` · зачётка № ${student.recordBookNo}`
                      : ""}
                  </small>
                </span>

                <strong>›</strong>
              </button>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}