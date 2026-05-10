import { useEffect, useState } from "react";
import type { LoginResponse, OfficeResitStudentList } from "../api";
import { getOfficeResitStudents } from "../api";
import "./TeacherSchedulePage.css";
import "./OfficeResitStudentsPage.css";

type OfficeResitStudentsPageProps = {
  user: LoginResponse;
  disciplineId: number;
  groupId: number;
  onLogout: () => void;
  onBack: () => void;
  onOpenResits: () => void;
  onOpenAttendance: () => void;
  onOpenFinalSheets: () => void;
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

function formatGrade(value: number) {
  return Number(value).toFixed(2).replace(".", ",").replace(",00", "");
}

function escapeCsvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
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

export function OfficeResitStudentsPage({
  user,
  disciplineId,
  groupId,
  onLogout,
  onBack,
  onOpenResits,
  onOpenAttendance,
  onOpenFinalSheets,
  onOpenStudents,
  onOpenAnalytics
}: OfficeResitStudentsPageProps) {
  const [data, setData] = useState<OfficeResitStudentList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStudents() {
      try {
        setIsLoading(true);
        setError("");

        const result = await getOfficeResitStudents(
          user.idUser,
          disciplineId,
          groupId
        );

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ошибка загрузки списка на пересдачу"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadStudents();
  }, [user.idUser, disciplineId, groupId]);

  function handleExport() {
    if (!data) {
      return;
    }

    const header = [
      "ФИО",
      "Группа",
      "Образовательная программа",
      "Итоговая оценка"
    ];

    const rows = data.students.map((student) => [
      student.fullName,
      student.groupName,
      student.programName,
      formatGrade(student.finalGrade)
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsvCell).join(";"))
      .join("\n");

    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `resit-${data.disciplineName}-${data.groupName}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

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
            <button className="nav-item active" type="button" onClick={onOpenResits}>
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

      <main className="office-resit-students-content">
        <button
          className="office-resit-students-back-link"
          type="button"
          onClick={onBack}
        >
          ← Назад к группам
        </button>

        <section className="office-resit-students-hero">
          <h1>Списки на пересдачу</h1>

          {data && (
            <div className="office-resit-students-heading">
              <div className="office-resit-students-title-row">
                <h2>{data.disciplineName}</h2>

                <div className="office-resit-students-badges">
                  <span>{data.courseNo} курс</span>
                  <span>{data.groupName}</span>
                </div>
              </div>

              <p>{data.teacherShortName}</p>
            </div>
          )}
        </section>

        {isLoading && (
          <div className="schedule-state">Загружаем список студентов...</div>
        )}

        {error && <div className="schedule-error">{error}</div>}

        {!isLoading && !error && data && (
          <>
            <button
              className="office-resit-export-button"
              type="button"
              onClick={handleExport}
              disabled={data.students.length === 0}
            >
              Экспорт
            </button>

            <section className="office-resit-table-card">
              <div className="office-resit-table-header">
                <div>
                  <h2>Студенты на пересдачу</h2>
                  <p>Список студентов с итоговой оценкой ниже проходного значения</p>
                </div>
              </div>

              <div className="office-resit-table-scroll">
                <table className="office-resit-table">
                  <thead>
                    <tr>
                      <th>ФИО</th>
                      <th>Группа</th>
                      <th>ОП</th>
                      <th>Итоговая оценка</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.students.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="office-resit-empty-cell">
                          В выбранной группе нет студентов с итоговой оценкой ниже 4
                        </td>
                      </tr>
                    ) : (
                      data.students.map((student) => (
                        <tr key={student.idStudent}>
                          <td>{student.fullName}</td>
                          <td>{student.groupName}</td>
                          <td>{student.programName}</td>
                          <td>
                            <span className="office-resit-bad-grade">
                              {formatGrade(student.finalGrade)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}