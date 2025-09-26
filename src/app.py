"""
High School Management System API

A super simple FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
"""

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, List
import os
from pathlib import Path

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")

# In-memory activity database
activities = {
    "Chess Club": {
        "description": "Learn strategies and compete in chess tournaments",
        "schedule": "Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 12,
        "participants": ["michael@mergington.edu", "daniel@mergington.edu"]
    },
    "Programming Class": {
        "description": "Learn programming fundamentals and build software projects",
        "schedule": "Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
        "max_participants": 20,
        "participants": ["emma@mergington.edu", "sophia@mergington.edu"]
    },
    "Gym Class": {
        "description": "Physical education and sports activities",
        "schedule": "Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
        "max_participants": 30,
        "participants": ["john@mergington.edu", "olivia@mergington.edu"]
    },
    "Soccer Team": {
        "description": "Join the school soccer team and compete in matches",
        "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
        "max_participants": 22,
        "participants": ["liam@mergington.edu", "noah@mergington.edu"]
    },
    "Basketball Team": {
        "description": "Practice and play basketball with the school team",
        "schedule": "Wednesdays and Fridays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["ava@mergington.edu", "mia@mergington.edu"]
    },
    "Art Club": {
        "description": "Explore your creativity through painting and drawing",
        "schedule": "Thursdays, 3:30 PM - 5:00 PM",
        "max_participants": 15,
        "participants": ["amelia@mergington.edu", "harper@mergington.edu"]
    },
    "Drama Club": {
        "description": "Act, direct, and produce plays and performances",
        "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
        "max_participants": 20,
        "participants": ["ella@mergington.edu", "scarlett@mergington.edu"]
    },
    "Math Club": {
        "description": "Solve challenging problems and participate in math competitions",
        "schedule": "Tuesdays, 3:30 PM - 4:30 PM",
        "max_participants": 10,
        "participants": ["james@mergington.edu", "benjamin@mergington.edu"]
    },
    "Debate Team": {
        "description": "Develop public speaking and argumentation skills",
        "schedule": "Fridays, 4:00 PM - 5:30 PM",
        "max_participants": 12,
        "participants": ["charlotte@mergington.edu", "henry@mergington.edu"]
    }
}

# In-memory storage for students, courses, enrollment, and attendance
students = {}
courses = {}
enrollments = {}
attendance = {}
payments = {}

# Pydantic models for data validation
class Student(BaseModel):
    name: str
    email: str
    grade: str
    phone: Optional[str] = None

class Course(BaseModel):
    name: str
    description: str
    schedule: str
    max_participants: int
    instructor: Optional[str] = None

class Enrollment(BaseModel):
    student_email: str
    course_name: str
    enrollment_date: str

class AttendanceRecord(BaseModel):
    student_email: str
    course_name: str
    date: str
    present: bool

class Payment(BaseModel):
    student_email: str
    amount: float
    course_name: str
    payment_date: str
    status: str


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities():
    return activities


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str):
    """Sign up a student for an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is not already signed up
    if email in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )

    # Add student
    activity["participants"].append(email)
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str):
    """Unregister a student from an activity"""
    # Validate activity exists
    if activity_name not in activities:
        raise HTTPException(status_code=404, detail="Activity not found")

    # Get the specific activity
    activity = activities[activity_name]

    # Validate student is signed up
    if email not in activity["participants"]:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )

    # Remove student
    activity["participants"].remove(email)
    return {"message": f"Unregistered {email} from {activity_name}"}


# Admin API Endpoints

# Student Management
@app.get("/admin/students")
def get_all_students():
    """Get all students"""
    return students

@app.post("/admin/students")
def create_student(student: Student):
    """Create a new student"""
    if student.email in students:
        raise HTTPException(status_code=400, detail="Student already exists")
    students[student.email] = student.dict()
    return {"message": f"Student {student.name} created successfully"}

@app.put("/admin/students/{student_email}")
def update_student(student_email: str, student: Student):
    """Update a student's information"""
    if student_email not in students:
        raise HTTPException(status_code=404, detail="Student not found")
    students[student_email] = student.dict()
    return {"message": f"Student {student.name} updated successfully"}

