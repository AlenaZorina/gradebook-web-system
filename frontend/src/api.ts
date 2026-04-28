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