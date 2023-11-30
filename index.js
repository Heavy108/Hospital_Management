import express from "express";
import bodyParser from "body-parser";
import mysql2 from "mysql2";
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import { Console } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 3000;
app.use(bodyParser.json());
// app.use(express.static("assets"));
app.use(express.static("Public"));
app.use(bodyParser.urlencoded({ extended: true }));

// mysql connection
const db = mysql2.createConnection({
  host: "localhost",
  port: 3308,
  user: "root",
  password: "Admin123@",
  database: "HIS",
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log("connected to Hospital Management System");
});



// Function to merge rows with the same Patient_Id
function mergeRows(data) {
  const mergedData = [];
  const patientMap = new Map();

  // Iterate through the data
  data.forEach((row) => {
    const patientId = row.Patient_Id;

    // If patientId is already in the map, update the existing entry
    if (patientMap.has(patientId)) {
      const existingEntry = patientMap.get(patientId);

      // Concatenate distinct Medicine_Name and Lab_Name if they are not null and different
      if (row.Medicine_Name && !existingEntry.Medicine_Name.includes(row.Medicine_Name)) {
        existingEntry.Medicine_Name += `, ${row.Medicine_Name}`;
      }

      if (row.Lab_Name && !existingEntry.Lab_Name.includes(row.Lab_Name)) {
        existingEntry.Lab_Name += `, ${row.Lab_Name}`;
      }

      // Concatenate Doctor_Fname and Doctor_Lname into Doctor_Name
      const doctorName = `${row.Doctor_Fname} ${row.Doctor_Lname}`;
      if (existingEntry.Doctor_Name !== doctorName) {
        existingEntry.Doctor_Name = existingEntry.Doctor_Name
          ? `${existingEntry.Doctor_Name}, ${doctorName}`
          : doctorName;
      }
    } else {
      // If patientId is not in the map, add a new entry
      const newEntry = { ...row, Doctor_Name: `${row.Doctor_Fname} ${row.Doctor_Lname}` };
      mergedData.push(newEntry);
      patientMap.set(patientId, newEntry);
    }
  });

  return mergedData;
}

// Creating routes to render the html pages



