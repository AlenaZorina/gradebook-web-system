import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, OfficeAnalytics } from "../api";
import { getOfficeAnalytics } from "../api";
import "./TeacherSchedulePage.css";
import "./OfficeAnalyticsPage.css";

type OfficeAnalyticsPageProps = {
  user: LoginResponse;
  onLogout: () => void;
  onOpenResits: () => void;
  onOpenAttendance: () => void;
  onOpenFinalSheets: () => void;
  onOpenStudents: () => void;
};

function pluralRu(count: number, one: string, few: string, many: string) {
  const abs = Math.abs(count);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod100 >= 11 && mod100 <= 14) {
    return many;
  }

  if (mod10 === 1) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return few;
  }

  return many;
}

function countWithWord(count: number, one: string, few: string, many: string) {
  return `${count} ${pluralRu(count, one, few, many)}`;
}

function formatPercent(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Number(value).toFixed(1).replace(".", ",").replace(",0", "")}%`;
}

function formatGrade(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number(value).toFixed(1).replace(".", ",");
}

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

export function OfficeAnalyticsPage({
  user,
  onLogout,
  onOpenResits,
  onOpenAttendance,
  onOpenFinalSheets,
  onOpenStudents
}: OfficeAnalyticsPageProps) {
  const [analytics, setAnalytics] = useState<OfficeAnalytics | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState("all");
  const [selectedCourseNo, setSelectedCourseNo] = useState("all");
  const [selectedModuleNo, setSelectedModuleNo] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const programId =
    selectedProgramId === "all" ? null : Number(selectedProgramId);
  const courseNo = selectedCourseNo === "all" ? null : Number(selectedCourseNo);
  const moduleNo = selectedModuleNo === "all" ? null : Number(selectedModuleNo);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getOfficeAnalytics(
          user.idUser,
          programId,
          courseNo,
          moduleNo
        );

        setAnalytics(data);
      } catch (err) {
        setAnalytics(null);
        setError(
          err instanceof Error
            ? err.message
            : "Ошибка загрузки BI-модуля учебного офиса"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, [user.idUser, programId, courseNo, moduleNo]);

  const maxAttendance = useMemo(() => {
    return Math.max(
      1,
      ...(analytics?.attendanceByDate.map(
        (item) => item.attendancePercent ?? 0
      ) ?? [1])
    );
  }, [analytics]);

  const maxGradeDistribution = useMemo(() => {
    return Math.max(
      1,
      ...(analytics?.gradeDistribution.map((item) => item.count) ?? [1])
    );
  }, [analytics]);

  const maxProgramStudents = useMemo(() => {
    return Math.max(
      1,
      ...(analytics?.programComparison.map((item) => item.studentsCount) ?? [1])
    );
  }, [analytics]);

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
            <button className="nav-item active" type="button">
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

      <main className="office-analytics-content">
        <section className="office-analytics-hero">
          <div className="office-analytics-hero-text">
            <span>BI-витрина учебного офиса</span>
            <h1>Аналитика образовательного процесса</h1>
            <p>
              Сводная статистика по студентам, группам, образовательным
              программам, посещаемости, итоговым оценкам, ведомостям и зонам
              риска.
            </p>
          </div>

          {analytics && (
            <div className="office-analytics-hero-badge">
              <strong>{analytics.studentsCount}</strong>
              <span>
                {pluralRu(
                  analytics.studentsCount,
                  "студент в выборке",
                  "студента в выборке",
                  "студентов в выборке"
                )}
              </span>
            </div>
          )}
        </section>

        <section className="office-analytics-filters">
          <label>
            <span>ОП</span>
            <select
              value={selectedProgramId}
              onChange={(event) => setSelectedProgramId(event.target.value)}
              disabled={!analytics}
            >
              <option value="all">Все ОП</option>
              {analytics?.filterOptions.programs.map((program) => (
                <option key={program.idProgram} value={program.idProgram}>
                  {program.programName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Курс</span>
            <select
              value={selectedCourseNo}
              onChange={(event) => setSelectedCourseNo(event.target.value)}
              disabled={!analytics}
            >
              <option value="all">Все курсы</option>
              {analytics?.filterOptions.courseNos.map((course) => (
                <option key={course} value={course}>
                  {course} курс
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Модуль</span>
            <select
              value={selectedModuleNo}
              onChange={(event) => setSelectedModuleNo(event.target.value)}
              disabled={!analytics}
            >
              <option value="all">Все модули</option>
              {analytics?.filterOptions.moduleNos.map((module) => (
                <option key={module} value={module}>
                  {module} модуль
                </option>
              ))}
            </select>
          </label>
        </section>

        {isLoading && (
          <div className="schedule-state">
            Загружаем BI-модуль учебного офиса...
          </div>
        )}

        {error && <div className="schedule-error">{error}</div>}

        {analytics && !error && (
          <>
            <section className="office-analytics-kpi-grid">
              <article>
                <span>Средняя посещаемость</span>
                <strong>{formatPercent(analytics.averageAttendancePercent)}</strong>
                <p>
                  {countWithWord(
                    analytics.totalLessons,
                    "занятие",
                    "занятия",
                    "занятий"
                  )}{" "}
                  учтено
                </p>
              </article>

              <article>
                <span>Средний итоговый балл</span>
                <strong>{formatGrade(analytics.averageFinalGrade)}</strong>
                <p>
                  Заполнено:{" "}
                  {countWithWord(
                    analytics.filledFinalGradesCount,
                    "итоговая оценка",
                    "итоговые оценки",
                    "итоговых оценок"
                  )}
                </p>
              </article>

              <article>
                <span>Студенты в зоне риска</span>
                <strong>{analytics.atRiskStudentsCount}</strong>
                <p>
                  {countWithWord(
                    analytics.failedStudentsCount,
                    "студент",
                    "студента",
                    "студентов"
                  )}{" "}
                  с итогом ниже 4
                </p>
              </article>

              <article>
                <span>Покрытие системы</span>
                <strong>
                  {analytics.disciplinesCount}/{analytics.groupsCount}
                </strong>
                <p>
                  {countWithWord(
                    analytics.disciplinesCount,
                    "дисциплина",
                    "дисциплины",
                    "дисциплин"
                  )}{" "}
                  /{" "}
                  {countWithWord(
                    analytics.groupsCount,
                    "группа",
                    "группы",
                    "групп"
                  )}
                </p>
              </article>

              <article>
                <span>Активные студенты</span>
                <strong>{analytics.activeStudentsCount}</strong>
                <p>
                  из{" "}
                  {countWithWord(
                    analytics.studentsCount,
                    "студента",
                    "студентов",
                    "студентов"
                  )}
                </p>
              </article>

              <article>
                <span>Ведомости</span>
                <strong>
                  {analytics.approvedSheetsCount}/{analytics.submittedSheetsCount}
                </strong>
                <p>
                  утверждено: {analytics.approvedSheetsCount} / отправлено:{" "}
                  {analytics.submittedSheetsCount}
                </p>
              </article>
            </section>

            <section className="office-analytics-main-grid">
              <article className="office-analytics-card wide">
                <div className="office-analytics-card-heading">
                  <div>
                    <h2>Динамика посещаемости</h2>
                    <p>Доля присутствий по датам занятий</p>
                  </div>
                </div>

                {analytics.attendanceByDate.length === 0 ? (
                  <div className="office-analytics-empty">
                    Данных по посещаемости пока нет
                  </div>
                ) : (
                  <div className="office-analytics-bars timeline">
                    {analytics.attendanceByDate.map((point) => (
                      <div key={point.lessonDate} className="office-analytics-bar-row">
                        <span>{point.dateLabel}</span>
                        <div>
                          <i
                            style={{
                              width: `${Math.max(
                                6,
                                ((point.attendancePercent ?? 0) / maxAttendance) *
                                  100
                              )}%`
                            }}
                          />
                        </div>
                        <strong>{formatPercent(point.attendancePercent)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="office-analytics-card">
                <div className="office-analytics-card-heading">
                  <div>
                    <h2>Распределение итогов</h2>
                    <p>Группировка студентов по итоговой оценке</p>
                  </div>
                </div>

                <div className="office-analytics-bars">
                  {analytics.gradeDistribution.map((item) => (
                    <div key={item.label} className="office-analytics-bar-row">
                      <span>{item.label}</span>
                      <div>
                        <i
                          style={{
                            width: `${Math.max(
                              6,
                              (item.count / maxGradeDistribution) * 100
                            )}%`
                          }}
                        />
                      </div>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="office-analytics-card">
                <div className="office-analytics-card-heading">
                  <div>
                    <h2>Статусы студентов</h2>
                    <p>Состояние контингента</p>
                  </div>
                </div>

                <div className="office-analytics-status-list">
                  {analytics.studentStatusDistribution.map((item) => (
                    <div key={item.statusName}>
                      <span>{item.statusName}</span>
                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="office-analytics-card wide">
                <div className="office-analytics-card-heading">
                  <div>
                    <h2>Сравнение образовательных программ</h2>
                    <p>Контингент, посещаемость, итоговые баллы и риски</p>
                  </div>
                </div>

                <div className="office-analytics-program-list">
                  {analytics.programComparison.length === 0 ? (
                    <div className="office-analytics-empty">
                      Нет данных по образовательным программам
                    </div>
                  ) : (
                    analytics.programComparison.map((item) => (
                      <div key={item.idProgram}>
                        <div>
                          <h3>{item.programName}</h3>
                          <p>
                            {countWithWord(
                              item.groupsCount,
                              "группа",
                              "группы",
                              "групп"
                            )}{" "}
                            ·{" "}
                            {countWithWord(
                              item.studentsCount,
                              "студент",
                              "студента",
                              "студентов"
                            )}
                          </p>
                        </div>

                        <div className="office-analytics-program-scale">
                          <i
                            style={{
                              width: `${Math.max(
                                6,
                                (item.studentsCount / maxProgramStudents) * 100
                              )}%`
                            }}
                          />
                        </div>

                        <ul>
                          <li>Посещаемость {formatPercent(item.averageAttendancePercent)}</li>
                          <li>Итог {formatGrade(item.averageFinalGrade)}</li>
                          <li>Риск {item.atRiskStudentsCount}</li>
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="office-analytics-card wide">
                <div className="office-analytics-card-heading">
                  <div>
                    <h2>Сравнение дисциплин</h2>
                    <p>Посещаемость, итоги и риски по дисциплинам</p>
                  </div>
                </div>

                <div className="office-analytics-comparison-list">
                  {analytics.disciplineComparison.length === 0 ? (
                    <div className="office-analytics-empty">
                      Нет данных по дисциплинам
                    </div>
                  ) : (
                    analytics.disciplineComparison.slice(0, 10).map((item) => (
                      <div key={item.idDiscipline}>
                        <h3>{item.disciplineName}</h3>
                        <p>
                          {countWithWord(
                            item.groupsCount,
                            "группа",
                            "группы",
                            "групп"
                          )}{" "}
                          ·{" "}
                          {countWithWord(
                            item.studentsCount,
                            "студент",
                            "студента",
                            "студентов"
                          )}
                        </p>
                        <span>
                          Посещаемость {formatPercent(item.averageAttendancePercent)}
                        </span>
                        <span>Итог {formatGrade(item.averageFinalGrade)}</span>
                        <span>
                          {countWithWord(
                            item.failedStudentsCount,
                            "неуд",
                            "неуда",
                            "неудов"
                          )}
                        </span>
                        <span>Риск {item.atRiskStudentsCount}</span>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="office-analytics-card wide">
                <div className="office-analytics-card-heading">
                  <div>
                    <h2>Группы с отклонениями</h2>
                    <p>Группы, где есть риск по посещаемости или оценкам</p>
                  </div>
                </div>

                <div className="office-analytics-comparison-list compact">
                  {analytics.groupComparison
                    .filter((item) => item.atRiskStudentsCount > 0)
                    .slice(0, 10)
                    .map((item) => (
                      <div key={item.idGroup}>
                        <h3>{item.groupName}</h3>
                        <p>
                          {item.programName} · {item.courseNo} курс ·{" "}
                          {countWithWord(
                            item.studentsCount,
                            "студент",
                            "студента",
                            "студентов"
                          )}
                        </p>
                        <span>
                          Посещаемость {formatPercent(item.averageAttendancePercent)}
                        </span>
                        <span>Итог {formatGrade(item.averageFinalGrade)}</span>
                        <span>Риск {item.atRiskStudentsCount}</span>
                      </div>
                    ))}

                  {analytics.groupComparison.filter(
                    (item) => item.atRiskStudentsCount > 0
                  ).length === 0 && (
                    <div className="office-analytics-empty">
                      Групп с выраженными отклонениями не найдено
                    </div>
                  )}
                </div>
              </article>

              <article className="office-analytics-card wide risk">
                <div className="office-analytics-card-heading">
                  <div>
                    <h2>Студенты в зоне риска</h2>
                    <p>Низкая посещаемость, неуды, незаполненные итоги и работы</p>
                  </div>
                </div>

                <div className="office-analytics-risk-list">
                  {analytics.riskStudents.length === 0 ? (
                    <div className="office-analytics-empty">
                      Критичных отклонений не найдено
                    </div>
                  ) : (
                    analytics.riskStudents.map((riskStudent) => (
                      <div
                        key={`${riskStudent.idStudent}-${riskStudent.idDiscipline}`}
                      >
                        <div>
                          <h3>{riskStudent.fullName}</h3>
                          <p>
                            {riskStudent.groupName} · {riskStudent.programName} ·{" "}
                            {riskStudent.disciplineName}
                          </p>
                        </div>

                        <span>{riskStudent.riskReason}</span>

                        <strong>
                          {formatPercent(riskStudent.attendancePercent)} /{" "}
                          {formatGrade(riskStudent.finalGrade)}
                        </strong>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  );
}