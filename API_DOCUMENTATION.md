# API Documentation - توثيق واجهة البرمجة

## 📌 معلومات الخادم

**الخادم الأساسي:** `http://localhost:3000`  
**الإصدار:** 1.0.0  
**اللغة:** عربي + إنجليزي

---

## 🔌 نقاط النهاية (Endpoints)

### 1️⃣ المرضى (Patients)

#### الحصول على جميع المرضى
```http
GET /api/patients
```

**الاستجابة:**
```json
[
  {
    "id": 1,
    "patient_number": "001",
    "patient_name": "أحمد محمد",
    "gender": "ذكر",
    "age": 35,
    "address": "صنعاء",
    "phone": "967771234567",
    "card_type": "بطاقة رقم",
    "card_number": "123456789",
    "disease_description": "ارتفاع ضغط الدم",
    "dispensing_date": "2026-06-19",
    "medicines": "Lisinopril, Atorvastatin",
    "created_at": "2026-06-19T10:30:00Z"
  }
]
```

---

#### الحصول على مريض محدد
```http
GET /api/patients/:id
```

**المتغيرات:**
- `id` - معرف المريض (رقم صحيح)

**الاستجابة:**
```json
{
  "id": 1,
  "patient_number": "001",
  "patient_name": "أحمد محمد",
  "gender": "ذكر",
  "age": 35,
  "address": "صنعاء",
  "phone": "967771234567",
  "card_type": "بطاقة رقم",
  "card_number": "123456789",
  "disease_description": "ارتفاع ضغط الدم",
  "dispensing_date": "2026-06-19",
  "medicines": [
    {
      "id": 1,
      "commercial_name": "Lisinopril",
      "unit": "Tab",
      "quantity": 30,
      "expiry_date": "2027-06-19"
    },
    {
      "id": 2,
      "commercial_name": "Atorvastatin",
      "unit": "Tab",
      "quantity": 60,
      "expiry_date": "2027-12-19"
    }
  ],
  "receiver": {
    "id": 1,
    "receiver_name": "فاطمة محمد",
    "relationship": "زوجة",
    "card_type": "بطاقة رقم",
    "card_number": "987654321",
    "phone": "967779876543"
  },
  "documents": {
    "id": 1,
    "id_card": 1,
    "prescription": 1,
    "examination_form": 0
  }
}
```

---

#### إضافة مريض جديد
```http
POST /api/patients
Content-Type: application/json
```

**البيانات المطلوبة:**
```json
{
  "patient_number": "002",
  "patient_name": "فاطمة علي",
  "gender": "أنثى",
  "age": 28,
  "address": "عدن",
  "phone": "967771112222",
  "card_type": "بطاقة رقم",
  "card_number": "111222333",
  "disease_description": "سكري من النوع الثاني",
  "dispensing_date": "2026-06-19",
  "medicines": [
    {
      "commercial_name": "Metformin",
      "unit": "Tab",
      "quantity": 120,
      "expiry_date": "2027-06-19"
    }
  ],
  "receiver": {
    "receiver_name": "علي محمد",
    "relationship": "ابن",
    "card_type": "بطاقة رقم",
    "card_number": "444555666",
    "phone": "967775555666"
  },
  "documents": {
    "id_card": 1,
    "prescription": 1,
    "examination_form": 1
  }
}
```

**الاستجابة:**
```json
{
  "id": 2,
  "message": "تم إضافة المريض بنجاح"
}
```

---

#### تحديث بيانات المريض
```http
PUT /api/patients/:id
Content-Type: application/json
```

**المتغيرات:**
- `id` - معرف المريض

**البيانات:**
```json
{
  "patient_name": "فاطمة علي محمود",
  "age": 29,
  "medicines": [
    {
      "commercial_name": "Metformin",
      "unit": "Tab",
      "quantity": 90,
      "expiry_date": "2027-06-19"
    }
  ]
}
```

**الاستجابة:**
```json
{
  "message": "تم تحديث بيانات المريض بنجاح"
}
```

---

#### حذف المريض
```http
DELETE /api/patients/:id
```

**الاستجابة:**
```json
{
  "message": "تم حذف المريض بنجاح"
}
```

---

### 2️⃣ الإحصائيات (Statistics)

#### الحصول على الإحصائيات
```http
GET /api/statistics
```

**الاستجابة:**
```json
{
  "total_patients": 150,
  "total_medicines": 425
}
```

---

### 3️⃣ الاستيراد والتصدير

#### تصدير البيانات إلى Excel
```http
GET /api/export
```

**الاستجابة:**
- ملف Excel يتم تحميله تلقائياً
- الاسم: `patients_[timestamp].xlsx`

---

#### استيراد البيانات من Excel
```http
POST /api/import
Content-Type: multipart/form-data
```

**البيانات:**
- `file` - ملف Excel

**الاستجابة:**
```json
{
  "message": "تم استيراد 25 سجل بنجاح"
}
```

---

## 🔐 رموز الخطأ (HTTP Status Codes)

| الرمز | المعنى | الحل |
|------|-------|-----|
| 200 | نجاح العملية | لا توجد مشكلة |
| 201 | تم إنشاء المورد | تم حفظ البيانات بنجاح |
| 400 | طلب خاطئ | تحقق من صيغة البيانات |
| 404 | المورد غير موجود | تحقق من معرف المريض |
| 500 | خطأ في الخادم | جرب من جديد لاحقاً |

---

## 📝 أمثلة الاستخدام

### مثال 1: إضافة مريض باستخدام curl

```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "patient_number": "003",
    "patient_name": "محمد احمد",
    "gender": "ذكر",
    "age": 45,
    "address": "تعز",
    "phone": "967777778888",
    "card_type": "بطاقة رقم",
    "card_number": "555666777",
    "disease_description": "أمراض القلب",
    "dispensing_date": "2026-06-19",
    "medicines": [
      {
        "commercial_name": "Aspirin",
        "unit": "Tab",
        "quantity": 100,
        "expiry_date": "2027-06-19"
      }
    ]
  }'
```

### مثال 2: الحصول على جميع المرضى

```bash
curl http://localhost:3000/api/patients
```

### مثال 3: حذف مريض

```bash
curl -X DELETE http://localhost:3000/api/patients/1
```

---

## 🛠️ المتطلبات

- **Node.js** 12+
- **SQLite3**
- **Express.js**

---

## 📋 صيغ البيانات المدعومة

### نوع البطاقة:
- بطاقة رقم
- جواز سفر
- رخصة قيادة

### صيغ الأدوية:
- **Unit:** Tab (أقراص)، ml (ملي لتر)، Capsule (كبسولة)
- **Quantity:** رقم صحيح موجب

### صيغ التاريخ:
- ISO 8601: `YYYY-MM-DD`
- مثال: `2026-06-19`

---

## ⚠️ ملاحظات مهمة

1. **جميع البيانات محلية** - لا تُرسل خارج الجهاز
2. **بدون تشفير** - للاستخدام الداخلي فقط
3. **لا توجد مصادقة** - في هذه النسخة
4. **قاعدة البيانات SQLite** - محفوظة محلياً

---

## 🔄 معدل الطلبات

لا يوجد حد أقصى للطلبات (في هذه النسخة)

---

**آخر تحديث:** 2026-06-19  
**الإصدار:** 1.0.0
