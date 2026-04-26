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