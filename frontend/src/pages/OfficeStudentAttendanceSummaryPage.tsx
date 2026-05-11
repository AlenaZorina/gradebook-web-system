import { useEffect, useMemo, useState } from "react";
import type {
  LoginResponse,
  OfficeStudentAttendanceDiscipline,
  OfficeStudentDetails
} from "../api";
import {
  getOfficeStudentAttendanceSummary,
  getOfficeStudentDetails
} from "../api";
import "./TeacherSchedulePage.css";
import "./OfficeStudentAttendanceSummaryPage.css";

type OfficeStudentAttendanceSummaryPageProps = {
  user: LoginResponse;
  studentId: number;
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

function getStudentInitials(fullName?: string | null) {
  const parts = (fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const surnameInitial = parts[0]?.[0] ?? "";
  const nameInitial = parts[1]?.[0] ?? "";

  return `${surnameInitial}${nameInitial}`.toUpperCase() || "СТ";
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

  return `${Number(value).toFixed(1).replace(".", ",").replace(",0", "")}%`;
}

function formatModuleNos(moduleNos: number[]) {
  if (!moduleNos || moduleNos.length === 0) {
    return "—";
  }

  if (moduleNos.length === 1) {
    return `${moduleNos[0]} модуль`;
  }

  return `${moduleNos.join(", ")} модули`;
}

function makeSafeFileName(value: string) {
  return value
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeCsvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function OfficeStudentAttendanceSummaryPage({
  user,
  studentId,
  onLogout,
  onBack,
  onOpenResits,
  onOpenAttendance,
  onOpenFinalSheets,
  onOpenStudents,
  onOpenAnalytics
}: OfficeStudentAttendanceSummaryPageProps) {
  const [student, setStudent] = useState<OfficeStudentDetails | null>(null);
  const [attendance, setAttendance] = useState<OfficeStudentAttendanceDiscipline[]>([]);
  const [selectedModuleNo, setSelectedModuleNo] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError("");

        const [studentData, attendanceData] = await Promise.all([
          getOfficeStudentDetails(user.idUser, studentId),
          getOfficeStudentAttendanceSummary(user.idUser, studentId)
        ]);

        setStudent(studentData);
        setAttendance(attendanceData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки посещаемости студента"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user.idUser, studentId]);

  const moduleOptions = useMemo(() => {
    return Array.from(
      new Set(attendance.flatMap((item) => item.moduleNos ?? []))
    ).sort((a, b) => a - b);
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    if (selectedModuleNo === "all") {
      return attendance;
    }

    return attendance.filter((item) =>
      (item.moduleNos ?? []).includes(Number(selectedModuleNo))
    );
  }, [attendance, selectedModuleNo]);

  function handleExport() {
    if (!student) {
      return;
    }
  
    const header = [
      "Студент",
      "Группа",
      "Дисциплина",
      "Модуль",
      "Занятий",
      "Присутствий",
      "Пропусков",
      "% посещаемости"
    ];
  
    const rows = filteredAttendance.map((item) => [
      student.fullName,
      student.groupName,
      item.disciplineName,
      formatModuleNos(item.moduleNos ?? []),
      item.sessionsCount,
      item.presentAttendanceCount,
      item.absenceCount,
      formatPercent(item.attendancePercent)
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
    link.download = `student-attendance-${makeSafeFileName(student.fullName)}.csv`;
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

            <button className="nav-item active" type="button" onClick={onOpenStudents}>
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

      <main className="office-student-attendance-content">
        <button
          className="office-student-attendance-back-button"
          type="button"
          onClick={onBack}
        >
          ← Назад к студенту
        </button>

        <section className="office-student-attendance-hero">
          <div className="office-student-attendance-heading">
            <h1>Студенты / посещаемость</h1>

            <label className="office-student-attendance-filter">
              <span>Модуль</span>

              <select
                value={selectedModuleNo}
                onChange={(event) => setSelectedModuleNo(event.target.value)}
              >
                <option value="all">Все модули</option>

                {moduleOptions.map((moduleNo) => (
                  <option key={moduleNo} value={moduleNo}>
                    {moduleNo} модуль
                  </option>
                ))}
              </select>
            </label>
          </div>

          {student && (
            <section className="office-student-mini-card">
              <div className="office-student-mini-avatar">
                {getStudentInitials(student.fullName)}
              </div>

              <div>
                <h2>{student.fullName}</h2>
                <p>{student.groupName}</p>
                <span>{student.email || "email не указан"}</span>
              </div>
            </section>
          )}
        </section>

        {isLoading && (
          <div className="schedule-state">Загружаем посещаемость студента...</div>
        )}

        {error && <div className="schedule-error">{error}</div>}

        {!isLoading && !error && (
          <section className="office-student-attendance-table-card">
            <div className="office-student-attendance-table-toolbar">
              <div>
                <h2>Посещаемость по дисциплинам</h2>
                <p>Сводная посещаемость студента по выбранному модулю</p>
              </div>

              <button
                className="office-student-attendance-export"
                type="button"
                onClick={handleExport}
                disabled={!student}
              >
                Экспорт
              </button>
            </div>

            <div className="office-student-attendance-table-scroll">
              <table className="office-student-attendance-table">
                <thead>
                  <tr>
                    <th>Дисциплина</th>
                    <th>Модуль</th>
                    <th>Занятий</th>
                    <th>Присутствий</th>
                    <th>Пропусков</th>
                    <th>% посещаемости</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="office-student-attendance-empty">
                        Данные по посещаемости не найдены
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((item) => (
                      <tr key={`${item.idDiscipline}-${item.idAssignment}`}>
                        <td>{item.disciplineName}</td>
                        <td>{formatModuleNos(item.moduleNos ?? [])}</td>
                        <td>{item.sessionsCount}</td>
                        <td>{item.presentAttendanceCount}</td>
                        <td>{item.absenceCount}</td>
                        <td>
                          <span className="office-student-attendance-percent">
                            {formatPercent(item.attendancePercent)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}