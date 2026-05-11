import { useEffect, useState } from "react";
import type { LoginResponse, OfficeStudentDetails } from "../api";
import { getOfficeStudentDetails } from "../api";
import "./TeacherSchedulePage.css";
import "./OfficeStudentPersonalDataPage.css";

type OfficeStudentPersonalDataPageProps = {
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

function formatValue(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "Не указано";
  }

  return String(value);
}

export function OfficeStudentPersonalDataPage({
  user,
  studentId,
  onLogout,
  onBack,
  onOpenResits,
  onOpenAttendance,
  onOpenFinalSheets,
  onOpenStudents,
  onOpenAnalytics
}: OfficeStudentPersonalDataPageProps) {
  const [student, setStudent] = useState<OfficeStudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    async function loadStudent() {
      try {
        setIsLoading(true);
        setError("");
        setActionMessage("");

        const data = await getOfficeStudentDetails(user.idUser, studentId);
        setStudent(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки личных данных студента"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadStudent();
  }, [user.idUser, studentId]);

  function showTemporaryAction(actionName: string) {
    setActionMessage(
      `Действие «${actionName}» пока добавлено как интерфейсная кнопка. Изменение статуса и группы подключим после согласования правил записи в БД.`
    );
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

      <main className="office-student-personal-content">
        <button
          className="office-student-personal-back-button"
          type="button"
          onClick={onBack}
        >
          ← Назад к студенту
        </button>

        <h1>Студенты / личные данные</h1>

        {isLoading && (
          <div className="schedule-state">Загружаем личные данные студента...</div>
        )}

        {error && <div className="schedule-error">{error}</div>}

        {!isLoading && !error && student && (
          <>
            <section className="office-student-personal-profile-card">
              <div className="office-student-personal-avatar">
                {getStudentInitials(student.fullName)}
              </div>

              <div className="office-student-personal-profile-info">
                <h2>{student.fullName}</h2>

                <div className="office-student-personal-badges">
                  <span>{student.groupName}</span>
                  <span>{student.courseNo} курс</span>
                </div>

                <p>{student.email || "email не указан"}</p>
              </div>
            </section>

            <section className="office-student-personal-grid">
              <article className="office-student-personal-card">
                <h3>Учебные данные</h3>

                <dl>
                  <div>
                    <dt>Образовательная программа</dt>
                    <dd>{formatValue(student.programName)}</dd>
                  </div>

                  <div>
                    <dt>Группа</dt>
                    <dd>{formatValue(student.groupName)}</dd>
                  </div>

                  <div>
                    <dt>Курс</dt>
                    <dd>{student.courseNo} курс</dd>
                  </div>

                  <div>
                    <dt>Номер зачётной книжки</dt>
                    <dd>{formatValue(student.recordBookNo)}</dd>
                  </div>

                  <div>
                    <dt>Статус</dt>
                    <dd>{formatValue(student.studentStatus)}</dd>
                  </div>
                </dl>
              </article>

              <article className="office-student-personal-card">
                <h3>Контактные данные</h3>

                <dl>
                  <div>
                    <dt>Email / логин</dt>
                    <dd>{formatValue(student.email)}</dd>
                  </div>

                  <div>
                    <dt>Фамилия</dt>
                    <dd>{formatValue(student.surname)}</dd>
                  </div>

                  <div>
                    <dt>Имя</dt>
                    <dd>{formatValue(student.name)}</dd>
                  </div>

                  <div>
                    <dt>Отчество</dt>
                    <dd>{formatValue(student.fathername)}</dd>
                  </div>
                </dl>
              </article>

              <article className="office-student-personal-card actions">
                <div className="office-student-personal-actions-header">
                  <div>
                    <h3>Административные действия</h3>
                    <p>
                      Действия учебного офиса по изменению статуса и учебной группы
                      студента.
                    </p>
                  </div>
                </div>

                <div className="office-student-personal-actions">
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => showTemporaryAction("Перевести в другую группу")}
                  >
                    Перевести в другую группу
                  </button>

                  <button
                    className="danger"
                    type="button"
                    onClick={() => showTemporaryAction("Отчислить студента")}
                  >
                    Отчислить студента
                  </button>

                  <button
                    className="success"
                    type="button"
                    onClick={() => showTemporaryAction("Восстановить студента")}
                  >
                    Восстановить студента
                  </button>
                </div>

                {actionMessage && (
                  <div className="office-student-personal-message">
                    {actionMessage}
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </main>
    </div>
  );
}