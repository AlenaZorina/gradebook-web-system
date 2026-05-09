import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, TeacherDiscipline } from "../api";
import { getTeacherDisciplines } from "../api";
import "./TeacherSchedulePage.css";
import "./TeacherDisciplinesPage.css";
import {
  getTeacherInitials,
  getTeacherShortName,
  getTeacherSubtitle
} from "../utils/teacherProfile";



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

function GradebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="4" width="14" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 12.5H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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

type TeacherDisciplinesPageProps = {
    user: LoginResponse;
    onLogout: () => void;
    onOpenSchedule: () => void;
    onSelectDiscipline: (disciplineId: number) => void;
    onOpenAttendance: () => void;
    onOpenGradebook: () => void;
    onOpenAnalytics: () => void;
  };

function getModuleText(item: TeacherDiscipline) {
  if (item.startModuleNo === item.endModuleNo) {
    return `${item.startModuleNo} модуль`;
  }

  return `${item.startModuleNo}–${item.endModuleNo} модули`;
}

export function TeacherDisciplinesPage({
    user,
    onLogout,
    onOpenSchedule,
    onSelectDiscipline,
    onOpenAttendance,
    onOpenGradebook,
    onOpenAnalytics
  }: TeacherDisciplinesPageProps) {
  const [disciplines, setDisciplines] = useState<TeacherDiscipline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [programFilter, setProgramFilter] = useState("all");
  const [sortMode, setSortMode] = useState("course");

  useEffect(() => {
    async function loadDisciplines() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getTeacherDisciplines(user.idUser);
        setDisciplines(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки дисциплин");
      } finally {
        setIsLoading(false);
      }
    }

    loadDisciplines();
  }, [user.idUser]);

  const programs = useMemo(() => {
    return Array.from(new Set(disciplines.map((item) => item.programName))).sort();
  }, [disciplines]);

  const filteredDisciplines = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return disciplines
      .filter((item) => {
        const matchesProgram =
          programFilter === "all" || item.programName === programFilter;

        const matchesSearch =
          !normalizedSearch ||
          item.disciplineName.toLowerCase().includes(normalizedSearch) ||
          item.groupName.toLowerCase().includes(normalizedSearch);

        return matchesProgram && matchesSearch;
      })
      .sort((a, b) => {
        if (sortMode === "name") {
          return a.disciplineName.localeCompare(b.disciplineName, "ru");
        }

        return a.courseNo - b.courseNo || a.disciplineName.localeCompare(b.disciplineName, "ru");
      });
  }, [disciplines, programFilter, search, sortMode]);

  const courses = useMemo(() => {
    const grouped = new Map<number, TeacherDiscipline[]>();

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
              {getTeacherInitials(user)}
            </div>

            <div>
              <p>{getTeacherShortName(user)}</p>
              <span>{getTeacherSubtitle(user)}</span>
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

            <button className="nav-item" type="button" onClick={onOpenAttendance}>
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button className="nav-item" type="button" onClick={onOpenGradebook}>
              <span className="nav-icon">
                <GradebookIcon />
              </span>
              Ведомость
            </button>
          </nav>

          <div className="sidebar-divider" />

          <div className="sidebar-section-title">BI-КОНТУР</div>

          <button className="nav-item" type="button" onClick={onOpenAnalytics}>
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

      <section className="disciplines-content">
        <div className="disciplines-header">
          <h1>Дисциплины</h1>

          <div className="disciplines-toolbar">
            <select
              value={programFilter}
              onChange={(event) => setProgramFilter(event.target.value)}
            >
              <option value="all">Направление</option>
              {programs.map((program) => (
                <option key={program} value={program}>
                  {program}
                </option>
              ))}
            </select>

            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value)}
            >
              <option value="course">Сортировать по курсу</option>
              <option value="name">Сортировать по названию</option>
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

        {isLoading && <div className="disciplines-state">Загружаем дисциплины...</div>}

        {error && <div className="disciplines-error">{error}</div>}

        {!isLoading && !error && filteredDisciplines.length === 0 && (
          <div className="disciplines-state">Дисциплины не найдены</div>
        )}

        {!isLoading && !error && courses.map(([courseNo, items]) => (
          <section className="course-section" key={courseNo}>
            <h2>{courseNo} курс</h2>

            <div className="disciplines-grid">
              {items.map((item) => (
                <article
                className="discipline-card"
                key={item.idAssignment}
                onClick={() => onSelectDiscipline(item.idDiscipline)}
              >
                  <div className="discipline-cover">
                    <span>{item.disciplineName.slice(0, 1)}</span>
                  </div>

                  <div className="discipline-card-body">
                    <h3>{item.disciplineName}</h3>

                    <div className="discipline-meta">
                      <span>{item.groupName}</span>
                      <span>{getModuleText(item)}</span>
                    </div>

                    <p>{item.programName}</p>
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