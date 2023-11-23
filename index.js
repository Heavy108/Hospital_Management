import express from "express";
import bodyParser from "body-parser";
import mysql2 from "mysql2";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from "path";

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

// Creating routes to render the html pages

// Define routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Public", "index.html"));
});
app.get("/appointment", (req, res) => {
  res.sendFile(path.join(__dirname, "Public", "Appointment.html"));
});
app.get("/patient", (req, res) => {
  res.sendFile(path.join(__dirname, "Public", "Patient.html"));
});

// app.get("/header", (req, res) => {
//   res.sendFile(path.join(__dirname, "Public", "header.html"));
// });



// Function to generate a unique patient ID
function generateUnique_ID() {
  const randomNumber = Math.floor(10000000000000 + Math.random() * 90000000000000);
  const randomDigits = randomNumber.toString().substring(0, 14);

  const Patient_Id = 'P' + randomDigits;

  // Check if the generated ID is unique in the database
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT COUNT(*) AS count FROM patient WHERE Patient_Id = ?',
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
    console.log(newId);

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
      res.json(result);
      // res.status(200).send("Data inserted into database");
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
