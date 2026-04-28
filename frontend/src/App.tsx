import { useState } from "react";
import { LoginPage } from "./pages/LoginPage";
import { TeacherSchedulePage } from "./pages/TeacherSchedulePage";
import { TeacherDisciplinesPage } from "./pages/TeacherDisciplinesPage";
import { TeacherDisciplineDetailsPage } from "./pages/TeacherDisciplineDetailsPage";
import { TeacherAttendancePage } from "./pages/TeacherAttendancePage";
import { TeacherGradebookPage } from "./pages/TeacherGradebookPage";
import { TeacherAnalyticsPage } from "./pages/TeacherAnalyticsPage";
import { StudentSchedulePage } from "./pages/StudentSchedulePage";
import { StudentDisciplinesPage } from "./pages/StudentDisciplinesPage";
import { StudentDisciplineDetailsPage } from "./pages/StudentDisciplineDetailsPage";
import { StudentAttendancePage } from "./pages/StudentAttendancePage";
import { StudentGradebookPage } from "./pages/StudentGradebookPage";
import type { LoginResponse } from "./api";

type TeacherPage =
  | "schedule"
  | "disciplines"
  | "disciplineDetails"
  | "attendance"
  | "gradebook"
  | "analytics";

type StudentPage =
  | "schedule"
  | "disciplines"
  | "disciplineDetails"
  | "attendance"
  | "gradebook"
  | "analytics";

