import { useEffect, useMemo, useState } from "react";
import type { LoginResponse, OfficeFinalSheetGroup } from "../api";
import { getOfficeFinalSheetGroups } from "../api";
import "./TeacherSchedulePage.css";
import "./OfficeFinalSheetGroupsPage.css";

type OfficeFinalSheetGroupsPageProps = {
  user: LoginResponse;
  disciplineId: number;
  onLogout: () => void;
  onBack: () => void;
  onSelectGroup: (groupId: number) => void;
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

function getGroupKey(group: OfficeFinalSheetGroup) {
  return group.groupName.trim().toLowerCase() || `id:${group.idGroup}`;
}

function mergeFinalSheetGroups(groups: OfficeFinalSheetGroup[]) {
  const map = new Map<string, OfficeFinalSheetGroup>();

  groups.forEach((group) => {
    const key = getGroupKey(group);
    const existing = map.get(key);

    if (!existing) {
      map.set(key, { ...group });
      return;
    }

    const studentsCount = Math.max(existing.studentsCount, group.studentsCount);
    const filledFinalGradesCount = Math.max(
      existing.filledFinalGradesCount,
      group.filledFinalGradesCount
    );
    const failedStudentsCount = Math.max(
      existing.failedStudentsCount,
      group.failedStudentsCount
    );

    map.set(key, {
      ...existing,
      studentsCount,
      filledFinalGradesCount,
      failedStudentsCount,
      filledPercent:
        studentsCount === 0
          ? null
          : Number(((filledFinalGradesCount / studentsCount) * 100).toFixed(1))
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    a.groupName.localeCompare(b.groupName, "ru")
  );
}

export function OfficeFinalSheetGroupsPage({
  user,
  disciplineId,
  onLogout,
  onBack,
  onSelectGroup,
  onOpenResits,
  onOpenAttendance,
  onOpenStudents,
  onOpenAnalytics
}: OfficeFinalSheetGroupsPageProps) {
  const [groups, setGroups] = useState<OfficeFinalSheetGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGroups() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getOfficeFinalSheetGroups(user.idUser, disciplineId);
        setGroups(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка загрузки групп");
      } finally {
        setIsLoading(false);
      }
    }

    loadGroups();
  }, [user.idUser, disciplineId]);

  const displayGroups = useMemo(() => mergeFinalSheetGroups(groups), [groups]);

  const headerInfo = useMemo(
    () => displayGroups[0] ?? groups[0] ?? null,
    [displayGroups, groups]
  );

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

            <button className="nav-item active" type="button" onClick={onBack}>
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

      <main className="office-final-groups-content">
        <button className="details-back-button" type="button" onClick={onBack}>
          ← Назад к дисциплинам
        </button>

        <section className="office-final-groups-hero">
          <h1>Итоговые ведомости / группа</h1>

          {headerInfo && (
            <div className="office-final-groups-heading">
              <div>
                <h2>{headerInfo.disciplineName}</h2>
                <p>{headerInfo.teacherShortName}</p>
              </div>

              <span>{headerInfo.courseNo} курс</span>
            </div>
          )}
        </section>

        {isLoading && <div className="schedule-state">Загружаем группы...</div>}

        {error && <div className="schedule-error">{error}</div>}

        {!isLoading && !error && displayGroups.length === 0 && (
          <div className="schedule-state">Группы по дисциплине не найдены</div>
        )}

        {!isLoading && !error && displayGroups.length > 0 && (
          <section className="office-final-groups-list">
            {displayGroups.map((group) => (
              <button
                className="office-final-group-card"
                key={`${group.idDiscipline}-${getGroupKey(group)}`}
                type="button"
                onClick={() => onSelectGroup(group.idGroup)}
              >
                <span>
                  <h3>{group.groupName}</h3>

                  <small>
                    {formatCount(
                      group.studentsCount,
                      "студент",
                      "студента",
                      "студентов"
                    )}{" "}
                    · заполнено {formatPercent(group.filledPercent)} · неудов:{" "}
                    {group.failedStudentsCount}
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