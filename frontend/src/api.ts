export type LoginRequest = {
    login: string;
    password: string;
  };
  
  export type UserRole = "student" | "teacher" | "office_staff";
  
  export type LoginResponse = {
    idUser: number;
    login: string;
    role: UserRole;
    name: string;
    surname: string;
    fathername?: string | null;
    department?: string | null;
    position?: string | null;
  };
  
  const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5092";
  
  export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  
    if (!response.ok) {
      let message = "Не удалось войти в систему";
  
      try {
        const error = await response.json();
        message = error.message ?? message;
      } catch {
        // оставляем стандартное сообщение
      }
  
      throw new Error(message);
    }
  
    return response.json();
  }
  export type TeacherScheduleItem = {
    idEntry: number;
    teacherUserId: number;
    teacherShortName: string;
    department?: string | null;
    position?: string | null;
    lessonDate: string;
    startTime?: string | null;
    endTime?: string | null;
    weekNo?: number | null;
    moduleNo?: number | null;
    disciplineName: string;
    groupName: string;
  };
  
  export async function getTeacherSchedule(idUser: number): Promise<TeacherScheduleItem[]> {
    const response = await fetch(`${API_URL}/api/users/${idUser}/teacher-schedule`);
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить расписание");
    }
  
    return response.json();
  }
  export type TeacherDiscipline = {
    idAssignment: number;
    teacherUserId: number;
    academicYear: string;
    idDiscipline: number;
    disciplineName: string;
    pudUrl?: string | null;
    idGroup: number;
    groupName: string;
    courseNo: number;
    programName: string;
    startModuleNo: number;
    endModuleNo: number;
  };
  
  export async function getTeacherDisciplines(idUser: number): Promise<TeacherDiscipline[]> {
    const response = await fetch(`${API_URL}/api/users/${idUser}/teacher-disciplines`);
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить дисциплины");
    }
  
    return response.json();
  }
  export type DisciplineGroupOption = {
    idGroup: number;
    groupName: string;
  };
  
  export type TeacherDisciplineDetail = {
    formulaElements: TeacherFormulaElement[];
    idAssignment: number;
    teacherUserId: number;
  
    idDiscipline: number;
    disciplineName: string;
  
    courseNo: number;
    programName: string;
    academicYear: string;
  
    selectedGroupId: number;
    selectedGroupName: string;
  
    startModuleNo: number;
    endModuleNo: number;
  
    formulaText: string;
    pudUrl?: string | null;
  
    groups: DisciplineGroupOption[];
  };

  export type TeacherFormulaElement = {
    idElement?: number | null;
    elementName: string;
    weight: number;
    orderNo: number;
    controlType: string;
  };
  
  export type TeacherFormulaResponse = {
    formulaText: string;
    elements: TeacherFormulaElement[];
  };
  
  export async function getTeacherDisciplineDetails(
    idUser: number,
    disciplineId: number,
    groupId?: number | null
  ): Promise<TeacherDisciplineDetail> {
    const params = new URLSearchParams();
  
    if (groupId) {
      params.set("groupId", String(groupId));
    }
  
    const query = params.toString();
  
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/teacher-disciplines/${disciplineId}/details${query ? `?${query}` : ""}`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить детали дисциплины");
    }
  
    return response.json();
  }
  export type AttendanceSession = {
    idSession: number;
    lessonDate: string;
    dateLabel: string;
    startTime?: string | null;
    endTime?: string | null;
  };
  
  export type AttendanceMark = {
    idSession: number;
    status: "present" | "absent" | "unknown";
  };
  
  export type AttendanceStudent = {
    idStudent: number;
    fullName: string;
    recordBookNo: string;
    marks: AttendanceMark[];
  };
  
  export type TeacherAttendance = {
    teacherUserId: number;
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    sessions: AttendanceSession[];
    students: AttendanceStudent[];
  };
  
  export async function getTeacherAttendance(
    idUser: number,
    disciplineId: number,
    groupId: number
  ): Promise<TeacherAttendance> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/attendance?disciplineId=${disciplineId}&groupId=${groupId}`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить посещаемость");
    }
  
    return response.json();
  }
  export type UpdateAttendancePayload = {
    students: {
      idStudent: number;
      marks: {
        idSession: number;
        status: AttendanceMark["status"];
      }[];
    }[];
  };
  
  export async function updateTeacherAttendance(
    idUser: number,
    disciplineId: number,
    groupId: number,
    payload: UpdateAttendancePayload
  ): Promise<{ message: string; updated: number }> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/attendance?disciplineId=${disciplineId}&groupId=${groupId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );
  
    if (!response.ok) {
      let message = "Не удалось сохранить посещаемость";
  
      try {
        const error = await response.json();
        message = error.message ?? message;
      } catch {
        // оставляем стандартное сообщение
      }
  
      throw new Error(message);
    }
  
    return response.json();
  }
  export type GradebookElement = {
    idElement: number;
    elementName: string;
    orderNo: number;
    weight: number;
  };
  
  export type GradebookGrade = {
    idGrade: number;
    idElement: number;
    gradeValue: number | null;
  };
  
  export type GradebookStudent = {
    idStudent: number;
    fullName: string;
    recordBookNo: string;
    grades: GradebookGrade[];
    idFinalGrade: number;
    finalGrade: number | null;
  };
  
  export type TeacherGradebook = {
    teacherUserId: number;
    idSheet: number;
    sheetStatus: string;
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    elements: GradebookElement[];
    students: GradebookStudent[];
  };
  
  export type UpdateGradebookPayload = {
    idSheet: number;
    students: {
      idStudent: number;
      grades: {
        idGrade: number;
        idElement: number;
        gradeValue: number | null;
      }[];
      idFinalGrade: number;
      finalGrade: number | null;
    }[];
  };
  
  export async function getTeacherGradebook(
    idUser: number,
    disciplineId: number,
    groupId: number
  ): Promise<TeacherGradebook> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/gradebook?disciplineId=${disciplineId}&groupId=${groupId}`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить ведомость");
    }
  
    return response.json();
  }
  
  export async function updateTeacherGradebook(
    idUser: number,
    disciplineId: number,
    groupId: number,
    payload: UpdateGradebookPayload
  ): Promise<{ message: string; updated: number }> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/gradebook?disciplineId=${disciplineId}&groupId=${groupId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );
  
    if (!response.ok) {
      let message = "Не удалось сохранить ведомость";
  
      try {
        const error = await response.json();
        message = error.message ?? message;
      } catch {
        // оставляем стандартное сообщение
      }
  
      throw new Error(message);
    }
  
    return response.json();
  }
  
  export async function submitTeacherGradebook(
    idUser: number,
    idSheet: number,
    disciplineId: number,
    groupId: number
  ): Promise<{ message: string }> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/gradebook/${idSheet}/submit?disciplineId=${disciplineId}&groupId=${groupId}`,
      {
        method: "POST"
      }
    );
  
    if (!response.ok) {
      let message = "Не удалось отправить ведомость на утверждение";
  
      try {
        const error = await response.json();
        message = error.message ?? message;
      } catch {
        // оставляем стандартное сообщение
      }
  
      throw new Error(message);
    }
  
    return response.json();
  }
  export async function exportTeacherGradebook(
    idUser: number,
    disciplineId: number,
    groupId: number
  ): Promise<Blob> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/gradebook/export?disciplineId=${disciplineId}&groupId=${groupId}`
    );
  
    if (!response.ok) {
      let message = "Не удалось экспортировать ведомость";
  
      try {
        const error = await response.json();
        message = error.message ?? message;
      } catch {
        // оставляем стандартное сообщение
      }
  
      throw new Error(message);
    }
  
    return response.blob();
  }
  export type AnalyticsAttendancePoint = {
    lessonDate: string;
    dateLabel: string;
    presentCount: number;
    absentCount: number;
    totalStudents: number;
    attendancePercent: number | null;
  };
  
  export type AnalyticsGradeDistribution = {
    label: string;
    count: number;
  };
  
  export type AnalyticsDisciplineComparison = {
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    studentsCount: number;
    averageAttendancePercent: number | null;
    averageFinalGrade: number | null;
    atRiskStudentsCount: number;
  };
  
  export type AnalyticsRiskStudent = {
    idStudent: number;
    fullName: string;
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    attendancePercent: number | null;
    finalGrade: number | null;
    missingGradesCount: number;
    riskReason: string;
  };
  
  export type TeacherAnalytics = {
    teacherUserId: number;
    disciplinesCount: number;
    groupsCount: number;
    studentsCount: number;
    totalLessons: number;
    averageAttendancePercent: number | null;
    averageFinalGrade: number | null;
    atRiskStudentsCount: number;
    filledFinalGradesCount: number;
    submittedSheetsCount: number;
    draftSheetsCount: number;
    attendanceByDate: AnalyticsAttendancePoint[];
    gradeDistribution: AnalyticsGradeDistribution[];
    disciplineComparison: AnalyticsDisciplineComparison[];
    riskStudents: AnalyticsRiskStudent[];
  };
  
  export async function getTeacherAnalytics(
    idUser: number,
    disciplineId?: number | null,
    groupId?: number | null
  ): Promise<TeacherAnalytics> {
    const params = new URLSearchParams();
  
    if (disciplineId) {
      params.set("disciplineId", String(disciplineId));
    }
  
    if (groupId) {
      params.set("groupId", String(groupId));
    }
  
    const query = params.toString();
  
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/teacher-analytics${query ? `?${query}` : ""}`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить BI-аналитику");
    }
  
    return response.json();
  }
  export type StudentScheduleItem = {
    idEntry: number;
  
    studentUserId: number;
    idStudent: number;
  
    idGroup: number;
    groupName: string;
    courseNo: number;
  
    programName: string;
  
    idDiscipline: number;
    disciplineName: string;
  
    teacherShortName: string;
    department?: string | null;
    position?: string | null;
  
    lessonDate: string;
    startTime?: string | null;
    endTime?: string | null;
  
    moduleNo?: number | null;
    weekNo?: number | null;
  };
  
  export async function getStudentSchedule(idUser: number): Promise<StudentScheduleItem[]> {
    const response = await fetch(`${API_URL}/api/users/${idUser}/student-schedule`);
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить расписание студента");
    }
  
    return response.json();
  }
  export type StudentDiscipline = {
    studentUserId: number;
    idStudent: number;
  
    idGroup: number;
    groupName: string;
    courseNo: number;
  
    idProgram: number;
    programName: string;
  
    idDiscipline: number;
    disciplineName: string;
  
    startModuleNo?: number | null;
    endModuleNo?: number | null;
  
    academicYear: string;
  
    teachersCount: number;
    teachersShortNames: string;
  };
  
  export async function getStudentDisciplines(idUser: number): Promise<StudentDiscipline[]> {
    const response = await fetch(`${API_URL}/api/users/${idUser}/student-disciplines`);
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить дисциплины студента");
    }
  
    return response.json();
  }
  export type StudentDisciplineDetails = {
    studentUserId: number;
    idStudent: number;
    idGroup: number;
    groupName: string;
    courseNo: number;
    idProgram: number;
    programName: string;
    idDiscipline: number;
    disciplineName: string;
    pudUrl?: string | null;
    startModuleNo?: number | null;
    endModuleNo?: number | null;
    academicYear: string;
    idAssignment: number;
    formulaText: string;
    teachersCount: number;
    teachersShortNames: string;
  };
  
  export async function getStudentDisciplineDetails(
    idUser: number,
    disciplineId: number
  ): Promise<StudentDisciplineDetails> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/student-disciplines/${disciplineId}`
    );
  
    if (!response.ok) {
      let message = "Не удалось загрузить информацию о дисциплине";
  
      try {
        const error = await response.json();
        message = error.message ?? message;
      } catch {
        // оставляем стандартное сообщение
      }
  
      throw new Error(message);
    }
  
    return response.json();
  }
  export type StudentAttendanceSession = {
    idSession: number;
    lessonDate: string;
    dateLabel: string;
    startTime?: string | null;
    endTime?: string | null;
    status: "present" | "absent" | "unknown";
  };
  
  export type StudentAttendance = {
    studentUserId: number;
    idStudent: number;
    idAssignment: number;
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    programName: string;
    academicYear: string;
    attendancePercent: number | null;
    sessions: StudentAttendanceSession[];
  };
  
  export async function getStudentAttendance(
    idUser: number,
    disciplineId: number
  ): Promise<StudentAttendance> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/student-attendance?disciplineId=${disciplineId}`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить посещаемость студента");
    }
  
    return response.json();
  }
  export type StudentGradebookElement = {
    idElement: number;
    elementName: string;
    orderNo: number;
    controlType?: string | null;
    weight?: number | null;
    gradeValue?: number | null;
    dateLabel: string;
  };
  
  export type StudentGradebook = {
    studentUserId: number;
    idStudent: number;
    idAssignment: number;
    idSheet?: number | null;
    sheetStatus: string;
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    programName: string;
    academicYear: string;
    formulaText: string;
    accumulatedGrade?: number | null;
    examGrade?: number | null;
    preliminaryFinalGrade?: number | null;
    finalGrade?: number | null;
    elements: StudentGradebookElement[];
  };
  
  export async function getStudentGradebook(
    idUser: number,
    disciplineId: number
  ): Promise<StudentGradebook> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/student-gradebook?disciplineId=${disciplineId}`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить ведомость студента");
    }
  
    return response.json();
  }
  export type StudentAnalyticsAttendancePoint = {
    lessonDate: string;
    dateLabel: string;
    attendancePercent: number | null;
  };
  
  export type StudentAnalyticsGradePoint = {
    idDiscipline: number;
    disciplineName: string;
    elementName: string;
    gradeValue: number | null;
    orderNo: number;
  };
  
  export type StudentAnalyticsGradeDistribution = {
    label: string;
    count: number;
  };
  
  export type StudentAnalyticsDisciplineSummary = {
    idDiscipline: number;
    disciplineName: string;
    attendancePercent: number | null;
    averageGrade: number | null;
    finalGrade: number | null;
    missingGradesCount: number;
    hasRisk: boolean;
    riskReason: string;
  };
  
  export type StudentAnalytics = {
    studentUserId: number;
    idStudent: number;
    studentFullName: string;
    groupName: string;
    courseNo: number;
    programName: string;
    disciplinesCount: number;
    totalLessons: number;
    averageAttendancePercent: number | null;
    averageGrade: number | null;
    preliminaryFinalGrade: number | null;
    filledGradesCount: number;
    totalGradesCount: number;
    missingGradesCount: number;
    hasRisk: boolean;
    riskReason: string;
    attendanceByDate: StudentAnalyticsAttendancePoint[];
    gradeProgress: StudentAnalyticsGradePoint[];
    gradeDistribution: StudentAnalyticsGradeDistribution[];
    disciplineSummary: StudentAnalyticsDisciplineSummary[];
  };
  
  export async function getStudentAnalytics(
    idUser: number,
    disciplineId?: number | null
  ): Promise<StudentAnalytics> {
    const params = new URLSearchParams();
  
    if (disciplineId) {
      params.set("disciplineId", String(disciplineId));
    }
  
    const query = params.toString();
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/student-analytics${query ? `?${query}` : ""}`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить аналитику студента");
    }
  
    return response.json();
  }
  export type OfficeProgramOption = {
    idProgram: number;
    programName: string;
  };
  
  export type OfficeResitDiscipline = {
    idDiscipline: number;
    disciplineName: string;
    pudUrl?: string | null;
    programs: OfficeProgramOption[];
    courseNos: number[];
    moduleNos: number[];
    groupsCount: number;
    studentsCount: number;
    retakeStudentsCount: number;
  };
  
  export async function getOfficeResitDisciplines(
    idUser: number
  ): Promise<OfficeResitDiscipline[]> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/resit-disciplines`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить дисциплины для пересдач");
    }
  
    return response.json();
  }
  export type OfficeResitGroup = {
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    idProgram: number;
    programName: string;
    startModuleNo: number;
    endModuleNo: number;
    idAssignment: number;
    academicYear: string;
    teacherShortName: string;
    idSheet?: number | null;
    sheetStatus: string;
    studentsCount: number;
    retakeStudentsCount: number;
  };
  
  export type OfficeResitStudent = {
    idStudent: number;
    fullName: string;
    recordBookNo: string;
    programName: string;
    groupName: string;
    finalGrade: number;
  };
  
  export type OfficeResitStudentList = {
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    idProgram: number;
    programName: string;
    idAssignment: number;
    academicYear: string;
    teacherShortName: string;
    retakeStudentsCount: number;
    students: OfficeResitStudent[];
  };
  
  export async function getOfficeResitGroups(
    idUser: number,
    disciplineId: number
  ): Promise<OfficeResitGroup[]> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/resit-disciplines/${disciplineId}/groups`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить группы по дисциплине");
    }
  
    return response.json();
  }
  
  export async function getOfficeResitStudents(
    idUser: number,
    disciplineId: number,
    groupId: number
  ): Promise<OfficeResitStudentList> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/resit-disciplines/${disciplineId}/groups/${groupId}/students`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить список студентов на пересдачу");
    }
  
    return response.json();
  }
  export type OfficeAttendanceProgramOption = {
    idProgram: number;
    programName: string;
  };
  
  export type OfficeAttendanceDiscipline = {
    idDiscipline: number;
    disciplineName: string;
    pudUrl?: string | null;
    programs: OfficeAttendanceProgramOption[];
    courseNos: number[];
    moduleNos: number[];
    groupsCount: number;
    studentsCount: number;
    sessionsCount: number;
    markedAttendanceCount: number;
    presentAttendanceCount: number;
    absentAttendanceCount: number;
    attendancePercent: number | null;
  };
  
  export async function getOfficeAttendanceDisciplines(
    idUser: number
  ): Promise<OfficeAttendanceDiscipline[]> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/attendance-disciplines`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить дисциплины для посещаемости");
    }
  
    return response.json();
  }
  export type OfficeAttendanceGroup = {
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    idProgram: number;
    programName: string;
    startModuleNo: number;
    endModuleNo: number;
    idAssignment: number;
    academicYear: string;
    teacherShortName: string;
    studentsCount: number;
    sessionsCount: number;
    markedAttendanceCount: number;
    presentAttendanceCount: number;
    absentAttendanceCount: number;
    attendancePercent: number | null;
  };
  
  export type OfficeAttendanceSession = {
    idSession: number;
    lessonDate: string;
    dateLabel: string;
    startTime?: string | null;
    endTime?: string | null;
  };
  
  export type OfficeAttendanceStudentStatus = {
    idSession: number;
    status: "present" | "absent" | "unknown";
  };
  
  export type OfficeAttendanceStudent = {
    idStudent: number;
    fullName: string;
    recordBookNo: string;
    attendance: OfficeAttendanceStudentStatus[];
  };
  
  export type OfficeAttendanceSheet = {
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    idProgram: number;
    programName: string;
    idAssignment: number;
    academicYear: string;
    teacherShortName: string;
    attendancePercent: number | null;
    sessions: OfficeAttendanceSession[];
    students: OfficeAttendanceStudent[];
  };
  
  export async function getOfficeAttendanceGroups(
    idUser: number,
    disciplineId: number
  ): Promise<OfficeAttendanceGroup[]> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/attendance-disciplines/${disciplineId}/groups`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить группы по дисциплине");
    }
  
    return response.json();
  }
  
  export async function getOfficeAttendanceSheet(
    idUser: number,
    disciplineId: number,
    groupId: number
  ): Promise<OfficeAttendanceSheet> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/attendance-disciplines/${disciplineId}/groups/${groupId}/sheet`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить ведомость посещаемости");
    }
  
    return response.json();
  }
  export type OfficeFinalSheetProgramOption = {
    idProgram: number;
    programName: string;
  };
  
  export type OfficeFinalSheetDiscipline = {
    idDiscipline: number;
    disciplineName: string;
    pudUrl?: string | null;
    programs: OfficeFinalSheetProgramOption[];
    courseNos: number[];
    moduleNos: number[];
    groupsCount: number;
    studentsCount: number;
    finalSheetsCount: number;
    submittedSheetsCount: number;
    approvedSheetsCount: number;
    filledFinalGradesCount: number;
    failedStudentsCount: number;
    filledPercent: number | null;
  };
  
  export async function getOfficeFinalSheetDisciplines(
    idUser: number
  ): Promise<OfficeFinalSheetDiscipline[]> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/final-sheet-disciplines`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить дисциплины для итоговых ведомостей");
    }
  
    return response.json();
  }
  export type OfficeFinalSheetGroup = {
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    idProgram: number;
    programName: string;
    startModuleNo: number;
    endModuleNo: number;
    idAssignment: number;
    academicYear: string;
    teacherShortName: string;
    idSheet?: number | null;
    sheetStatus: string;
    studentsCount: number;
    filledFinalGradesCount: number;
    failedStudentsCount: number;
    filledPercent: number | null;
  };
  
  export type OfficeFinalSheetElement = {
    idElement: number;
    elementName: string;
    controlType?: string | null;
    weight?: number | null;
    orderNo: number;
  };
  
  export type OfficeFinalSheetStudentGrade = {
    idElement: number;
    gradeValue?: number | null;
  };
  
  export type OfficeFinalSheetStudent = {
    idStudent: number;
    fullName: string;
    recordBookNo: string;
    accumulatedGrade?: number | null;
    examGrade?: number | null;
    finalGrade?: number | null;
    grades: OfficeFinalSheetStudentGrade[];
  };
  
  export type OfficeFinalSheet = {
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    idProgram: number;
    programName: string;
    idAssignment: number;
    academicYear: string;
    teacherShortName: string;
    idSheet?: number | null;
    sheetStatus: string;
    formulaText: string;
    elements: OfficeFinalSheetElement[];
    students: OfficeFinalSheetStudent[];
  };
  
  export async function getOfficeFinalSheetGroups(
    idUser: number,
    disciplineId: number
  ): Promise<OfficeFinalSheetGroup[]> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/final-sheet-disciplines/${disciplineId}/groups`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить группы для итоговых ведомостей");
    }
  
    return response.json();
  }
  
  export async function getOfficeFinalSheet(
    idUser: number,
    disciplineId: number,
    groupId: number
  ): Promise<OfficeFinalSheet> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/final-sheet-disciplines/${disciplineId}/groups/${groupId}/sheet`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить итоговую ведомость");
    }
  
    return response.json();
  }
  export async function exportOfficeFinalSheet(
    idUser: number,
    disciplineId: number,
    groupId: number
  ): Promise<Blob> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/final-sheet-disciplines/${disciplineId}/groups/${groupId}/sheet/export`
    );
  
    if (!response.ok) {
      let message = "Не удалось экспортировать итоговую ведомость";
  
      try {
        const error = await response.json();
        message = error.message ?? message;
      } catch {
        // оставляем стандартное сообщение
      }
  
      throw new Error(message);
    }
  
    return response.blob();
  }
  export type OfficeStudent = {
    idStudent: number;
    idUser: number;
    fullName: string;
    surname: string;
    name: string;
    fathername?: string | null;
    recordBookNo: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    idProgram: number;
    programName: string;
    idStatus?: number | null;
    studentStatus?: string | null;
  };
  
  export async function getOfficeStudents(
    idUser: number
  ): Promise<OfficeStudent[]> {
    const response = await fetch(`${API_URL}/api/users/${idUser}/office/students`);
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить список студентов");
    }
  
    return response.json();
  }
  export type OfficeStudentDetails = {
    idStudent: number;
    idUser: number;
    fullName: string;
    surname: string;
    name: string;
    fathername?: string | null;
    recordBookNo: string;
    email?: string | null;
    idGroup: number;
    groupName: string;
    courseNo: number;
    idProgram: number;
    programName: string;
    idStatus?: number | null;
    studentStatus?: string | null;
  };
  
  export type OfficeStudentAttendanceDiscipline = {
    idStudent: number;
    idDiscipline: number;
    disciplineName: string;
    pudUrl?: string | null;
    idEnrollment: number;
    courseNo: number;
    moduleNos: number[];
    idAssignment: number;
    academicYear: string;
    sessionsCount: number;
    markedAttendanceCount: number;
    presentAttendanceCount: number;
    absenceCount: number;
    attendancePercent: number | null;
  };
  
  export async function getOfficeStudentDetails(
    idUser: number,
    studentId: number
  ): Promise<OfficeStudentDetails> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/students/${studentId}`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить карточку студента");
    }
  
    return response.json();
  }
  
  export async function getOfficeStudentAttendanceSummary(
    idUser: number,
    studentId: number
  ): Promise<OfficeStudentAttendanceDiscipline[]> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/students/${studentId}/attendance-summary`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить посещаемость студента");
    }
  
    return response.json();
  }
  export type OfficeStudentGradebookDiscipline = {
    idStudent: number;
    idDiscipline: number;
    disciplineName: string;
    pudUrl?: string | null;
    idEnrollment: number;
    courseNo: number;
    moduleNos: number[];
    idAssignment: number;
    academicYear: string;
    idSheet?: number | null;
    sheetStatus: string;
    finalGrade?: number | null;
  };
  
  export async function getOfficeStudentGradebookSummary(
    idUser: number,
    studentId: number
  ): Promise<OfficeStudentGradebookDiscipline[]> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/students/${studentId}/gradebook-summary`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить ведомость студента");
    }
  
    return response.json();
  }
  export type OfficeAnalyticsProgramOption = {
    idProgram: number;
    programName: string;
  };
  
  export type OfficeAnalyticsFilterOptions = {
    programs: OfficeAnalyticsProgramOption[];
    courseNos: number[];
    moduleNos: number[];
  };
  
  export type OfficeAnalyticsAttendancePoint = {
    lessonDate: string;
    dateLabel: string;
    presentCount: number;
    absentCount: number;
    totalStudents: number;
    attendancePercent: number | null;
  };
  
  export type OfficeAnalyticsGradeDistribution = {
    label: string;
    count: number;
  };
  
  export type OfficeAnalyticsProgramComparison = {
    idProgram: number;
    programName: string;
    studentsCount: number;
    groupsCount: number;
    averageAttendancePercent: number | null;
    averageFinalGrade: number | null;
    atRiskStudentsCount: number;
  };
  
  export type OfficeAnalyticsDisciplineComparison = {
    idDiscipline: number;
    disciplineName: string;
    groupsCount: number;
    studentsCount: number;
    averageAttendancePercent: number | null;
    averageFinalGrade: number | null;
    failedStudentsCount: number;
    atRiskStudentsCount: number;
  };
  
  export type OfficeAnalyticsGroupComparison = {
    idGroup: number;
    groupName: string;
    courseNo: number;
    programName: string;
    studentsCount: number;
    averageAttendancePercent: number | null;
    averageFinalGrade: number | null;
    atRiskStudentsCount: number;
  };
  
  export type OfficeAnalyticsStatusDistribution = {
    statusName: string;
    count: number;
  };
  
  export type OfficeAnalyticsRiskStudent = {
    idStudent: number;
    fullName: string;
    idDiscipline: number;
    disciplineName: string;
    idGroup: number;
    groupName: string;
    courseNo: number;
    programName: string;
    attendancePercent: number | null;
    finalGrade: number | null;
    missingGradesCount: number;
    riskReason: string;
  };
  
  export type OfficeAnalytics = {
    programsCount: number;
    disciplinesCount: number;
    groupsCount: number;
    studentsCount: number;
    activeStudentsCount: number;
    totalLessons: number;
    averageAttendancePercent: number | null;
    averageFinalGrade: number | null;
    failedStudentsCount: number;
    atRiskStudentsCount: number;
    filledFinalGradesCount: number;
    approvedSheetsCount: number;
    submittedSheetsCount: number;
    draftSheetsCount: number;
    filterOptions: OfficeAnalyticsFilterOptions;
    attendanceByDate: OfficeAnalyticsAttendancePoint[];
    gradeDistribution: OfficeAnalyticsGradeDistribution[];
    programComparison: OfficeAnalyticsProgramComparison[];
    disciplineComparison: OfficeAnalyticsDisciplineComparison[];
    groupComparison: OfficeAnalyticsGroupComparison[];
    studentStatusDistribution: OfficeAnalyticsStatusDistribution[];
    riskStudents: OfficeAnalyticsRiskStudent[];
  };
  
  export async function getOfficeAnalytics(
    idUser: number,
    programId?: number | null,
    courseNo?: number | null,
    moduleNo?: number | null
  ): Promise<OfficeAnalytics> {
    const params = new URLSearchParams();
  
    if (programId) {
      params.set("programId", String(programId));
    }
  
    if (courseNo) {
      params.set("courseNo", String(courseNo));
    }
  
    if (moduleNo) {
      params.set("moduleNo", String(moduleNo));
    }
  
    const query = params.toString();
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office-analytics${query ? `?${query}` : ""}`
    );
  
    if (!response.ok) {
      throw new Error("Не удалось загрузить аналитику учебного офиса");
    }
  
    return response.json();
  }
  export type HseScheduleImportResult = {
    foundLinksCount: number;
    downloadedFilesCount: number;
    createdImportsCount: number;
    duplicateFilesCount: number;
    addedEntriesCount: number;
    skippedEntriesCount: number;
    createdDisciplinesCount: number;
    createdTeachersCount: number;
    createdGroupsCount: number;
    createdAssignmentsCount: number;
    createdAttendanceSessionsCount: number;
    warnings: string[];
  };
  
  export async function importHseSchedule(
    idUser: number,
    moduleNo: number,
    onlyLatest: boolean
  ): Promise<HseScheduleImportResult> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/office/schedule/import-hse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          moduleNo,
          onlyLatest
        })
      }
    );
  
    if (!response.ok) {
      const text = await response.text();
  
      throw new Error(
        text || "Не удалось импортировать расписание с сайта ВШЭ"
      );
    }
  
    return response.json();
  }
  export async function updateTeacherDisciplineFormula(
    idUser: number,
    disciplineId: number,
    idAssignment: number,
    elements: TeacherFormulaElement[]
  ): Promise<TeacherFormulaResponse> {
    const response = await fetch(
      `${API_URL}/api/users/${idUser}/teacher-disciplines/${disciplineId}/details/${idAssignment}/formula`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          elements
        })
      }
    );
  
    if (!response.ok) {
      const text = await response.text();
  
      throw new Error(text || "Не удалось сохранить формулу оценивания");
    }
  
    return response.json();
  }