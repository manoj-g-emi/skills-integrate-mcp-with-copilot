// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the admin panel
    loadAllData();
    setupEventListeners();
    
    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('enrollment-date').value = today;
    document.getElementById('attendance-date').value = today;
    document.getElementById('payment-date').value = today;
});

// Show/Hide sections
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(sectionName).classList.add('active');
    document.getElementById(sectionName + '-nav').classList.add('active');
    
    // Refresh data for the selected section
    switch(sectionName) {
        case 'students':
            loadStudents();
            break;
        case 'courses':
            loadCourses();
            break;
        case 'enrollments':
            loadEnrollments();
            updateEnrollmentSelects();
            break;
        case 'attendance':
            loadAttendance();
            updateAttendanceSelects();
            break;
        case 'payments':
            loadPayments();
            updatePaymentSelects();
            break;
    }
}

// Setup event listeners for forms
function setupEventListeners() {
    // Student forms
    document.getElementById('student-form').addEventListener('submit', handleCreateStudent);
    document.getElementById('update-student-form').addEventListener('submit', handleUpdateStudent);
    document.getElementById('update-student-select').addEventListener('change', populateStudentUpdateForm);
    
    // Course forms
    document.getElementById('course-form').addEventListener('submit', handleCreateCourse);
    document.getElementById('update-course-form').addEventListener('submit', handleUpdateCourse);
    document.getElementById('update-course-select').addEventListener('change', populateCourseUpdateForm);
    
    // Enrollment form
    document.getElementById('enrollment-form').addEventListener('submit', handleCreateEnrollment);
    
    // Attendance form
    document.getElementById('attendance-form').addEventListener('submit', handleCreateAttendance);
    
    // Payment form
    document.getElementById('payment-form').addEventListener('submit', handleCreatePayment);
}

// Utility functions
function showMessage(message, type = 'success') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type} show`;
    
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 5000);
}

// API helper functions
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            config.body = JSON.stringify(body);
        }
        
        const response = await fetch(endpoint, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API call error:', error);
        showMessage(error.message, 'error');
        throw error;
    }
}

// Load all data
async function loadAllData() {
    await Promise.all([
        loadStudents(),
        loadCourses(),
        loadEnrollments(),
        loadAttendance(),
        loadPayments()
    ]);
    
    updateAllSelects();
}

// Student management
async function loadStudents() {
    try {
        const students = await apiCall('/admin/students');
        updateStudentsTable(students);
        updateStudentSelects(students);
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

function updateStudentsTable(students) {
    const tbody = document.querySelector('#students-table tbody');
    tbody.innerHTML = '';
    
    Object.entries(students).forEach(([email, student]) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.grade}th Grade</td>
            <td>${student.phone || 'N/A'}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteStudent('${email}')">Delete</button>
            </td>
        `;
    });
}

