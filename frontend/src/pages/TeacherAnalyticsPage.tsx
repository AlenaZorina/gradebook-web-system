import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, TeacherAnalytics, TeacherDiscipline } from "../api";
import { getTeacherAnalytics, getTeacherDisciplines } from "../api";
import "./TeacherSchedulePage.css";
import "./TeacherAnalyticsPage.css";
import {
  getTeacherInitials,
  getTeacherShortName,
  getTeacherSubtitle
} from "../utils/teacherProfile";

type TeacherAnalyticsPageProps = {
  user: LoginResponse;
  initialDisciplineId?: number | null;
  initialGroupId?: number | null;
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
  return value === null ? "—" : value.toFixed(1);
}

export function TeacherAnalyticsPage({
  user,
  initialDisciplineId,
  initialGroupId,
  onLogout,
  onOpenSchedule,
  onOpenDisciplines,
  onOpenAttendance,
  onOpenGradebook
}: TeacherAnalyticsPageProps) {
  const [disciplines, setDisciplines] = useState<TeacherDiscipline[]>([]);
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(
    initialDisciplineId ?? null
  );
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    initialGroupId ?? null
  );

  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDisciplines() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getTeacherDisciplines(user.idUser);
        setDisciplines(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки фильтров");
      } finally {
        setIsLoading(false);
      }
    }

    loadDisciplines();
  }, [user.idUser]);

  const uniqueDisciplines = useMemo(() => {
    const map = new Map<number, TeacherDiscipline>();

    disciplines.forEach((item) => {
      if (!map.has(item.idDiscipline)) {
        map.set(item.idDiscipline, item);
      }
    });

    return Array.from(map.values());
  }, [disciplines]);

  const groupOptions = useMemo(() => {
    if (!selectedDisciplineId) {
      return disciplines;
    }

    return disciplines.filter((item) => item.idDiscipline === selectedDisciplineId);
  }, [disciplines, selectedDisciplineId]);

  useEffect(() => {
    if (!selectedDisciplineId) {
      return;
    }

    const groupExists = groupOptions.some((item) => item.idGroup === selectedGroupId);

    if (selectedGroupId && !groupExists) {
      setSelectedGroupId(null);
    }
  }, [selectedDisciplineId, selectedGroupId, groupOptions]);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsAnalyticsLoading(true);
        setError("");

        const data = await getTeacherAnalytics(
          user.idUser,
          selectedDisciplineId,
          selectedGroupId
        );

        setAnalytics(data);
      } catch (err) {
        setAnalytics(null);
        setError(err instanceof Error ? err.message : "Ошибка загрузки BI-модуля");
      } finally {
        setIsAnalyticsLoading(false);
      }
    }

    loadAnalytics();
  }, [user.idUser, selectedDisciplineId, selectedGroupId]);

  const maxDistributionCount = Math.max(
    1,
    ...(analytics?.gradeDistribution.map((item) => item.count) ?? [1])
  );

  return (
    <main className="schedule-layout">
      <aside className="app-sidebar">
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
          <button className="nav-item" onClick={onOpenSchedule}>
            <span />
            Расписание
          </button>

          <button className="nav-item" onClick={onOpenDisciplines}>
            <span />
            Дисциплины
          </button>

          <button
            className="nav-item"
            onClick={() =>
              onOpenAttendance(selectedDisciplineId ?? undefined, selectedGroupId ?? undefined)
            }
          >
            <span />
            Посещаемость
          </button>

          <button
            className="nav-item"
            onClick={() =>
              onOpenGradebook(selectedDisciplineId ?? undefined, selectedGroupId ?? undefined)
            }
          >
            <span />
            Ведомость
          </button>
        </nav>

        <div className="sidebar-divider" />

        <div className="sidebar-section-title">BI-КОНТУР</div>

        <button className="nav-item active">
          <span />
          Модуль аналитики
        </button>

        <button className="logout-button" onClick={onLogout}>
          Выйти
        </button>
      </aside>

      <section className="analytics-content">
        <div className="analytics-hero">
          <div>
            <p className="analytics-eyebrow">BI-витрина преподавателя</p>
            <h1>Аналитика успеваемости и посещаемости</h1>
            <p>
              Сводные показатели по дисциплинам, группам, рискам и динамике посещаемости.
            </p>
          </div>

          <div className="analytics-hero-badge">
            <strong>{analytics?.studentsCount ?? 0}</strong>
            <span>студентов в выборке</span>
          </div>
        </div>

        <div className="analytics-filters">
          <label>
            Дисциплина
            <select
              value={selectedDisciplineId ?? "all"}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedDisciplineId(value === "all" ? null : Number(value));
                setSelectedGroupId(null);
              }}
            >
              <option value="all">Все дисциплины</option>
              {uniqueDisciplines.map((discipline) => (
                <option key={discipline.idDiscipline} value={discipline.idDiscipline}>
                  {discipline.disciplineName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Группа
            <select
              value={selectedGroupId ?? "all"}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedGroupId(value === "all" ? null : Number(value));
              }}
            >
              <option value="all">Все группы</option>
              {groupOptions.map((item) => (
                <option key={`${item.idDiscipline}-${item.idGroup}`} value={item.idGroup}>
                  {item.groupName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoading && <div className="analytics-state">Загружаем фильтры...</div>}
        {isAnalyticsLoading && <div className="analytics-state">Обновляем витрину...</div>}
        {error && <div className="analytics-error">{error}</div>}

        {analytics && !error && (
          <>
            <div className="analytics-kpi-grid">
              <article className="analytics-kpi-card">
                <span>Средняя посещаемость</span>
                <strong>{formatPercent(analytics.averageAttendancePercent)}</strong>
                <p>{analytics.totalLessons} занятий учтено</p>
              </article>

              <article className="analytics-kpi-card">
                <span>Средний итоговый балл</span>
                <strong>{formatGrade(analytics.averageFinalGrade)}</strong>
                <p>{analytics.filledFinalGradesCount} итоговых оценок заполнено</p>
              </article>

              <article className="analytics-kpi-card warning">
                <span>Студенты в зоне риска</span>
                <strong>{analytics.atRiskStudentsCount}</strong>
                <p>по посещаемости, итогам или незаполненным работам</p>
              </article>

              <article className="analytics-kpi-card">
                <span>Покрытие преподавателя</span>
                <strong>
                  {analytics.disciplinesCount}/{analytics.groupsCount}
                </strong>
                <p>дисциплин / групп</p>
              </article>
            </div>

            <div className="analytics-main-grid">
              <article className="analytics-card wide">
                <div className="analytics-card-header">
                  <div>
                    <h2>Динамика посещаемости</h2>
                    <p>Доля присутствий по датам занятий</p>
                  </div>
                </div>

                <div className="attendance-chart">
                  {analytics.attendanceByDate.map((point) => (
                    <div className="attendance-chart-item" key={point.lessonDate}>
                      <div className="attendance-bar-track">
                        <div
                          className="attendance-bar"
                          style={{
                            height: `${point.attendancePercent ?? 0}%`
                          }}
                        />
                      </div>
                      <strong>{formatPercent(point.attendancePercent)}</strong>
                      <span>{point.dateLabel}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="analytics-card">
                <div className="analytics-card-header">
                  <div>
                    <h2>Распределение итогов</h2>
                    <p>Группировка студентов по итоговой оценке</p>
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
                    <h2>Сравнение дисциплин и групп</h2>
                    <p>Витрина по каждой учебной группе</p>
                  </div>
                </div>

                <div className="comparison-list">
                  {analytics.disciplineComparison.map((item) => (
                    <div
                      className="comparison-row"
                      key={`${item.idDiscipline}-${item.idGroup}`}
                    >
                      <div>
                        <strong>{item.disciplineName}</strong>
                        <span>
                          {item.groupName}, {item.courseNo} курс
                        </span>
                      </div>

                      <div className="comparison-metrics">
                        <span>Посещ. {formatPercent(item.averageAttendancePercent)}</span>
                        <span>Итог {formatGrade(item.averageFinalGrade)}</span>
                        <span>Риск {item.atRiskStudentsCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="analytics-card">
                <div className="analytics-card-header">
                  <div>
                    <h2>Зона риска</h2>
                    <p>Студенты, требующие внимания преподавателя</p>
                  </div>
                </div>

                <div className="risk-list">
                  {analytics.riskStudents.length === 0 && (
                    <div className="empty-risk">Критичных отклонений не найдено</div>
                  )}

                  {analytics.riskStudents.map((student) => (
                    <div
                      className="risk-row"
                      key={`${student.idDiscipline}-${student.idGroup}-${student.idStudent}`}
                    >
                      <div>
                        <strong>{student.fullName}</strong>
                        <span>{student.groupName} · {student.disciplineName}</span>
                      </div>

                      <p>{student.riskReason}</p>
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