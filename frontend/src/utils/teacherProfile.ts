import type { LoginResponse } from "../api";

export function getTeacherInitials(user: LoginResponse) {
  const surnameInitial = user.surname?.trim()?.[0] ?? "";
  const nameInitial = user.name?.trim()?.[0] ?? "";

  return `${surnameInitial}${nameInitial}`.toUpperCase();
}

export function getTeacherShortName(user: LoginResponse) {
  const nameInitial = user.name?.trim()?.[0]
    ? `${user.name.trim()[0]}.`
    : "";

  const fathernameInitial = user.fathername?.trim()?.[0]
    ? `${user.fathername.trim()[0]}.`
    : "";

  return `${user.surname} ${nameInitial}${fathernameInitial}`.trim();
}

export function getTeacherSubtitle(user: LoginResponse) {
  const position = user.position?.trim();
  const department = user.department?.trim();

  if (position && department) {
    return `${position} кафедры ${department}`;
  }

  if (position) {
    return position;
  }

  if (department) {
    return `Преподаватель кафедры ${department}`;
  }

  return "Преподаватель кафедры";
}