import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";
import path from "path";

const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(express.static("assets"));
app.use(bodyParser.urlencoded({ extended: true }));

// mysql connection
const db = mysql.createPool({
  host: "localhost",
  port: 3308,
  user: "root",
  password: "Admin123@",
  database: "HIS",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Function to check if the ID exists in the database
async function checkIfIdExists(patientId) {
  try {
    // Replace this with your actual database query logic
    const query = 'SELECT COUNT(*) AS count FROM patient WHERE Patient_Id = ?';
    const [rows] = await db.execute(query, [patientId]);

    // Check if the count is greater than 0, meaning the ID exists
    return rows[0].count > 0;
  } catch (error) {
    console.error("Error checking if ID exists:", error.message);
    throw error;
  }
}

// Function to generate a random 14-digit number
function generateRandomDigits() {
  const randomNumber = Math.floor(10000000000000 + Math.random() * 90000000000000);
  return randomNumber.toString().substring(0, 14);
}

// Function to generate a unique patient ID
async function generateUniquePatientId() {
  let newPatientId;

  // Loop until a unique ID is generated
  do {
    newPatientId = 'P' + generateRandomDigits();

    // Check if the ID already exists in the database
    var idExists = await checkIfIdExists(newPatientId);

    // If the ID exists, generate a new one
  } while (idExists);

  return newPatientId;
}

app.set("view engine", "ejs");

app.post("/Appointmentsubmit", async (req, res) => {
  let dataArray;

  if (req.body.PatientType === "new") {
    const newId = await generateUniquePatientId();
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

  const sql = "Insert into Appointment(Patient_Id, Doctor_Id, Appointment_Date, Appointment_Time) values (?,?,?,?)";

  try {
    const [result] = await db.execute(sql, dataArray);
    console.log("Data inserted into the database");
    console.log(result);
    res.status(200).send("Data inserted into the database");
  } catch (error) {
    console.error("Error inserting data into the database:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
