// Application State
let currentPatientId = null;
let allPatients = [];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupFormHandlers();
    loadStatistics();
    loadPatients();
    setupSearch();
    setupImportExport();
});

// Navigation Setup
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-page');
            showPage(pageId);
            
            // Update active button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // Modal Close
    const modal = document.getElementById('patient-modal');
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
}

// Show Page Function
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        if (pageId === 'patients-list') {
            loadPatients();
        } else if (pageId === 'reports') {
            loadStatistics();
        }
    }
}

// Form Handlers
function setupFormHandlers() {
    const patientForm = document.getElementById('patient-form');
    const addMedicineBtn = document.getElementById('add-medicine-btn');

    addMedicineBtn.addEventListener('click', (e) => {
        e.preventDefault();
        addMedicineRow();
    });

    patientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePatient();
    });
}

// Add Medicine Row
function addMedicineRow() {
    const container = document.getElementById('medicines-container');
    const medicineCount = container.querySelectorAll('.medicine-row').length;
    
    const newRow = document.createElement('div');
    newRow.className = 'medicine-row';
    newRow.innerHTML = `
        <div class="form-group">
            <label>اسم الدواء التجاري</label>
            <input type="text" class="medicine-name" placeholder="e.g., Paracetamol">
        </div>
        <div class="form-group">
            <label>الوحدة</label>
            <input type="text" class="medicine-unit" placeholder="e.g., Tab/ml">
        </div>
        <div class="form-group">
            <label>الكمية</label>
            <input type="number" class="medicine-quantity">
        </div>
        <div class="form-group">
            <label>تاريخ الانتهاء</label>
            <input type="date" class="medicine-expiry">
        </div>
        <button type="button" class="btn btn-danger btn-small remove-medicine">حذف</button>
    `;

    const removeBtn = newRow.querySelector('.remove-medicine');
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        newRow.remove();
        updateRemoveButtonVisibility();
    });

    container.appendChild(newRow);
    updateRemoveButtonVisibility();
}

// Update Remove Button Visibility
function updateRemoveButtonVisibility() {
    const rows = document.querySelectorAll('.medicine-row');
    rows.forEach((row, index) => {
        const removeBtn = row.querySelector('.remove-medicine');
        if (rows.length <= 1) {
            removeBtn.style.display = 'none';
        } else {
            removeBtn.style.display = 'block';
        }
    });
}

// Save Patient
async function savePatient() {
    const form = document.getElementById('patient-form');
    const formData = new FormData(form);

    // Gather form data
    const patientData = {
        patient_number: formData.get('patient_number'),
        patient_name: formData.get('patient_name'),
        gender: formData.get('gender'),
        age: formData.get('age'),
        address: formData.get('address'),
        phone: formData.get('phone'),
        card_type: formData.get('card_type'),
        card_number: formData.get('card_number'),
        disease_description: formData.get('disease_description'),
        dispensing_date: formData.get('dispensing_date'),
        medicines: [],
        receiver: null,
        documents: {}
    };

    // Get medicines
    const medicineRows = document.querySelectorAll('.medicine-row');
    medicineRows.forEach((row, index) => {
        const name = row.querySelector('.medicine-name').value;
        if (name) {
            patientData.medicines.push({
                commercial_name: name,
                unit: row.querySelector('.medicine-unit').value,
                quantity: row.querySelector('.medicine-quantity').value,
                expiry_date: row.querySelector('.medicine-expiry').value
            });
        }
    });

    // Get receiver info if provided
    const receiverName = formData.get('receiver_name');
    if (receiverName) {
        patientData.receiver = {
            receiver_name: receiverName,
            relationship: formData.get('receiver_relationship'),
            card_type: formData.get('receiver_card_type'),
            card_number: formData.get('receiver_card_number'),
            phone: formData.get('receiver_phone')
        };
    }

    // Get documents
    patientData.documents = {
        id_card: formData.get('id_card') ? 1 : 0,
        prescription: formData.get('prescription') ? 1 : 0,
        examination_form: formData.get('examination_form') ? 1 : 0
    };

    try {
        const response = await fetch('/api/patients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientData)
        });

        if (response.ok) {
            const result = await response.json();
            alert('تم حفظ بيانات المريض بنجاح');
            form.reset();
            
            // Reset medicines to one row
            document.getElementById('medicines-container').innerHTML = `
                <div class="medicine-row">
                    <div class="form-group">
                        <label>اسم الدواء التجاري</label>
                        <input type="text" class="medicine-name" placeholder="e.g., Paracetamol">
                    </div>
                    <div class="form-group">
                        <label>الوحدة</label>
                        <input type="text" class="medicine-unit" placeholder="e.g., Tab/ml">
                    </div>
                    <div class="form-group">
                        <label>الكمية</label>
                        <input type="number" class="medicine-quantity">
                    </div>
                    <div class="form-group">
                        <label>تاريخ الانتهاء</label>
                        <input type="date" class="medicine-expiry">
                    </div>
                    <button type="button" class="btn btn-danger btn-small remove-medicine" style="display:none;">حذف</button>
                </div>
            `;
            
            loadPatients();
            loadStatistics();
        } else {
            alert('حدث خطأ في حفظ البيانات');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('خطأ في الاتصال بالخادم');
    }
}

