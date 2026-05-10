import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, OfficeFinalSheetDiscipline } from "../api";
import { getOfficeFinalSheetDisciplines } from "../api";
import "./TeacherSchedulePage.css";
import "./OfficeFinalSheetsDisciplinesPage.css";

type OfficeFinalSheetsDisciplinesPageProps = {
  user: LoginResponse;
  onLogout: () => void;
  onSelectDiscipline: (disciplineId: number) => void;
  onOpenResits: () => void;
  onOpenAttendance: () => void;
  onOpenStudents: () => void;
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

function getDisciplineLetter(name?: string | null) {
  const cleanedName = (name ?? "")
    .replace(/^\([^)]*\)\s*/, "")
    .trim();

  return cleanedName[0]?.toUpperCase() ?? "Д";
}

function formatArray(values: number[]) {
  if (values.length === 0) {
    return "не указано";
  }

  return values.join(", ");
}

function formatPercent(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value}%`;
}

function pluralize(value: number, one: string, few: string, many: string) {
  const absValue = Math.abs(value) % 100;
  const lastDigit = absValue % 10;

  if (absValue > 10 && absValue < 20) {
    return many;
  }

  if (lastDigit === 1) {
    return one;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }

  return many;
}

function formatCount(value: number, one: string, few: string, many: string) {
  return `${value} ${pluralize(value, one, few, many)}`;
}

function formatPrograms(discipline: OfficeFinalSheetDiscipline) {
  const programNames = discipline.programs
    .map((program) => program.programName)
    .filter(Boolean);

  return programNames.length > 0 ? programNames.join(", ") : "не указана";
}

export function OfficeFinalSheetsDisciplinesPage({
  user,
  onLogout,
  onSelectDiscipline,
  onOpenResits,
  onOpenAttendance,
  onOpenStudents,
  onOpenAnalytics
}: OfficeFinalSheetsDisciplinesPageProps) {
  const [disciplines, setDisciplines] = useState<OfficeFinalSheetDiscipline[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState("all");
  const [selectedCourseNo, setSelectedCourseNo] = useState("all");
  const [selectedModuleNo, setSelectedModuleNo] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDisciplines() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getOfficeFinalSheetDisciplines(user.idUser);
        setDisciplines(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ошибка загрузки дисциплин для итоговых ведомостей"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDisciplines();
  }, [user.idUser]);

  const programOptions = useMemo(() => {
    const map = new Map<number, string>();

    disciplines.forEach((discipline) => {
      discipline.programs.forEach((program) => {
        map.set(program.idProgram, program.programName);
      });
    });

    return Array.from(map.entries())
      .map(([idProgram, programName]) => ({ idProgram, programName }))
      .sort((a, b) => a.programName.localeCompare(b.programName, "ru"));
  }, [disciplines]);

  const courseOptions = useMemo(() => {
    return Array.from(
      new Set(disciplines.flatMap((discipline) => discipline.courseNos))
    ).sort((a, b) => a - b);
  }, [disciplines]);

  const moduleOptions = useMemo(() => {
    return Array.from(
      new Set(disciplines.flatMap((discipline) => discipline.moduleNos))
    ).sort((a, b) => a - b);
  }, [disciplines]);

  const filteredDisciplines = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return disciplines
      .filter((discipline) => {
        const matchesSearch = discipline.disciplineName
          .toLowerCase()
          .includes(normalizedSearch);

        const matchesProgram =
          selectedProgramId === "all" ||
          discipline.programs.some(
            (program) => String(program.idProgram) === selectedProgramId
          );

        const matchesCourse =
          selectedCourseNo === "all" ||
          discipline.courseNos.includes(Number(selectedCourseNo));

        const matchesModule =
          selectedModuleNo === "all" ||
          discipline.moduleNos.includes(Number(selectedModuleNo));

        return matchesSearch && matchesProgram && matchesCourse && matchesModule;
      })
      .sort((a, b) => a.disciplineName.localeCompare(b.disciplineName, "ru"));
  }, [
    disciplines,
    search,
    selectedProgramId,
    selectedCourseNo,
    selectedModuleNo
  ]);

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

            <button className="nav-item active" type="button">
              <span className="nav-icon">
                <FinalSheetsIcon />
              </span>
              Итоговые ведомости
            </button>

            <button className="nav-item" type="button" onClick={onOpenStudents}>
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

      <main className="office-final-disciplines-content">
        <section className="office-final-disciplines-hero">
          <div>
            <h1>Итоговые ведомости / дисциплины</h1>

            <p>
              Выберите дисциплину, чтобы перейти к просмотру итоговых ведомостей
              по группам.
            </p>
          </div>
        </section>

        <section className="office-final-disciplines-filters">
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

          <select
            value={selectedModuleNo}
            onChange={(event) => setSelectedModuleNo(event.target.value)}
          >
            <option value="all">Модуль</option>

            {moduleOptions.map((moduleNo) => (
              <option key={moduleNo} value={moduleNo}>
                {moduleNo} модуль
              </option>
            ))}
          </select>

          <label className="office-final-disciplines-search">
            <SearchIcon />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Поиск по дисциплине"
            />
          </label>
        </section>

        {isLoading && (
          <div className="schedule-state">Загружаем список дисциплин...</div>
        )}

        {error && <div className="schedule-error">{error}</div>}

        {!isLoading && !error && filteredDisciplines.length === 0 && (
          <div className="schedule-state">Дисциплины не найдены</div>
        )}

        {!isLoading && !error && filteredDisciplines.length > 0 && (
          <section className="office-final-disciplines-grid">
            {filteredDisciplines.map((discipline) => (
              <article
                className="office-final-discipline-card"
                key={discipline.idDiscipline}
                role="button"
                tabIndex={0}
                onClick={() => onSelectDiscipline(discipline.idDiscipline)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectDiscipline(discipline.idDiscipline);
                  }
                }}
              >
                <div className="office-final-discipline-cover">
                  <span>{getDisciplineLetter(discipline.disciplineName)}</span>
                </div>

                <div className="office-final-discipline-body">
                  <h2>{discipline.disciplineName}</h2>

                  <div className="office-final-discipline-tags">
                    <span>{formatArray(discipline.courseNos)} курс</span>
                    <span>{formatArray(discipline.moduleNos)} модуль</span>
                  </div>

                  <p className="office-final-discipline-programs">
                    <span>ОП:</span> <strong>{formatPrograms(discipline)}</strong>
                  </p>

                  <div className="office-final-discipline-stats">
                    <span>
                      {formatCount(
                        discipline.groupsCount,
                        "группа",
                        "группы",
                        "групп"
                      )}
                    </span>

                    <span>
                      {formatCount(
                        discipline.finalSheetsCount,
                        "ведомость",
                        "ведомости",
                        "ведомостей"
                      )}
                    </span>

                    <span className="accent">
                      Заполнено {formatPercent(discipline.filledPercent)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}