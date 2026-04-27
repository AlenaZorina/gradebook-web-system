import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, StudentDiscipline } from "../api";
import { getStudentDisciplines } from "../api";
import "./TeacherSchedulePage.css";
import "./StudentDisciplinesPage.css";

type StudentDisciplinesPageProps = {
  user: LoginResponse;
  onLogout: () => void;
  onOpenSchedule: () => void;
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
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 3.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 3.5V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 9.5H20" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function DisciplineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6.5 4.5H17.5A2.5 2.5 0 0 1 20 7V18.5A1.5 1.5 0 0 1 18.5 20H6.5A2.5 2.5 0 0 1 4 17.5V7A2.5 2.5 0 0 1 6.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M8 9H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 13H14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AttendanceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 12L10.4 14.4L16.2 8.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GradesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 12.5H15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 16H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 18.5V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 18.5V5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M19 18.5V14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 19H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 5H8A3 3 0 0 0 5 8V16A3 3 0 0 0 8 19H10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14 8L18 12L14 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="5.8" stroke="currentColor" strokeWidth="1.9" />
      <path d="M15.2 15.2L20 20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function getDisciplineLetter(name: string) {
  return name.trim()[0]?.toUpperCase() ?? "Д";
}

function getModuleText(item: StudentDiscipline) {
  if (item.startModuleNo && item.endModuleNo && item.startModuleNo !== item.endModuleNo) {
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
  onOpenSchedule
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
        setError(err instanceof Error ? err.message : "Ошибка загрузки дисциплин");
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
      const matchesSearch =
        item.disciplineName.toLowerCase().includes(normalizedSearch) ||
        item.teachersShortNames.toLowerCase().includes(normalizedSearch);

      if (!matchesSearch) {
        return false;
      }

      return statusFilter === "current";
    });

    if (sortMode === "name") {
      result = [...result].sort((a, b) =>
        a.disciplineName.localeCompare(b.disciplineName, "ru")
      );
    }

    if (sortMode === "module") {
      result = [...result].sort((a, b) =>
        (a.startModuleNo ?? 999) - (b.startModuleNo ?? 999)
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

      grouped.get(item.courseNo)!.push(item);
    });

    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [filteredDisciplines]);

  return (
    <main className="schedule-layout">
      <aside className="app-sidebar">
        <div className="sidebar-main">
          <div className="user-block">
            <div className="avatar-placeholder avatar-initials">
              {getStudentInitials(user)}
            </div>

            <div>
              <p>{getStudentShortName(user)}</p>
              <span>{studentInfo ? `Студент · ${studentInfo.groupName}` : "Студент"}</span>
            </div>
          </div>

          <div className="sidebar-section-title">ОБЩЕЕ</div>

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

            <button className="nav-item" type="button">
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button className="nav-item" type="button">
              <span className="nav-icon">
                <GradesIcon />
              </span>
              Оценки
            </button>
          </nav>

          <div className="sidebar-divider" />

          <div className="sidebar-section-title">BI-КОНТУР</div>

          <button className="nav-item" type="button">
            <span className="nav-icon">
              <AnalyticsIcon />
            </span>
            Модуль аналитики
          </button>
        </div>

        <button className="logout-button" type="button" onClick={onLogout}>
          <span className="nav-icon">
            <LogoutIcon />
          </span>
          Выйти
        </button>
      </aside>

      <section className="student-disciplines-content">
        <header className="student-disciplines-header">
          <div>
            <h1>Дисциплины</h1>

            {studentInfo && (
              <p>
                {studentInfo.courseNo} курс · {studentInfo.groupName}
              </p>
            )}
          </div>

          {studentInfo && (
            <div className="student-disciplines-program">
              <span>Образовательная программа</span>
              <strong>{studentInfo.programName}</strong>
            </div>
          )}
        </header>

        <div className="student-disciplines-toolbar">
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

          <label className="student-disciplines-search">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск"
            />

            <span>
              <SearchIcon />
            </span>
          </label>
        </div>

        {isLoading && <div className="disciplines-state">Загружаем дисциплины...</div>}

        {error && <div className="disciplines-error">{error}</div>}

        {!isLoading && !error && filteredDisciplines.length === 0 && (
          <div className="disciplines-state">Дисциплины не найдены</div>
        )}

        {!isLoading &&
          !error &&
          groupedByCourse.map(([courseNo, items]) => (
            <section className="student-course-section" key={courseNo}>
              <h2>{courseNo} курс</h2>

              <div className="student-disciplines-grid">
                {items.map((item) => (
                  <article className="student-discipline-card" key={item.idDiscipline}>
                    <div className="student-discipline-cover">
                      <span>{getDisciplineLetter(item.disciplineName)}</span>
                    </div>

                    <div className="student-discipline-card-body">
                      <h3 title={item.disciplineName}>{item.disciplineName}</h3>

                      <div className="student-discipline-meta">
                        <span>{item.groupName}</span>
                        <span>{getModuleText(item)}</span>
                      </div>

                      <p>
                        Преподаватели:{" "}
                        <strong>{item.teachersShortNames || "не указаны"}</strong>
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
      </section>
    </main>
  );
}