function App() {
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(null);

  const [teacherPage, setTeacherPage] = useState<TeacherPage>("schedule");
  const [studentPage, setStudentPage] = useState<StudentPage>("schedule");

  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(
    null
  );
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  function handleLogout() {
    setCurrentUser(null);
    setTeacherPage("schedule");
    setStudentPage("schedule");
    setSelectedDisciplineId(null);
    setSelectedGroupId(null);
  }

  function openTeacherDisciplineDetails(disciplineId: number) {
    setSelectedDisciplineId(disciplineId);
    setSelectedGroupId(null);
    setTeacherPage("disciplineDetails");
  }

  function openTeacherAttendance(disciplineId?: number, groupId?: number) {
    if (disciplineId) {
      setSelectedDisciplineId(disciplineId);
    }

    if (groupId) {
      setSelectedGroupId(groupId);
    }

    setTeacherPage("attendance");
  }

  function openTeacherGradebook(disciplineId?: number, groupId?: number) {
    if (disciplineId) {
      setSelectedDisciplineId(disciplineId);
    }

    if (groupId) {
      setSelectedGroupId(groupId);
    }

    setTeacherPage("gradebook");
  }

  function openTeacherAnalytics(disciplineId?: number, groupId?: number) {
    if (disciplineId) {
      setSelectedDisciplineId(disciplineId);
    }

    if (groupId) {
      setSelectedGroupId(groupId);
    }

    setTeacherPage("analytics");
  }

  function openStudentDisciplineDetails(disciplineId: number) {
    setSelectedDisciplineId(disciplineId);
    setSelectedGroupId(null);
    setStudentPage("disciplineDetails");
  }

  function openStudentAttendance(disciplineId?: number, groupId?: number) {
    if (disciplineId) {
      setSelectedDisciplineId(disciplineId);
    }

    if (groupId) {
      setSelectedGroupId(groupId);
    }

    setStudentPage("attendance");
  }

  function openStudentGradebook(disciplineId?: number, groupId?: number) {
    if (disciplineId) {
      setSelectedDisciplineId(disciplineId);
    }

    if (groupId) {
      setSelectedGroupId(groupId);
    }

    setStudentPage("gradebook");
  }

  function openStudentAnalytics() {
    setStudentPage("analytics");
  }

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  const normalizedRole = currentUser.role?.trim().toLowerCase();

  if (normalizedRole === "student") {
    if (studentPage === "disciplines") {
      return (
        <StudentDisciplinesPage
          user={currentUser}
          onLogout={handleLogout}
          onOpenSchedule={() => setStudentPage("schedule")}
          onSelectDiscipline={openStudentDisciplineDetails}
          onOpenAttendance={() => openStudentAttendance()}
          onOpenGradebook={() => openStudentGradebook()}
          onOpenAnalytics={openStudentAnalytics}
        />
      );
    }

    if (studentPage === "disciplineDetails" && selectedDisciplineId) {
      return (
        <StudentDisciplineDetailsPage
          user={currentUser}
          disciplineId={selectedDisciplineId}
          onLogout={handleLogout}
          onOpenSchedule={() => setStudentPage("schedule")}
          onOpenDisciplines={() => setStudentPage("disciplines")}
          onOpenAttendance={openStudentAttendance}
          onOpenGradebook={openStudentGradebook}
          onOpenAnalytics={openStudentAnalytics}
        />
      );
    }

    if (studentPage === "attendance") {
      return (
        <StudentAttendancePage
          user={currentUser}
          initialDisciplineId={selectedDisciplineId}
          onLogout={handleLogout}
          onOpenSchedule={() => setStudentPage("schedule")}
          onOpenDisciplines={() => setStudentPage("disciplines")}
          onOpenGradebook={openStudentGradebook}
          onOpenAnalytics={openStudentAnalytics}
        />
      );
    }

    if (studentPage === "gradebook") {
      return (
        <StudentGradebookPage
          user={currentUser}
          initialDisciplineId={selectedDisciplineId}
          onLogout={handleLogout}
          onOpenSchedule={() => setStudentPage("schedule")}
          onOpenDisciplines={() => setStudentPage("disciplines")}
          onOpenAttendance={openStudentAttendance}
          onOpenAnalytics={openStudentAnalytics}
        />
      );
    }

    if (studentPage === "analytics") {
      return (
        <div className="schedule-layout">
          <main className="schedule-content">
            <button
              className="details-back-button"
              type="button"
              onClick={() => setStudentPage("schedule")}
            >
              ← Назад
            </button>
            <h1>Модуль аналитики</h1>
            <div className="schedule-state">
              Студенческий BI-модуль подключим после экранов посещаемости и
              ведомости.
            </div>
          </main>
        </div>
      );
    }

    return (
      <StudentSchedulePage
        user={currentUser}
        onLogout={handleLogout}
        onOpenDisciplines={() => setStudentPage("disciplines")}
        onOpenAttendance={() => openStudentAttendance()}
        onOpenGradebook={() => openStudentGradebook()}
        onOpenAnalytics={openStudentAnalytics}
      />
    );
  }

  if (normalizedRole === "teacher") {
    if (teacherPage === "disciplines") {
      return (
        <TeacherDisciplinesPage
          user={currentUser}
          onLogout={handleLogout}
          onOpenSchedule={() => setTeacherPage("schedule")}
          onSelectDiscipline={openTeacherDisciplineDetails}
          onOpenAttendance={() => openTeacherAttendance()}
          onOpenGradebook={() => openTeacherGradebook()}
          onOpenAnalytics={() => openTeacherAnalytics()}
        />
      );
    }

    if (teacherPage === "disciplineDetails" && selectedDisciplineId) {
      return (
        <TeacherDisciplineDetailsPage
          user={currentUser}
          disciplineId={selectedDisciplineId}
          initialGroupId={selectedGroupId}
          onLogout={handleLogout}
          onOpenSchedule={() => setTeacherPage("schedule")}
          onOpenDisciplines={() => setTeacherPage("disciplines")}
          onOpenAttendance={openTeacherAttendance}
          onOpenGradebook={openTeacherGradebook}
          onOpenAnalytics={() =>
            openTeacherAnalytics(
              selectedDisciplineId ?? undefined,
              selectedGroupId ?? undefined
            )
          }
        />
      );
    }

    if (teacherPage === "attendance") {
      return (
        <TeacherAttendancePage
          user={currentUser}
          initialDisciplineId={selectedDisciplineId}
          initialGroupId={selectedGroupId}
          onLogout={handleLogout}
          onOpenSchedule={() => setTeacherPage("schedule")}
          onOpenDisciplines={() => setTeacherPage("disciplines")}
          onOpenGradebook={openTeacherGradebook}
          onOpenAnalytics={() =>
            openTeacherAnalytics(
              selectedDisciplineId ?? undefined,
              selectedGroupId ?? undefined
            )
          }
        />
      );
    }

    if (teacherPage === "gradebook") {
      return (
        <TeacherGradebookPage
          user={currentUser}
          initialDisciplineId={selectedDisciplineId}
          initialGroupId={selectedGroupId}
          onLogout={handleLogout}
          onOpenSchedule={() => setTeacherPage("schedule")}
          onOpenDisciplines={() => setTeacherPage("disciplines")}
          onOpenAttendance={openTeacherAttendance}
          onOpenAnalytics={() =>
            openTeacherAnalytics(
              selectedDisciplineId ?? undefined,
              selectedGroupId ?? undefined
            )
          }
        />
      );
    }

    if (teacherPage === "analytics") {
      return (
        <TeacherAnalyticsPage
          user={currentUser}
          initialDisciplineId={selectedDisciplineId}
          initialGroupId={selectedGroupId}
          onLogout={handleLogout}
          onOpenSchedule={() => setTeacherPage("schedule")}
          onOpenDisciplines={() => setTeacherPage("disciplines")}
          onOpenAttendance={openTeacherAttendance}
          onOpenGradebook={openTeacherGradebook}
        />
      );
    }

    return (
      <TeacherSchedulePage
        user={currentUser}
        onLogout={handleLogout}
        onOpenDisciplines={() => setTeacherPage("disciplines")}
        onOpenAttendance={() => openTeacherAttendance()}
        onOpenGradebook={() => openTeacherGradebook()}
        onOpenAnalytics={() => openTeacherAnalytics()}
      />
    );
  }

  return (
    <div className="schedule-layout">
      <main className="schedule-content">
        <h1>Вход выполнен</h1>
        <div className="schedule-state">
          Для этой роли экран пока находится в разработке.
        </div>
        <button className="logout-button" type="button" onClick={handleLogout}>
          Выйти
        </button>
      </main>
    </div>
  );
}

export default App;