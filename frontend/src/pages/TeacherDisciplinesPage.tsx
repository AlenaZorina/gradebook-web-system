import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, TeacherDiscipline } from "../api";
import { getTeacherDisciplines } from "../api";
import "./TeacherSchedulePage.css";
import "./TeacherDisciplinesPage.css";

type TeacherDisciplinesPageProps = {
    user: LoginResponse;
    onLogout: () => void;
    onOpenSchedule: () => void;
    onSelectDiscipline: (disciplineId: number) => void;
    onOpenAttendance: () => void;
    onOpenGradebook: () => void;
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
    onOpenGradebook
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
        <div className="user-block">
          <div className="avatar-placeholder" />
          <div>
            <p>
              {user.surname} {user.name[0]}.
              {user.fathername ? `${user.fathername[0]}.` : ""}
            </p>
            <span>Преподаватель кафедры</span>
          </div>
        </div>

        <div className="sidebar-section-title">ОБЩЕЕ</div>

        <nav className="main-nav">
          <button className="nav-item" onClick={onOpenSchedule}>
            <span />
            Расписание
          </button>

          <button className="nav-item active">
            <span />
            Дисциплины
          </button>

          <button className="nav-item" onClick={onOpenAttendance}>
            <span />
            Посещаемость
            </button>

            <button className="nav-item" onClick={onOpenGradebook}>
            <span />
            Ведомость
            </button>
        </nav>

        <div className="sidebar-divider" />

        <div className="sidebar-section-title">BI-КОНТУР</div>

        <button className="nav-item">
          <span />
          Модуль аналитики
        </button>

        <button className="logout-button" onClick={onLogout}>
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