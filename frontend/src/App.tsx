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
import { StudentAnalyticsPage } from "./pages/StudentAnalyticsPage";
import { OfficeResitsPage } from "./pages/OfficeResitsPage";
import { OfficeResitGroupsPage } from "./pages/OfficeResitGroupsPage";
import { OfficeResitStudentsPage } from "./pages/OfficeResitStudentsPage";
import { OfficeAttendanceDisciplinesPage } from "./pages/OfficeAttendanceDisciplinesPage";
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

type OfficePage =
  | "resits"
  | "resitGroups"
  | "resitStudents"
  | "attendanceDisciplines"
  | "attendanceDetails"
  | "finalSheets"
  | "students"
  | "analytics";

function App() {
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(null);

  const [teacherPage, setTeacherPage] = useState<TeacherPage>("schedule");
  const [studentPage, setStudentPage] = useState<StudentPage>("schedule");
  const [officePage, setOfficePage] = useState<OfficePage>("resits");

  const [selectedDisciplineId, setSelectedDisciplineId] = useState<number | null>(
    null
  );
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const [selectedOfficeDisciplineId, setSelectedOfficeDisciplineId] =
    useState<number | null>(null);
  const [selectedOfficeGroupId, setSelectedOfficeGroupId] =
    useState<number | null>(null);
  const [selectedOfficeAttendanceDisciplineId, setSelectedOfficeAttendanceDisciplineId] =
    useState<number | null>(null);

  function handleLogout() {
    setCurrentUser(null);
    setTeacherPage("schedule");
    setStudentPage("schedule");
    setOfficePage("resits");
    setSelectedDisciplineId(null);
    setSelectedGroupId(null);
    setSelectedOfficeDisciplineId(null);
    setSelectedOfficeGroupId(null);
    setSelectedOfficeAttendanceDisciplineId(null);
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

  function openStudentAnalytics(disciplineId?: number) {
    if (disciplineId) {
      setSelectedDisciplineId(disciplineId);
    }

    setStudentPage("analytics");
  }

  function openOfficeResitGroups(disciplineId: number) {
    setSelectedOfficeDisciplineId(disciplineId);
    setSelectedOfficeGroupId(null);
    setOfficePage("resitGroups");
  }

  function openOfficeResitStudents(groupId: number) {
    setSelectedOfficeGroupId(groupId);
    setOfficePage("resitStudents");
  }

  function openOfficeAttendanceDetails(disciplineId: number) {
    setSelectedOfficeAttendanceDisciplineId(disciplineId);
    setOfficePage("attendanceDetails");
  }

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  const normalizedRole = currentUser.role?.trim().toLowerCase();

  if (normalizedRole === "office_staff") {
    if (officePage === "resitGroups" && selectedOfficeDisciplineId) {
      return (
        <OfficeResitGroupsPage
          user={currentUser}
          disciplineId={selectedOfficeDisciplineId}
          onLogout={handleLogout}
          onBack={() => setOfficePage("resits")}
          onSelectGroup={openOfficeResitStudents}
          onOpenAttendance={() => setOfficePage("attendanceDisciplines")}
          onOpenFinalSheets={() => setOfficePage("finalSheets")}
          onOpenStudents={() => setOfficePage("students")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }

    if (
      officePage === "resitStudents" &&
      selectedOfficeDisciplineId &&
      selectedOfficeGroupId
    ) {
      return (
        <OfficeResitStudentsPage
          user={currentUser}
          disciplineId={selectedOfficeDisciplineId}
          groupId={selectedOfficeGroupId}
          onLogout={handleLogout}
          onBack={() => setOfficePage("resitGroups")}
          onOpenResits={() => setOfficePage("resits")}
          onOpenAttendance={() => setOfficePage("attendanceDisciplines")}
          onOpenFinalSheets={() => setOfficePage("finalSheets")}
          onOpenStudents={() => setOfficePage("students")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }

    if (officePage === "attendanceDisciplines") {
      return (
        <OfficeAttendanceDisciplinesPage
          user={currentUser}
          onLogout={handleLogout}
          onSelectDiscipline={openOfficeAttendanceDetails}
          onOpenResits={() => setOfficePage("resits")}
          onOpenFinalSheets={() => setOfficePage("finalSheets")}
          onOpenStudents={() => setOfficePage("students")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }

    if (officePage === "attendanceDetails") {
      return (
        <div className="schedule-layout">
          <main className="schedule-content">
            <button
              className="details-back-button"
              type="button"
              onClick={() => setOfficePage("attendanceDisciplines")}
            >
              ← Назад к дисциплинам
            </button>

            <h1>Посещаемость по дисциплине</h1>

            <div className="schedule-state">
              Экран просмотра посещаемости по дисциплине №
              {selectedOfficeAttendanceDisciplineId} подключим следующим шагом.
            </div>
          </main>
        </div>
      );
    }

    if (officePage === "finalSheets") {
      return (
        <div className="schedule-layout">
          <main className="schedule-content">
            <button
              className="details-back-button"
              type="button"
              onClick={() => setOfficePage("resits")}
            >
              ← Назад
            </button>

            <h1>Итоговые ведомости</h1>

            <div className="schedule-state">
              Экран итоговых ведомостей учебного офиса подключим позже.
            </div>
          </main>
        </div>
      );
    }

    if (officePage === "students") {
      return (
        <div className="schedule-layout">
          <main className="schedule-content">
            <button
              className="details-back-button"
              type="button"
              onClick={() => setOfficePage("resits")}
            >
              ← Назад
            </button>

            <h1>Студенты</h1>

            <div className="schedule-state">
              Экран списка студентов учебного офиса подключим позже.
            </div>
          </main>
        </div>
      );
    }

    if (officePage === "analytics") {
      return (
        <div className="schedule-layout">
          <main className="schedule-content">
            <button
              className="details-back-button"
              type="button"
              onClick={() => setOfficePage("resits")}
            >
              ← Назад
            </button>

            <h1>Модуль аналитики</h1>

            <div className="schedule-state">
              BI-модуль учебного офиса подключим позже.
            </div>
          </main>
        </div>
      );
    }

    return (
      <OfficeResitsPage
        user={currentUser}
        onLogout={handleLogout}
        onSelectDiscipline={openOfficeResitGroups}
        onOpenAttendance={() => setOfficePage("attendanceDisciplines")}
        onOpenFinalSheets={() => setOfficePage("finalSheets")}
        onOpenStudents={() => setOfficePage("students")}
        onOpenAnalytics={() => setOfficePage("analytics")}
      />
    );
  }

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
          onOpenAnalytics={() => openStudentAnalytics()}
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
          onOpenAnalytics={() => openStudentAnalytics(selectedDisciplineId)}
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
          onOpenAnalytics={() => openStudentAnalytics(selectedDisciplineId ?? undefined)}
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
          onOpenAnalytics={() => openStudentAnalytics(selectedDisciplineId ?? undefined)}
        />
      );
    }

    if (studentPage === "analytics") {
      return (
        <StudentAnalyticsPage
          user={currentUser}
          initialDisciplineId={selectedDisciplineId}
          onLogout={handleLogout}
          onOpenSchedule={() => setStudentPage("schedule")}
          onOpenDisciplines={() => setStudentPage("disciplines")}
          onOpenAttendance={openStudentAttendance}
          onOpenGradebook={openStudentGradebook}
        />
      );
    }

    return (
      <StudentSchedulePage
        user={currentUser}
        onLogout={handleLogout}
        onOpenDisciplines={() => setStudentPage("disciplines")}
        onOpenAttendance={() => openStudentAttendance()}
        onOpenGradebook={() => openStudentGradebook()}
        onOpenAnalytics={() => openStudentAnalytics()}
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