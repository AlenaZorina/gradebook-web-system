import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, StudentDiscipline } from "../api";
import { getStudentDisciplines } from "../api";
import "./TeacherSchedulePage.css";
import "./TeacherDisciplinesPage.css";
import "./StudentDisciplinesPage.css";

type StudentDisciplinesPageProps = {
  user: LoginResponse;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onSelectDiscipline: (disciplineId: number) => void;
  onOpenAttendance?: () => void;
  onOpenGradebook?: () => void;
  onOpenAnalytics?: () => void;
};

function getStudentInitials(user: LoginResponse) {
  const surnameInitial = user.surname?.trim()?.[0] ?? "";
  const nameInitial = user.name?.trim()?.[0] ?? "";

  return `${surnameInitial}${nameInitial}`.toUpperCase();
}

function getStudentShortName(user: LoginResponse) {
  const nameInitial = user.name?.trim()?.[0] ? `${user.name.trim()[0]}.` : "";
  const fathernameInitial = user.fathername?.trim()?.[0]
    ? `${user.fathername.trim()[0]}.`
    : "";

  return `${user.surname} ${nameInitial}${fathernameInitial}`;
}

function ScheduleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 3v3M17 3v3M4.5 9h15M6.5 5h11A2.5 2.5 0 0 1 20 7.5v10A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-10A2.5 2.5 0 0 1 6.5 5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DisciplineIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6 4.5h10.5A1.5 1.5 0 0 1 18 6v13.5H7.5A2.5 2.5 0 0 1 5 17V6.5A2 2 0 0 1 7 4.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 8h7M8 11h7M8 14h4"
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

function GradesIcon() {
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

function getDisciplineLetter(name?: string | null) {
  return name?.trim()?.[0]?.toUpperCase() ?? "Д";
}

function getModuleText(item: StudentDiscipline) {
  if (
    item.startModuleNo &&
    item.endModuleNo &&
    item.startModuleNo !== item.endModuleNo
  ) {
    return `${item.startModuleNo}–${item.endModuleNo} модули`;
  }

  if (item.startModuleNo) {
    return `${item.startModuleNo} модуль`;
  }

  return "модуль не указан";
}

export function StudentDisciplinesPage({
  user,
  onLogout,
  onOpenSchedule,
  onSelectDiscipline,
  onOpenAttendance,
  onOpenGradebook,
  onOpenAnalytics
}: StudentDisciplinesPageProps) {
  const [disciplines, setDisciplines] = useState<StudentDiscipline[]>([]);
  const [statusFilter, setStatusFilter] = useState("current");
  const [sortMode, setSortMode] = useState("name");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDisciplines() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getStudentDisciplines(user.idUser);
        setDisciplines(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки дисциплин"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDisciplines();
  }, [user.idUser]);

  const studentInfo = disciplines[0];

  const filteredDisciplines = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let result = disciplines.filter((item) => {
      const disciplineName = item.disciplineName ?? "";
      const teachersShortNames = item.teachersShortNames ?? "";

      const matchesSearch =
        disciplineName.toLowerCase().includes(normalizedSearch) ||
        teachersShortNames.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      return statusFilter === "current";
    });

    if (sortMode === "name") {
      result = [...result].sort((a, b) =>
        (a.disciplineName ?? "").localeCompare(b.disciplineName ?? "", "ru")
      );
    }

    if (sortMode === "module") {
      result = [...result].sort(
        (a, b) => (a.startModuleNo ?? 999) - (b.startModuleNo ?? 999)
      );
    }

    return result;
  }, [disciplines, search, sortMode, statusFilter]);

  const groupedByCourse = useMemo(() => {
    const grouped = new Map<number, StudentDiscipline[]>();

    filteredDisciplines.forEach((item) => {
      if (!grouped.has(item.courseNo)) {
        grouped.set(item.courseNo, []);
      }

      grouped.get(item.courseNo)?.push(item);
    });

    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [filteredDisciplines]);

  return (
    <div className="schedule-layout">
      <aside className="app-sidebar">
        <div className="sidebar-main">
          <div className="user-block">
            <div className="avatar-placeholder avatar-initials">
              {getStudentInitials(user)}
            </div>

            <div>
              <p>{getStudentShortName(user)}</p>
              <span>
                {studentInfo ? `Студент · ${studentInfo.groupName}` : "Студент"}
              </span>
            </div>
          </div>

          <p className="sidebar-section-title">ОБЩЕЕ</p>

          <nav className="main-nav">
            <button className="nav-item" type="button" onClick={onOpenSchedule}>
              <span className="nav-icon">
                <ScheduleIcon />
              </span>
              Расписание
            </button>

            <button className="nav-item active" type="button">
              <span className="nav-icon">
                <DisciplineIcon />
              </span>
              Дисциплины
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() => onOpenAttendance?.()}
            >
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() => onOpenGradebook?.()}
            >
              <span className="nav-icon">
                <GradesIcon />
              </span>
              Ведомость
            </button>
          </nav>

          <div className="sidebar-divider" />

          <p className="sidebar-section-title">BI-КОНТУР</p>

          <nav className="main-nav">
            <button
              className="nav-item"
              type="button"
              onClick={() => onOpenAnalytics?.()}
            >
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

      <section className="disciplines-content student-disciplines-content">
        <div className="disciplines-header student-disciplines-header">
          <h1>Дисциплины</h1>

          {studentInfo && (
            <p className="student-disciplines-subtitle">
              {studentInfo.courseNo} курс · {studentInfo.groupName}
            </p>
          )}

          <div className="disciplines-toolbar student-disciplines-toolbar">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="current">Текущие</option>
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
            >
              <option value="name">Сортировать по названию</option>
              <option value="module">Сортировать по модулю</option>
            </select>

            <div className="disciplines-search">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск"
              />
              <span>⌕</span>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="disciplines-state">Загружаем дисциплины...</div>
        )}

        {error && <div className="disciplines-error">{error}</div>}

        {!isLoading && !error && filteredDisciplines.length === 0 && (
          <div className="disciplines-state">Дисциплины не найдены</div>
        )}

        {!isLoading &&
          !error &&
          groupedByCourse.map(([courseNo, items]) => (
            <section className="course-section" key={courseNo}>
              <h2>{courseNo} курс</h2>

              <div className="disciplines-grid">
                {items.map((item) => (
                  <article
                    className="discipline-card"
                    key={`${item.idDiscipline}-${item.idGroup}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectDiscipline(item.idDiscipline)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSelectDiscipline(item.idDiscipline);
                      }
                    }}
                  >
                    <div className="discipline-cover">
                      <span>{getDisciplineLetter(item.disciplineName)}</span>
                    </div>

                    <div className="discipline-card-body">
                      <h3>{item.disciplineName ?? "Дисциплина"}</h3>

                      <div className="discipline-meta">
                        <span>{getModuleText(item)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
      </section>
    </div>
  );
}