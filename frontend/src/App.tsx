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
import { OfficeAttendanceGroupsPage } from "./pages/OfficeAttendanceGroupsPage";
import { OfficeAttendanceSheetPage } from "./pages/OfficeAttendanceSheetPage";
import { OfficeFinalSheetsDisciplinesPage } from "./pages/OfficeFinalSheetsDisciplinesPage";
import { OfficeFinalSheetGroupsPage } from "./pages/OfficeFinalSheetGroupsPage";
import { OfficeFinalSheetPage } from "./pages/OfficeFinalSheetPage"
import { OfficeStudentsPage } from "./pages/OfficeStudentsPage";;
import { OfficeStudentDetailsPage } from "./pages/OfficeStudentDetailsPage";
import { OfficeStudentAttendanceSummaryPage } from "./pages/OfficeStudentAttendanceSummaryPage";
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
  | "attendanceGroups"
  | "attendanceSheet"
  | "finalSheetsDisciplines"
  | "finalSheetGroups"
  | "finalSheet"
  | "students"
  | "studentDetails"
  | "studentAttendance"
  | "studentGradebook"
  | "studentPersonalData"
  | "analytics";

function App() {
  const [currentUser, setCurrentUser] = useState<LoginResponse | null>(null);

  const [teacherPage, setTeacherPage] = useState<TeacherPage>("schedule");
  const [studentPage, setStudentPage] = useState<StudentPage>("schedule");
  const [officePage, setOfficePage] = useState<OfficePage>("resits");
  const [selectedOfficeStudentId, setSelectedOfficeStudentId] =
  useState<number | null>(null);

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
  const [selectedOfficeAttendanceGroupId, setSelectedOfficeAttendanceGroupId] =
    useState<number | null>(null);

  const [selectedOfficeFinalSheetDisciplineId, setSelectedOfficeFinalSheetDisciplineId] =
    useState<number | null>(null);
  const [selectedOfficeFinalSheetGroupId, setSelectedOfficeFinalSheetGroupId] =
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
    setSelectedOfficeAttendanceGroupId(null);
    setSelectedOfficeFinalSheetDisciplineId(null);
    setSelectedOfficeFinalSheetGroupId(null);
    setSelectedOfficeStudentId(null);
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

  function openOfficeAttendanceGroups(disciplineId: number) {
    setSelectedOfficeAttendanceDisciplineId(disciplineId);
    setSelectedOfficeAttendanceGroupId(null);
    setOfficePage("attendanceGroups");
  }

  function openOfficeAttendanceSheet(groupId: number) {
    setSelectedOfficeAttendanceGroupId(groupId);
    setOfficePage("attendanceSheet");
  }

  function openOfficeFinalSheetGroups(disciplineId: number) {
    setSelectedOfficeFinalSheetDisciplineId(disciplineId);
    setSelectedOfficeFinalSheetGroupId(null);
    setOfficePage("finalSheetGroups");
  }

  function openOfficeFinalSheet(groupId: number) {
    setSelectedOfficeFinalSheetGroupId(groupId);
    setOfficePage("finalSheet");
  }
  function openOfficeStudentDetails(studentId: number) {
    setSelectedOfficeStudentId(studentId);
    setOfficePage("studentDetails");
  }
  
  function openOfficeStudentAttendance() {
    setOfficePage("studentAttendance");
  }
  
  function openOfficeStudentGradebook() {
    setOfficePage("studentGradebook");
  }
  
  function openOfficeStudentPersonalData() {
    setOfficePage("studentPersonalData");
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
          onOpenFinalSheets={() => setOfficePage("finalSheetsDisciplines")}
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
          onOpenFinalSheets={() => setOfficePage("finalSheetsDisciplines")}
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
          onSelectDiscipline={openOfficeAttendanceGroups}
          onOpenResits={() => setOfficePage("resits")}
          onOpenFinalSheets={() => setOfficePage("finalSheetsDisciplines")}
          onOpenStudents={() => setOfficePage("students")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }

    if (officePage === "attendanceGroups" && selectedOfficeAttendanceDisciplineId) {
      return (
        <OfficeAttendanceGroupsPage
          user={currentUser}
          disciplineId={selectedOfficeAttendanceDisciplineId}
          onLogout={handleLogout}
          onBack={() => setOfficePage("attendanceDisciplines")}
          onSelectGroup={openOfficeAttendanceSheet}
          onOpenResits={() => setOfficePage("resits")}
          onOpenFinalSheets={() => setOfficePage("finalSheetsDisciplines")}
          onOpenStudents={() => setOfficePage("students")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }

    if (
      officePage === "attendanceSheet" &&
      selectedOfficeAttendanceDisciplineId &&
      selectedOfficeAttendanceGroupId
    ) {
      return (
        <OfficeAttendanceSheetPage
          user={currentUser}
          disciplineId={selectedOfficeAttendanceDisciplineId}
          groupId={selectedOfficeAttendanceGroupId}
          onLogout={handleLogout}
          onBack={() => setOfficePage("attendanceGroups")}
          onOpenResits={() => setOfficePage("resits")}
          onOpenAttendance={() => setOfficePage("attendanceDisciplines")}
          onOpenFinalSheets={() => setOfficePage("finalSheetsDisciplines")}
          onOpenStudents={() => setOfficePage("students")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }

    if (officePage === "finalSheetsDisciplines") {
      return (
        <OfficeFinalSheetsDisciplinesPage
          user={currentUser}
          onLogout={handleLogout}
          onSelectDiscipline={openOfficeFinalSheetGroups}
          onOpenResits={() => setOfficePage("resits")}
          onOpenAttendance={() => setOfficePage("attendanceDisciplines")}
          onOpenStudents={() => setOfficePage("students")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }

    if (
      officePage === "finalSheetGroups" &&
      selectedOfficeFinalSheetDisciplineId
    ) {
      return (
        <OfficeFinalSheetGroupsPage
          user={currentUser}
          disciplineId={selectedOfficeFinalSheetDisciplineId}
          onLogout={handleLogout}
          onBack={() => setOfficePage("finalSheetsDisciplines")}
          onSelectGroup={openOfficeFinalSheet}
          onOpenResits={() => setOfficePage("resits")}
          onOpenAttendance={() => setOfficePage("attendanceDisciplines")}
          onOpenStudents={() => setOfficePage("students")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }

    if (
      officePage === "finalSheet" &&
      selectedOfficeFinalSheetDisciplineId &&
      selectedOfficeFinalSheetGroupId
    ) {
      return (
        <OfficeFinalSheetPage
          user={currentUser}
          disciplineId={selectedOfficeFinalSheetDisciplineId}
          groupId={selectedOfficeFinalSheetGroupId}
          onLogout={handleLogout}
          onBack={() => setOfficePage("finalSheetGroups")}
          onOpenResits={() => setOfficePage("resits")}
          onOpenAttendance={() => setOfficePage("attendanceDisciplines")}
          onOpenFinalSheets={() => setOfficePage("finalSheetsDisciplines")}
          onOpenStudents={() => setOfficePage("students")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }

    if (officePage === "students") {
      return (
        <OfficeStudentsPage
          user={currentUser}
          onLogout={handleLogout}
          onSelectStudent={openOfficeStudentDetails}
          onOpenResits={() => setOfficePage("resits")}
          onOpenAttendance={() => setOfficePage("attendanceDisciplines")}
          onOpenFinalSheets={() => setOfficePage("finalSheetsDisciplines")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }
    if (officePage === "studentDetails" && selectedOfficeStudentId) {
      return (
        <OfficeStudentDetailsPage
          user={currentUser}
          studentId={selectedOfficeStudentId}
          onLogout={handleLogout}
          onBack={() => setOfficePage("students")}
          onOpenStudentAttendance={openOfficeStudentAttendance}
          onOpenStudentGradebook={openOfficeStudentGradebook}
          onOpenStudentPersonalData={openOfficeStudentPersonalData}
          onOpenResits={() => setOfficePage("resits")}
          onOpenAttendance={() => setOfficePage("attendanceDisciplines")}
          onOpenFinalSheets={() => setOfficePage("finalSheetsDisciplines")}
          onOpenStudents={() => setOfficePage("students")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }
    if (officePage === "studentAttendance" && selectedOfficeStudentId) {
      return (
        <OfficeStudentAttendanceSummaryPage
          user={currentUser}
          studentId={selectedOfficeStudentId}
          onLogout={handleLogout}
          onBack={() => setOfficePage("studentDetails")}
          onOpenResits={() => setOfficePage("resits")}
          onOpenAttendance={() => setOfficePage("attendanceDisciplines")}
          onOpenFinalSheets={() => setOfficePage("finalSheetsDisciplines")}
          onOpenStudents={() => setOfficePage("students")}
          onOpenAnalytics={() => setOfficePage("analytics")}
        />
      );
    }
    if (officePage === "studentDetails") {
      return (
        <div className="schedule-layout">
          <main className="schedule-content">
            <button
              className="details-back-button"
              type="button"
              onClick={() => setOfficePage("students")}
            >
              ← Назад к студентам
            </button>
    
            <h1>Карточка студента</h1>
    
            <div className="schedule-state">
              Экран карточки студента №{selectedOfficeStudentId} подключим следующим шагом.
            </div>
          </main>
        </div>
      );
    }
    if (officePage === "studentGradebook" && selectedOfficeStudentId) {
      return (
        <div className="schedule-layout">
          <main className="schedule-content">
            <button
              className="details-back-button"
              type="button"
              onClick={() => setOfficePage("studentDetails")}
            >
              ← Назад к студенту
            </button>
    
            <h1>Студенты / ведомость</h1>
    
            <div className="schedule-state">
              Экран ведомости выбранного студента подключим следующим шагом.
            </div>
          </main>
        </div>
      );
    }
    
    if (officePage === "studentPersonalData" && selectedOfficeStudentId) {
      return (
        <div className="schedule-layout">
          <main className="schedule-content">
            <button
              className="details-back-button"
              type="button"
              onClick={() => setOfficePage("studentDetails")}
            >
              ← Назад к студенту
            </button>
    
            <h1>Студенты / личные данные</h1>
    
            <div className="schedule-state">
              Экран личных данных выбранного студента подключим следующим шагом.
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
        onOpenFinalSheets={() => setOfficePage("finalSheetsDisciplines")}
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