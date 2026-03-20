# Черновик API

## Auth
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

## Users / roles
- GET /users/me
- GET /roles

## Disciplines / groups
- GET /disciplines
- GET /groups
- GET /students

## Grade sheets
- GET /gradesheets
- GET /gradesheets/{id}
- PUT /gradesheets/{id}

## Grades
- GET /gradesheets/{id}/grades
- PUT /gradesheets/{id}/grades

## Attendance
- GET /gradesheets/{id}/attendance
- PUT /gradesheets/{id}/attendance

## Formula
- GET /gradesheets/{id}/formula
- PUT /gradesheets/{id}/formula

## Export
- GET /export/gradesheet/{id}
- GET /export/student/{id}

## Schedule import
- POST /schedule/import
- GET /schedule/import/{id}

## BI / analytics
- GET /analytics/summary
- GET /analytics/attendance
- GET /analytics/performance