const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const xlsx = require('xlsx');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Setup multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize SQLite Database
const db = new sqlite3.Database('./medicine_bank.db', (err) => {
  if (err) console.error('Database connection error:', err);
  else console.log('Connected to SQLite database');
});

// Create tables if they don't exist
const initializeDatabase = () => {
  db.serialize(() => {
    // Patients table
    db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_number TEXT UNIQUE,
        patient_name TEXT NOT NULL,
        gender TEXT,
        age INTEGER,
        address TEXT,
        phone TEXT,
        card_type TEXT,
        card_number TEXT,
        disease_description TEXT,
        dispensing_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Medicine receivers table
    db.run(`
      CREATE TABLE IF NOT EXISTS medicine_receivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        receiver_name TEXT,
        relationship TEXT,
        card_type TEXT,
        card_number TEXT,
        phone TEXT,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
      )
    `);

    // Medicines table
    db.run(`
      CREATE TABLE IF NOT EXISTS medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        medicine_number INTEGER,
        commercial_name TEXT,
        unit TEXT,
        quantity INTEGER,
        expiry_date TEXT,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
      )
    `);

    // Documents table
    db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER,
        id_card BOOLEAN DEFAULT 0,
        prescription BOOLEAN DEFAULT 0,
        examination_form BOOLEAN DEFAULT 0,
        FOREIGN KEY(patient_id) REFERENCES patients(id)
      )
    `);

    console.log('Database tables initialized');
  });
};

initializeDatabase();

// Routes

// Get all patients
app.get('/api/patients', (req, res) => {
  const query = `
    SELECT p.*, 
           GROUP_CONCAT(m.commercial_name, ', ') as medicines
    FROM patients p
    LEFT JOIN medicines m ON p.id = m.patient_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single patient
app.get('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM patients WHERE id = ?', [id], (err, patient) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!patient) {
      res.status(404).json({ error: 'المريض غير موجود' });
      return;
    }

    // Get medicines
    db.all('SELECT * FROM medicines WHERE patient_id = ?', [id], (err, medicines) => {
      // Get receiver info
      db.get('SELECT * FROM medicine_receivers WHERE patient_id = ?', [id], (err, receiver) => {
        // Get documents
        db.get('SELECT * FROM documents WHERE patient_id = ?', [id], (err, documents) => {
          patient.medicines = medicines || [];
          patient.receiver = receiver || null;
          patient.documents = documents || null;
          res.json(patient);
        });
      });
    });
  });
});