// Load Patients
async function loadPatients() {
    try {
        const response = await fetch('/api/patients');
        allPatients = await response.json();
        displayPatients(allPatients);
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

// Display Patients
function displayPatients(patients) {
    const tbody = document.getElementById('patients-tbody');
    tbody.innerHTML = '';

    if (patients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">لا توجد بيانات</td></tr>';
        return;
    }

    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${patient.patient_number || '-'}</td>
            <td>${patient.patient_name || '-'}</td>
            <td>${patient.gender || '-'}</td>
            <td>${patient.age || '-'}</td>
            <td>${patient.phone || '-'}</td>
            <td>${patient.dispensing_date || '-'}</td>
            <td>${patient.medicines ? patient.medicines.split(', ').length : 0}</td>
            <td>
                <div class="action-buttons">
                    <button class="view-btn" onclick="viewPatient(${patient.id})">عرض</button>
                    <button class="edit-btn" onclick="editPatient(${patient.id})">تعديل</button>
                    <button class="delete-btn" onclick="deletePatient(${patient.id})">حذف</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// View Patient
async function viewPatient(patientId) {
    try {
        const response = await fetch(`/api/patients/${patientId}`);
        const patient = await response.json();
        
        const modal = document.getElementById('patient-modal');
        const details = document.getElementById('patient-details');

        let medicinesHtml = '<h4>الأدوية:</h4>';
        if (patient.medicines && patient.medicines.length > 0) {
            medicinesHtml += '<ul>';
            patient.medicines.forEach((med, i) => {
                medicinesHtml += `<li>${med.commercial_name} - ${med.unit} - الكمية: ${med.quantity}</li>`;
            });
            medicinesHtml += '</ul>';
        }

        details.innerHTML = `
            <h2>${patient.patient_name}</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
                <div>
                    <h4>البيانات الشخصية</h4>
                    <p><strong>رقم المريض:</strong> ${patient.patient_number}</p>
                    <p><strong>الجنس:</strong> ${patient.gender}</p>
                    <p><strong>العمر:</strong> ${patient.age}</p>
                    <p><strong>العنوان:</strong> ${patient.address}</p>
                    <p><strong>رقم التواصل:</strong> ${patient.phone}</p>
                    <p><strong>نوع البطاقة:</strong> ${patient.card_type}</p>
                    <p><strong>رقم البطاقة:</strong> ${patient.card_number}</p>
                </div>
                <div>
                    <h4>معلومات طبية</h4>
                    <p><strong>وصف المرض:</strong> ${patient.disease_description}</p>
                    <p><strong>تاريخ الصرف:</strong> ${patient.dispensing_date}</p>
                </div>
            </div>
            ${medicinesHtml}
        `;

        modal.classList.add('show');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Edit Patient
async function editPatient(patientId) {
    // This would load patient data into the form for editing
    // For now, we'll show an alert
    alert('ميزة التعديل قيد التطوير');
}

// Delete Patient
async function deletePatient(patientId) {
    if (confirm('هل تريد فعلاً حذف هذا المريض؟')) {
        try {
            const response = await fetch(`/api/patients/${patientId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('تم حذف المريض بنجاح');
                loadPatients();
                loadStatistics();
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

// Load Statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/statistics');
        const stats = await response.json();

        document.getElementById('total-patients').textContent = stats.total_patients;
        document.getElementById('total-medicines').textContent = stats.total_medicines;
        document.getElementById('report-patients').textContent = stats.total_patients;
        document.getElementById('report-medicines').textContent = stats.total_medicines;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Setup Search
function setupSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Perform Search
function performSearch() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const resultsContainer = document.getElementById('search-results');

    if (!searchTerm) {
        resultsContainer.innerHTML = '<p>الرجاء إدخال كلمة البحث</p>';
        return;
    }

    const results = allPatients.filter(patient =>
        patient.patient_name.toLowerCase().includes(searchTerm) ||
        patient.patient_number.toLowerCase().includes(searchTerm) ||
        (patient.card_number && patient.card_number.includes(searchTerm))
    );

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>لم يتم العثور على نتائج</p>';
        return;
    }

    let html = '<table class="patients-table"><thead><tr><th>رقم المريض</th><th>الاسم</th><th>التواصل</th><th>الإجراءات</th></tr></thead><tbody>';

    results.forEach(patient => {
        html += `
            <tr>
                <td>${patient.patient_number}</td>
                <td>${patient.patient_name}</td>
                <td>${patient.phone}</td>
                <td>
                    <button class="view-btn" onclick="viewPatient(${patient.id})">عرض</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    resultsContainer.innerHTML = html;
}

// Setup Import/Export
function setupImportExport() {
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');

    exportBtn.addEventListener('click', exportData);
    importBtn.addEventListener('click', importData);
}

// Export Data
async function exportData() {
    try {
        const response = await fetch('/api/export');
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patients_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting:', error);
        alert('خطأ في تصدير البيانات');
    }
}

// Import Data
async function importData() {
    const fileInput = document.getElementById('import-file');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('الرجاء اختيار ملف');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const response = await fetch('/api/import', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            alert(result.message);
            loadPatients();
            loadStatistics();
            fileInput.value = '';
        }
    } catch (error) {
        console.error('Error importing:', error);
        alert('خطأ في استيراد البيانات');
    }
}

// Print functionality
function printPatientData() {
    window.print();
}