@app.delete("/admin/students/{student_email}")
def delete_student(student_email: str):
    """Delete a student"""
    if student_email not in students:
        raise HTTPException(status_code=404, detail="Student not found")
    del students[student_email]
    return {"message": f"Student {student_email} deleted successfully"}

# Course Management  
@app.get("/admin/courses")
def get_all_courses():
    """Get all courses"""
    return courses

@app.post("/admin/courses")
def create_course(course: Course):
    """Create a new course"""
    if course.name in courses:
        raise HTTPException(status_code=400, detail="Course already exists")
    courses[course.name] = course.dict()
    return {"message": f"Course {course.name} created successfully"}

@app.put("/admin/courses/{course_name}")
def update_course(course_name: str, course: Course):
    """Update a course"""
    if course_name not in courses:
        raise HTTPException(status_code=404, detail="Course not found")
    courses[course_name] = course.dict()
    return {"message": f"Course {course.name} updated successfully"}

@app.delete("/admin/courses/{course_name}")
def delete_course(course_name: str):
    """Delete a course"""
    if course_name not in courses:
        raise HTTPException(status_code=404, detail="Course not found")
    del courses[course_name]
    return {"message": f"Course {course_name} deleted successfully"}

# Enrollment Management
@app.get("/admin/enrollments")
def get_all_enrollments():
    """Get all enrollments"""
    return list(enrollments.values())

@app.post("/admin/enrollments")
def create_enrollment(enrollment: Enrollment):
    """Enroll a student in a course"""
    enrollment_key = f"{enrollment.student_email}_{enrollment.course_name}"
    if enrollment_key in enrollments:
        raise HTTPException(status_code=400, detail="Student already enrolled in this course")
    enrollments[enrollment_key] = enrollment.dict()
    return {"message": f"Student {enrollment.student_email} enrolled in {enrollment.course_name}"}

@app.delete("/admin/enrollments/{student_email}/{course_name}")
def delete_enrollment(student_email: str, course_name: str):
    """Remove a student's enrollment"""
    enrollment_key = f"{student_email}_{course_name}"
    if enrollment_key not in enrollments:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    del enrollments[enrollment_key]
    return {"message": f"Student {student_email} unenrolled from {course_name}"}

# Attendance Management
@app.get("/admin/attendance")
def get_all_attendance():
    """Get all attendance records"""
    return list(attendance.values())

@app.post("/admin/attendance")
def record_attendance(attendance_record: AttendanceRecord):
    """Record attendance for a student"""
    attendance_key = f"{attendance_record.student_email}_{attendance_record.course_name}_{attendance_record.date}"
    attendance[attendance_key] = attendance_record.dict()
    return {"message": f"Attendance recorded for {attendance_record.student_email}"}

@app.get("/admin/attendance/{student_email}")
def get_student_attendance(student_email: str):
    """Get attendance records for a specific student"""
    student_attendance = [record for record in attendance.values() if record["student_email"] == student_email]
    return student_attendance

# Payment Management
@app.get("/admin/payments")
def get_all_payments():
    """Get all payment records"""
    return list(payments.values())

@app.post("/admin/payments")
def create_payment(payment: Payment):
    """Record a payment"""
    payment_key = f"{payment.student_email}_{payment.course_name}_{payment.payment_date}"
    payments[payment_key] = payment.dict()
    return {"message": f"Payment of ${payment.amount} recorded for {payment.student_email}"}

@app.get("/admin/payments/{student_email}")
def get_student_payments(student_email: str):
    """Get payment records for a specific student"""
    student_payments = [record for record in payments.values() if record["student_email"] == student_email]
    return student_payments
