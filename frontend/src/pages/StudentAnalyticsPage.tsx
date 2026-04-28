import { useEffect, useMemo, useState } from "react";
import type {
  LoginResponse,
  StudentAnalytics,
  StudentDiscipline
} from "../api";
import {
  getStudentAnalytics,
  getStudentDisciplines
} from "../api";
import "./TeacherSchedulePage.css";
import "./TeacherAnalyticsPage.css";
import "./StudentAnalyticsPage.css";

type StudentAnalyticsPageProps = {
  user: LoginResponse;
  initialDisciplineId?: number | null;
  onLogout: () => void;
  onOpenSchedule: () => void;
  onOpenDisciplines: () => void;
  onOpenAttendance: (disciplineId?: number, groupId?: number) => void;
  onOpenGradebook: (disciplineId?: number, groupId?: number) => void;
};

function formatPercent(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

function formatGrade(value: number | null) {
  if (value === null || value === undefined) {
    return "—";
  }

  return Number(value).toFixed(1).replace(".", ",");
}

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

export function StudentAnalyticsPage({
  user,
  initialDisciplineId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenAttendance,
  onOpenGradebook
}: StudentAnalyticsPageProps) {
  const [disciplines, setDisciplines] = useState<StudentDiscipline[]>([]);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(
    initialDisciplineId ?? null
  );
  const [analytics, setAnalytics] = useState<StudentAnalytics | null>(null);
  const [isDisciplinesLoading, setIsDisciplinesLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDisciplines() {
      try {
        setIsDisciplinesLoading(true);
        setError("");

        const data = await getStudentDisciplines(user.idUser);
        setDisciplines(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки дисциплин");
      } finally {
        setIsDisciplinesLoading(false);
      }
    }

    loadDisciplines();
  }, [user.idUser]);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsAnalyticsLoading(true);
        setError("");

        const data = await getStudentAnalytics(user.idUser, selectedDisciplineId);
        setAnalytics(data);
      } catch (err) {
        setAnalytics(null);
        setError(err instanceof Error ? err.message : "Ошибка загрузки аналитики");
      } finally {
        setIsAnalyticsLoading(false);
      }
    }

    loadAnalytics();
  }, [user.idUser, selectedDisciplineId]);

  const uniqueDisciplines = useMemo(() => {
    const map = new Map<number, StudentDiscipline>();

    disciplines.forEach((item) => {
      if (!map.has(item.idDiscipline)) {
        map.set(item.idDiscipline, item);
      }
    });

    return Array.from(map.values());
  }, [disciplines]);

  const selectedDiscipline = useMemo(
    () =>
      disciplines.find((item) => item.idDiscipline === selectedDisciplineId) ??
      null,
    [disciplines, selectedDisciplineId]
  );

  const currentGroupName =
    analytics?.groupName ?? selectedDiscipline?.groupName ?? "Группа";

  const maxDistributionCount = Math.max(
    1,
    ...(analytics?.gradeDistribution.map((item) => item.count) ?? [1])
  );

  const maxGradeProgress = Math.max(
    10,
    ...(analytics?.gradeProgress.map((item) => item.gradeValue ?? 0) ?? [10])
  );

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
              <span>Студент · {currentGroupName}</span>
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

            <button className="nav-item" type="button" onClick={onOpenDisciplines}>
              <span className="nav-icon">
                <DisciplineIcon />
              </span>
              Дисциплины
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() =>
                onOpenAttendance(
                  selectedDisciplineId ?? undefined,
                  selectedDiscipline?.idGroup
                )
              }
            >
              <span className="nav-icon">
                <AttendanceIcon />
              </span>
              Посещаемость
            </button>

            <button
              className="nav-item"
              type="button"
              onClick={() =>
                onOpenGradebook(
                  selectedDisciplineId ?? undefined,
                  selectedDiscipline?.idGroup
                )
              }
            >
              <span className="nav-icon">
                <GradesIcon />
              </span>
              Ведомость
            </button>
          </nav>

          <div className="sidebar-divider" />

          <div className="sidebar-section-title">BI-КОНТУР</div>

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

      <section className="analytics-content student-analytics-content">
        <div className="analytics-hero student-analytics-hero">
          <div>
            <p className="analytics-eyebrow">BI-витрина студента</p>
            <h1>Личная аналитика успеваемости и посещаемости</h1>
            <p>
              Персональная статистика по дисциплинам: посещаемость, текущие оценки,
              предварительный итог и зоны риска.
            </p>
          </div>

          <div className="analytics-hero-badge">
            <strong>{analytics?.disciplinesCount ?? 0}</strong>
            <span>дисциплин в аналитике</span>
          </div>
        </div>

        <div className="analytics-filters student-analytics-filters">
          <label>
            Дисциплина
            <select
              value={selectedDisciplineId ?? "all"}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedDisciplineId(value === "all" ? null : Number(value));
              }}
            >
              <option value="all">Все дисциплины</option>
              {uniqueDisciplines.map((discipline) => (
                <option
                  key={discipline.idDiscipline}
                  value={discipline.idDiscipline}
                >
                  {discipline.disciplineName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isDisciplinesLoading && (
          <div className="analytics-state">Загружаем список дисциплин...</div>
        )}

        {isAnalyticsLoading && (
          <div className="analytics-state">Обновляем личную витрину...</div>
        )}

        {error && <div className="analytics-error">{error}</div>}

        {analytics && !error && (
          <>
            <div className="analytics-kpi-grid student-analytics-kpi-grid">
              <article className="analytics-kpi-card">
                <span>Средняя посещаемость</span>
                <strong>{formatPercent(analytics.averageAttendancePercent)}</strong>
                <p>{analytics.totalLessons} занятий учтено</p>
              </article>

              <article className="analytics-kpi-card">
                <span>Средняя оценка</span>
                <strong>{formatGrade(analytics.averageGrade)}</strong>
                <p>
                  {analytics.filledGradesCount}/{analytics.totalGradesCount} оценок
                  заполнено
                </p>
              </article>

              <article className="analytics-kpi-card">
                <span>Предварительный итог</span>
                <strong>{formatGrade(analytics.preliminaryFinalGrade)}</strong>
                <p>На основе доступных оценок</p>
              </article>

              <article className={`analytics-kpi-card ${analytics.hasRisk ? "warning" : ""}`}>
                <span>Статус риска</span>
                <strong>{analytics.hasRisk ? "Есть" : "Нет"}</strong>
                <p>{analytics.riskReason}</p>
              </article>
            </div>

            <div className="analytics-main-grid">
              <article className="analytics-card">
                <div className="analytics-card-header">
                  <div>
                    <h2>Динамика посещаемости</h2>
                    <p>Личная посещаемость по датам занятий</p>
                  </div>
                </div>

                {analytics.attendanceByDate.length === 0 ? (
                  <div className="student-analytics-empty">
                    Данных по посещаемости пока нет
                  </div>
                ) : (
                  <div className="attendance-chart">
                    {analytics.attendanceByDate.map((point) => (
                      <div className="attendance-chart-item" key={point.lessonDate}>
                        <span>{formatPercent(point.attendancePercent)}</span>

                        <div className="attendance-bar-track">
                          <div
                            className="attendance-bar"
                            style={{
                              height: `${Math.max(point.attendancePercent ?? 0, 4)}%`
                            }}
                          />
                        </div>

                        <span>{point.dateLabel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="analytics-card">
                <div className="analytics-card-header">
                  <div>
                    <h2>Распределение оценок</h2>
                    <p>Группировка всех текущих оценок студента</p>
                  </div>
                </div>

                <div className="distribution-list">
                  {analytics.gradeDistribution.map((item) => (
                    <div className="distribution-row" key={item.label}>
                      <span>{item.label}</span>

                      <div>
                        <div
                          style={{
                            width: `${(item.count / maxDistributionCount) * 100}%`
                          }}
                        />
                      </div>

                      <strong>{item.count}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="analytics-lower-grid">
              <article className="analytics-card">
                <div className="analytics-card-header">
                  <div>
                    <h2>Динамика оценок</h2>
                    <p>Оценки по контрольным элементам</p>
                  </div>
                </div>

                {analytics.gradeProgress.length === 0 ? (
                  <div className="student-analytics-empty">
                    Оценки по контрольным элементам пока не заполнены
                  </div>
                ) : (
                  <div className="student-grade-progress-chart">
                    {analytics.gradeProgress.map((point, index) => (
                      <div
                        className="student-grade-progress-item"
                        key={`${point.idDiscipline}-${point.elementName}-${index}`}
                      >
                        <span>{formatGrade(point.gradeValue)}</span>

                        <div className="student-grade-progress-track">
                          <div
                            className="student-grade-progress-bar"
                            style={{
                              height: `${Math.max(
                                ((point.gradeValue ?? 0) / maxGradeProgress) * 100,
                                5
                              )}%`
                            }}
                          />
                        </div>

                        <p title={`${point.disciplineName}: ${point.elementName}`}>
                          {point.elementName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="analytics-card">
                <div className="analytics-card-header">
                  <div>
                    <h2>Сводка по дисциплинам</h2>
                    <p>Посещаемость, оценки и риски по каждой дисциплине</p>
                  </div>
                </div>

                <div className="comparison-list">
                  {analytics.disciplineSummary.length === 0 && (
                    <div className="student-analytics-empty">
                      Сводка по дисциплинам пока недоступна
                    </div>
                  )}

                  {analytics.disciplineSummary.map((item) => (
                    <div className="comparison-row" key={item.idDiscipline}>
                      <div>
                        <strong>{item.disciplineName}</strong>
                        <span>
                          {item.hasRisk ? item.riskReason : "Критичных отклонений нет"}
                        </span>
                      </div>

                      <div className="comparison-metrics">
                        <span>Посещ. {formatPercent(item.attendancePercent)}</span>
                        <span>Ср. {formatGrade(item.averageGrade)}</span>
                        <span>Итог {formatGrade(item.finalGrade)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </>
        )}
      </section>
    </main>
  );
}