// Define routes
app.get("/", async (req, res) => {
  try {
    const fetchData = `
      SELECT
        (SELECT COUNT(*) FROM room) AS roomCount,
        (SELECT COUNT(*) FROM doctor) AS doctorsCount,
        (SELECT COUNT(*) FROM staff) AS staffCount,
        (SELECT COUNT(*) FROM patient) AS patientCount,
        (SELECT COUNT(*) FROM department) AS DeptCount
    `;

    const data = await new Promise((resolve, reject) => {
      db.query(fetchData, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0]); // Assuming the counts are in the first row of the result
        }
      });
    });

    console.log(data);

    res.render("index.ejs", { data });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }

  res.render("index.ejs");
});
app.get("/appointment", async (req, res) => {
  try {
    // Fetch data from the Appointment table
    const fetchAppointmentsQuery = "SELECT * FROM Appointment";
    const appointments = await new Promise((resolve, reject) => {
      db.query(fetchAppointmentsQuery, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    // Render the Appointment.ejs view and pass the data to it
    res.render("Appointment.ejs", { appointments });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/patient", async (req, res) => {
  try {
    // Fetch data from the hospital table
    const fetchReferQuery = "SELECT Hospital_Id FROM hospital";
    const referIdData = await new Promise((resolve, reject) => {
      db.query(fetchReferQuery, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    const referId = referIdData.map((entry) => entry.Hospital_Id);

    // Fetch data from the patient table for patientId
    const fetchPatientIdQuery = "SELECT Patient_Id FROM appointment";
    const patientIdData = await new Promise((resolve, reject) => {
      db.query(fetchPatientIdQuery, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    const patientId = patientIdData.map((entry) => entry.Patient_Id);
    console.log(patientId);

    // Render the Patient_registration.ejs view and pass the data to it
    res.render("Patient_registration.ejs", {
      referId: JSON.stringify(referId),
      patientId: JSON.stringify(patientId),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/Doctor", async (req, res) => {
  try {
    // Fetch data from the Appointment table
    const fetchDoctorDetail =
      "SELECT Doctor.*, Department.Department_Name FROM Doctor JOIN Department ON Doctor.Department_Id = Department.Department_Id";

    const Doctors = await new Promise((resolve, reject) => {
      db.query(fetchDoctorDetail, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
    // console.log(Doctors)
    // Render the Appointment.ejs view and pass the data to it
    res.render("Doctors.ejs", { Doctors });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/Staff", async (req, res) => {
  try {
    // Fetch data from the Appointment table
    const fetchStaffDetail =
      "SELECT staff.*, Department.Department_Name FROM staff JOIN Department ON staff.Department_Id = Department.Department_Id";

    const StaffDetails = await new Promise((resolve, reject) => {
      db.query(fetchStaffDetail, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
    console.log(StaffDetails);
    // Render the Appointment.ejs view and pass the data to it
    res.render("staff.ejs", { StaffDetails });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/Medicine", async (req, res) => {
  try {
    // Fetch data from the hospital table
    const fetchLabQuery = "SELECT Lab_Id FROM lab";
    const LabIdData = await new Promise((resolve, reject) => {
      db.query(fetchLabQuery, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    const LabId = LabIdData.map((entry) => entry.Lab_Id);

    // Fetch data from the patient table for patientId
    const fetchPatientIdQuery = "SELECT Patient_Id FROM appointment";
    const patientIdData = await new Promise((resolve, reject) => {
      db.query(fetchPatientIdQuery, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    const patientId = patientIdData.map((entry) => entry.Patient_Id);
    console.log(LabId);

    // Render the Patient_registration.ejs view and pass the data to it
    res.render("Medication.ejs", {
      LabId: JSON.stringify(LabId),
      patientId: JSON.stringify(patientId),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/admission", async (req, res) => {
  try {
    // Fetch data from the hospital table
    const fetchStaffQuery = "SELECT Staff_Id FROM staff";
    const StaffIdData = await new Promise((resolve, reject) => {
      db.query(fetchStaffQuery, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
    
    const StaffId = StaffIdData.map((entry) => entry.Staff_Id);

    // Fetch data from the patient table for patientId
    const fetchPatientIdQuery = "SELECT Patient_Id FROM patient";
    const patientIdData = await new Promise((resolve, reject) => {
      db.query(fetchPatientIdQuery, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    const fetchroom ="SELECt * From room";
    const roomdata = await new Promise((resolve, reject)=>{
      db.query(fetchroom ,(err,results) =>{
        if (err){
          reject(err);
        }else{
          resolve(results);
        }
      });
    });

    const patientId = patientIdData.map((entry) => entry.Patient_Id);
    // console.log(StaffId);

    // Render the Patient_registration.ejs view and pass the data to it
    res.render("Admission.ejs", {
      staffId: JSON.stringify(StaffId),
      patientId: JSON.stringify(patientId)
      ,roomdata
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/Admitted", async(req, res) => {
  const fetchpatientDetails = "SELECT P.Patient_Id, P.Patient_Fname, P.Patient_Lname, R.Room_Number, M.Medicine_Name, L.Lab_Name, D.Doctor_Fname, D.Doctor_Lname FROM patient AS P JOIN room AS R ON P.Patient_Id = R.Patient_Id LEFT JOIN medication AS M ON P.Patient_Id = M.Patient_Id LEFT JOIN labTest AS LT ON P.Patient_Id = LT.Patient_Id LEFT JOIN lab AS L ON LT.Lab_Id = L.Lab_Id LEFT JOIN appointment AS A ON P.Patient_Id = A.Patient_Id LEFT JOIN doctor AS D ON A.Doctor_Id = D.Doctor_Id;";
  const Details = await new Promise((resolve,reject)=>{
    db.query(fetchpatientDetails, (err,results)=>{
      if (err){
        reject(err);
      }else{
        resolve(results);
      }
    });
  });
  // console.log("hi is this correct")
  // console.log(Details);
  const mergedPatientDetails = mergeRows( Details );
  // console.log(mergedPatientDetails)
  res.render("Admitted_Patient.ejs", {mergedPatientDetails})
});


// Function to generate a unique patient ID
function generateUnique_ID() {
  const randomNumber = Math.floor(
    10000000000000 + Math.random() * 90000000000000
  );
  const randomDigits = randomNumber.toString().substring(0, 14);

  const Patient_Id = "P" + randomDigits;

  // Check if the generated ID is unique in the database
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT COUNT(*) AS count FROM patient WHERE Patient_Id = ?",
      [Patient_Id],
      (err, results) => {
        if (err) {
          reject(err);
        } else if (results[0].count > 0) {
          // If not unique, recursively call the function to generate a new ID
          resolve(generateUnique_ID());
        } else {
          resolve(Patient_Id);
        }
      }
    );
  });
}

app.set("view engine", "ejs");

app.post("/Appointmentsubmit", async (req, res) => {
  let dataArray;

  if (req.body.PatientType == "new") {
    const newId = await generateUnique_ID();
    // console.log(newId);

    dataArray = [
      newId,
      req.body.doctorId.trim(),
      req.body.appointmentDate,
      req.body.appointmentTime,
    ];
  } else {
    dataArray = [
      req.body.patientId.trim(),
      req.body.doctorId.trim(),
      req.body.appointmentDate,
      req.body.appointmentTime,
    ];
  }

  console.log(dataArray);

  const sql =
    "Insert into Appointment(Patient_Id, Doctor_Id, Appointment_Date, Appointment_Time) values (?,?,?,?)";
  db.query(sql, dataArray, (err, result) => {
    if (err) {
      console.log(err.message);
      res.status(500).send("Internal Server Error");
    } else {
      console.log("Data inserted into database");
      res.redirect("/appointment");
      // res.json(result);
      // res.status(200).send("Data inserted into database");
    }
  });
});

app.post("/PatientSubmit", (req, res) => {
  let dataArray2 = [
    req.body.patientId,
    req.body.patientFname,
    req.body.patientLname,
    req.body.patientAddress,
    req.body.patientPhoneNumber,
    req.body.referId,
    req.body.patientStatus,
  ];

  const sql2 =
    " Insert into patient(Patient_Id, Patient_Fname, Patient_Lname, Patient_Address, Patient_Phone_Number, Refer_Id, Patient_Status) values(?,?,?,?,?,?,?)";
  db.query(sql2, dataArray2, (err, result) => {
    if (err) {
      console.log(err.message);
      res.status(500).send("Internal Server Error");
    } else {
      console.log("Data inserted into database");
      res.redirect("/patient");
    }
  });
});

app.post("/Lab", (req, res) => {
  const fetchLab = [req.body.patientId, req.body.Lab_Test];
  const query5 = "Insert into labTest(Patient_Id, Lab_Id) values(?,?)";
  db.query(query5, fetchLab, (err, results) => {
    if (err) {
      console.log(err.message);
      res.status(500).send("Internal Server Error");
    } else {
      console.log("Data inserted into database");
      res.redirect("/Medicine");
    }
  });
});
app.post("/Medicine1", (req, res) => {
  const fetchLab = [req.body.patientId, req.body.medicine];
  const query5 =
    "Insert into medication(Patient_Id, Medicine_Name) values(?,?)";
  db.query(query5, fetchLab, (err, results) => {
    if (err) {
      console.log(err.message);
      res.status(500).send("Internal Server Error");
    } else {
      console.log("Data inserted into database");
      res.redirect("/Medicine");
    }
  });
});

app.post("/Admission", (req, res) => {
  const fetchStaff = [
    req.body.patientId,
    req.body.staffId,
    req.body.admissionDate,
  ];
  const query5 =
    "Insert into room(Patient_Id, Staff_Id, Admission_Date) values(?,?,?)";
  db.query(query5, fetchStaff, (err, results) => {
    if (err) {
      console.log(err.message);
      res.status(500).send("Internal Server Error");
    } else {
      console.log("Data inserted into database");
      res.redirect("/admission");
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