function updateStudentSelects(students) {
    const selects = [
        'update-student-select',
        'enroll-student-email',
        'attendance-student-email',
        'payment-student-email'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        // Clear existing options (except first one)
        const firstOption = select.firstElementChild;
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        // Add student options
        Object.entries(students).forEach(([email, student]) => {
            const option = document.createElement('option');
            option.value = email;
            option.textContent = `${student.name} (${email})`;
            select.appendChild(option);
        });
        
        // Restore selected value if it still exists
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

async function handleCreateStudent(event) {
    event.preventDefault();
    
    const student = {
        name: document.getElementById('student-name').value,
        email: document.getElementById('student-email').value,
        grade: document.getElementById('student-grade').value,
        phone: document.getElementById('student-phone').value || null
    };
    
    try {
        await apiCall('/admin/students', 'POST', student);
        showMessage('Student created successfully!');
        document.getElementById('student-form').reset();
        loadStudents();
    } catch (error) {
        // Error message already shown in apiCall
    }
}

async function handleUpdateStudent(event) {
    event.preventDefault();
    
    const email = document.getElementById('update-student-select').value;
    const student = {
        name: document.getElementById('update-student-name').value,
        email: email,
        grade: document.getElementById('update-student-grade').value,
        phone: document.getElementById('update-student-phone').value || null
    };
    
    try {
        await apiCall(`/admin/students/${encodeURIComponent(email)}`, 'PUT', student);
        showMessage('Student updated successfully!');
        loadStudents();
    } catch (error) {
        // Error message already shown in apiCall
    }
}

function populateStudentUpdateForm() {
    const select = document.getElementById('update-student-select');
    const email = select.value;
    
    if (!email) {
        // Clear form
        document.getElementById('update-student-name').value = '';
        document.getElementById('update-student-grade').value = '';
        document.getElementById('update-student-phone').value = '';
        return;
    }
    
    // Find student data and populate form
    // We'll need to get this from the loaded students data
    apiCall('/admin/students').then(students => {
        const student = students[email];
        if (student) {
            document.getElementById('update-student-name').value = student.name;
            document.getElementById('update-student-grade').value = student.grade;
            document.getElementById('update-student-phone').value = student.phone || '';
        }
    });
}

async function deleteStudent(email) {
    if (confirm(`Are you sure you want to delete student ${email}?`)) {
        try {
            await apiCall(`/admin/students/${encodeURIComponent(email)}`, 'DELETE');
            showMessage('Student deleted successfully!');
            loadStudents();
        } catch (error) {
            // Error message already shown in apiCall
        }
    }
}

// Course management
async function loadCourses() {
    try {
        const courses = await apiCall('/admin/courses');
        updateCoursesTable(courses);
        updateCourseSelects(courses);
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

function updateCoursesTable(courses) {
    const tbody = document.querySelector('#courses-table tbody');
    tbody.innerHTML = '';
    
    Object.entries(courses).forEach(([name, course]) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${course.name}</td>
            <td>${course.description}</td>
            <td>${course.schedule}</td>
            <td>${course.max_participants}</td>
            <td>${course.instructor || 'N/A'}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteCourse('${name}')">Delete</button>
            </td>
        `;
    });
}

function updateCourseSelects(courses) {
    const selects = [
        'update-course-select',
        'enroll-course-name',
        'attendance-course-name',
        'payment-course-name'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        // Clear existing options (except first one)
        const firstOption = select.firstElementChild;
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        // Add course options
        Object.keys(courses).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });
        
        // Restore selected value if it still exists
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

async function handleCreateCourse(event) {
    event.preventDefault();
    
    const course = {
        name: document.getElementById('course-name').value,
        description: document.getElementById('course-description').value,
        schedule: document.getElementById('course-schedule').value,
        max_participants: parseInt(document.getElementById('course-max-participants').value),
        instructor: document.getElementById('course-instructor').value || null
    };
    
    try {
        await apiCall('/admin/courses', 'POST', course);
        showMessage('Course created successfully!');
        document.getElementById('course-form').reset();
        loadCourses();
    } catch (error) {
        // Error message already shown in apiCall
    }
}

async function handleUpdateCourse(event) {
    event.preventDefault();
    
    const originalName = document.getElementById('update-course-select').value;
    const course = {
        name: document.getElementById('update-course-name').value,
        description: document.getElementById('update-course-description').value,
        schedule: document.getElementById('update-course-schedule').value,
        max_participants: parseInt(document.getElementById('update-course-max-participants').value),
        instructor: document.getElementById('update-course-instructor').value || null
    };
    
    try {
        await apiCall(`/admin/courses/${encodeURIComponent(originalName)}`, 'PUT', course);
        showMessage('Course updated successfully!');
        loadCourses();
    } catch (error) {
        // Error message already shown in apiCall
    }
}

function populateCourseUpdateForm() {
    const select = document.getElementById('update-course-select');
    const name = select.value;
    
    if (!name) {
        // Clear form
        document.getElementById('update-course-name').value = '';
        document.getElementById('update-course-description').value = '';
        document.getElementById('update-course-schedule').value = '';
        document.getElementById('update-course-max-participants').value = '';
        document.getElementById('update-course-instructor').value = '';
        return;
    }
    
    // Find course data and populate form
    apiCall('/admin/courses').then(courses => {
        const course = courses[name];
        if (course) {
            document.getElementById('update-course-name').value = course.name;
            document.getElementById('update-course-description').value = course.description;
            document.getElementById('update-course-schedule').value = course.schedule;
            document.getElementById('update-course-max-participants').value = course.max_participants;
            document.getElementById('update-course-instructor').value = course.instructor || '';
        }
    });
}

async function deleteCourse(name) {
    if (confirm(`Are you sure you want to delete course "${name}"?`)) {
        try {
            await apiCall(`/admin/courses/${encodeURIComponent(name)}`, 'DELETE');
            showMessage('Course deleted successfully!');
            loadCourses();
        } catch (error) {
            // Error message already shown in apiCall
        }
    }
}

// Enrollment management
async function loadEnrollments() {
    try {
        const enrollments = await apiCall('/admin/enrollments');
        updateEnrollmentsTable(enrollments);
    } catch (error) {
        console.error('Error loading enrollments:', error);
    }
}

function updateEnrollmentsTable(enrollments) {
    const tbody = document.querySelector('#enrollments-table tbody');
    tbody.innerHTML = '';
    
    enrollments.forEach(enrollment => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${enrollment.student_email}</td>
            <td>${enrollment.course_name}</td>
            <td>${enrollment.enrollment_date}</td>
            <td>
                <button class="btn btn-danger" onclick="deleteEnrollment('${enrollment.student_email}', '${enrollment.course_name}')">Remove</button>
            </td>
        `;
    });
}

function updateEnrollmentSelects() {
    // This function updates the dropdowns for enrollments
    // It's called when the enrollment section is shown
}

async function handleCreateEnrollment(event) {
    event.preventDefault();
    
    const enrollment = {
        student_email: document.getElementById('enroll-student-email').value,
        course_name: document.getElementById('enroll-course-name').value,
        enrollment_date: document.getElementById('enrollment-date').value
    };
    
    try {
        await apiCall('/admin/enrollments', 'POST', enrollment);
        showMessage('Student enrolled successfully!');
        document.getElementById('enrollment-form').reset();
        document.getElementById('enrollment-date').value = new Date().toISOString().split('T')[0];
        loadEnrollments();
    } catch (error) {
        // Error message already shown in apiCall
    }
}

async function deleteEnrollment(studentEmail, courseName) {
    if (confirm(`Are you sure you want to remove ${studentEmail} from ${courseName}?`)) {
        try {
            await apiCall(`/admin/enrollments/${encodeURIComponent(studentEmail)}/${encodeURIComponent(courseName)}`, 'DELETE');
            showMessage('Enrollment removed successfully!');
            loadEnrollments();
        } catch (error) {
            // Error message already shown in apiCall
        }
    }
}

// Attendance management
async function loadAttendance() {
    try {
        const attendance = await apiCall('/admin/attendance');
        updateAttendanceTable(attendance);
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

function updateAttendanceTable(attendance) {
    const tbody = document.querySelector('#attendance-table tbody');
    tbody.innerHTML = '';
    
    attendance.forEach(record => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${record.student_email}</td>
            <td>${record.course_name}</td>
            <td>${record.date}</td>
            <td>${record.present ? 'Present' : 'Absent'}</td>
        `;
    });
}

function updateAttendanceSelects() {
    // This function updates the dropdowns for attendance
    // It's called when the attendance section is shown
}

async function handleCreateAttendance(event) {
    event.preventDefault();
    
    const attendance = {
        student_email: document.getElementById('attendance-student-email').value,
        course_name: document.getElementById('attendance-course-name').value,
        date: document.getElementById('attendance-date').value,
        present: document.getElementById('attendance-present').value === 'true'
    };
    
    try {
        await apiCall('/admin/attendance', 'POST', attendance);
        showMessage('Attendance recorded successfully!');
        document.getElementById('attendance-form').reset();
        document.getElementById('attendance-date').value = new Date().toISOString().split('T')[0];
        loadAttendance();
    } catch (error) {
        // Error message already shown in apiCall
    }
}

// Payment management
async function loadPayments() {
    try {
        const payments = await apiCall('/admin/payments');
        updatePaymentsTable(payments);
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

function updatePaymentsTable(payments) {
    const tbody = document.querySelector('#payments-table tbody');
    tbody.innerHTML = '';
    
    payments.forEach(payment => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${payment.student_email}</td>
            <td>${payment.course_name}</td>
            <td>$${payment.amount.toFixed(2)}</td>
            <td>${payment.payment_date}</td>
            <td><span class="status-${payment.status}">${payment.status.toUpperCase()}</span></td>
        `;
    });
}

function updatePaymentSelects() {
    // This function updates the dropdowns for payments
    // It's called when the payments section is shown
}

async function handleCreatePayment(event) {
    event.preventDefault();
    
    const payment = {
        student_email: document.getElementById('payment-student-email').value,
        course_name: document.getElementById('payment-course-name').value,
        amount: parseFloat(document.getElementById('payment-amount').value),
        payment_date: document.getElementById('payment-date').value,
        status: document.getElementById('payment-status').value
    };
    
    try {
        await apiCall('/admin/payments', 'POST', payment);
        showMessage('Payment recorded successfully!');
        document.getElementById('payment-form').reset();
        document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
        loadPayments();
    } catch (error) {
        // Error message already shown in apiCall
    }
}

// Update all selects with current data
function updateAllSelects() {
    updateEnrollmentSelects();
    updateAttendanceSelects();
    updatePaymentSelects();
}