// Add new patient
app.post('/api/patients', (req, res) => {
  const {
    patient_number,
    patient_name,
    gender,
    age,
    address,
    phone,
    card_type,
    card_number,
    disease_description,
    dispensing_date,
    medicines,
    receiver,
    documents
  } = req.body;

  db.run(
    `INSERT INTO patients (patient_number, patient_name, gender, age, address, phone, card_type, card_number, disease_description, dispensing_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [patient_number, patient_name, gender, age, address, phone, card_type, card_number, disease_description, dispensing_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      const patientId = this.lastID;

      // Add medicines
      if (medicines && medicines.length > 0) {
        medicines.forEach((medicine, index) => {
          db.run(
            `INSERT INTO medicines (patient_id, medicine_number, commercial_name, unit, quantity, expiry_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [patientId, index + 1, medicine.commercial_name, medicine.unit, medicine.quantity, medicine.expiry_date]
          );
        });
      }

      // Add receiver if exists
      if (receiver) {
        db.run(
          `INSERT INTO medicine_receivers (patient_id, receiver_name, relationship, card_type, card_number, phone)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [patientId, receiver.receiver_name, receiver.relationship, receiver.card_type, receiver.card_number, receiver.phone]
        );
      }

      // Add documents if exists
      if (documents) {
        db.run(
          `INSERT INTO documents (patient_id, id_card, prescription, examination_form)
           VALUES (?, ?, ?, ?)`,
          [patientId, documents.id_card || 0, documents.prescription || 0, documents.examination_form || 0]
        );
      }

      res.status(201).json({ id: patientId, message: 'تم إضافة المريض بنجاح' });
    }
  );
});

// Update patient
app.put('/api/patients/:id', (req, res) => {
  const { id } = req.params;
  const {
    patient_name,
    gender,
    age,
    address,
    phone,
    card_type,
    card_number,
    disease_description,
    dispensing_date,
    medicines,
    receiver,
    documents
  } = req.body;

  db.run(
    `UPDATE patients 
     SET patient_name=?, gender=?, age=?, address=?, phone=?, card_type=?, card_number=?, disease_description=?, dispensing_date=?
     WHERE id=?`,
    [patient_name, gender, age, address, phone, card_type, card_number, disease_description, dispensing_date, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Delete and re-add medicines
      db.run('DELETE FROM medicines WHERE patient_id=?', [id], () => {
        if (medicines && medicines.length > 0) {
          medicines.forEach((medicine, index) => {
            db.run(
              `INSERT INTO medicines (patient_id, medicine_number, commercial_name, unit, quantity, expiry_date)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [id, index + 1, medicine.commercial_name, medicine.unit, medicine.quantity, medicine.expiry_date]
            );
          });
        }
      });

      // Update or add receiver
      db.run('DELETE FROM medicine_receivers WHERE patient_id=?', [id], () => {
        if (receiver) {
          db.run(
            `INSERT INTO medicine_receivers (patient_id, receiver_name, relationship, card_type, card_number, phone)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, receiver.receiver_name, receiver.relationship, receiver.card_type, receiver.card_number, receiver.phone]
          );
        }
      });

      // Update or add documents
      db.run('DELETE FROM documents WHERE patient_id=?', [id], () => {
        if (documents) {
          db.run(
            `INSERT INTO documents (patient_id, id_card, prescription, examination_form)
             VALUES (?, ?, ?, ?)`,
            [id, documents.id_card || 0, documents.prescription || 0, documents.examination_form || 0]
          );
        }
      });

      res.json({ message: 'تم تحديث بيانات المريض بنجاح' });
    }
  );
});

// Delete patient
app.delete('/api/patients/:id', (req, res) => {
  const { id } = req.params;

  db.serialize(() => {
    db.run('DELETE FROM medicines WHERE patient_id=?', [id]);
    db.run('DELETE FROM medicine_receivers WHERE patient_id=?', [id]);
    db.run('DELETE FROM documents WHERE patient_id=?', [id]);
    db.run('DELETE FROM patients WHERE id=?', [id], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'تم حذف المريض بنجاح' });
    });
  });
});

// Export to Excel
app.get('/api/export', (req, res) => {
  const query = `SELECT * FROM patients`;
  
  db.all(query, [], (err, patients) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const ws = xlsx.utils.json_to_sheet(patients);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'المريضى');
    
    const filePath = path.join(__dirname, 'exports', `patients_${Date.now()}.xlsx`);
    xlsx.writeFile(wb, filePath);
    
    res.download(filePath);
  });
});

// Import from Excel
app.post('/api/import', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'لم يتم تحميل الملف' });
    return;
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    let imported = 0;
    data.forEach(row => {
      db.run(
        `INSERT INTO patients (patient_number, patient_name, gender, age, address, phone, card_type, card_number, disease_description, dispensing_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.patient_number, row.patient_name, row.gender, row.age, row.address, row.phone, row.card_type, row.card_number, row.disease_description, row.dispensing_date],
        () => imported++
      );
    });

    setTimeout(() => {
      res.json({ message: `تم استيراد ${imported} سجل بنجاح` });
    }, 1000);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Statistics
app.get('/api/statistics', (req, res) => {
  db.all(`SELECT COUNT(*) as total_patients FROM patients`, [], (err, result) => {
    const totalPatients = result[0]?.total_patients || 0;

    db.all(`SELECT COUNT(*) as total_medicines FROM medicines`, [], (err, result) => {
      const totalMedicines = result[0]?.total_medicines || 0;

      res.json({
        total_patients: totalPatients,
        total_medicines: totalMedicines
      });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
