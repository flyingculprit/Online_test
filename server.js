const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const cors = require("cors");
const bodyParser = require("body-parser");

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

mongoose.connect("mongodb+srv://commander:LwC72c5UL8xsF5ug@cluster0.bbqab.mongodb.net/OnlineTestDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  otp: String,
  isVerified: Boolean
});

const User = mongoose.model("User", userSchema);

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL,
    pass: process.env.APP_PASS
  }
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const otp = generateOTP();

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(409).send("User already exists. Please login.");
      } else {
        existingUser.otp = otp;
        existingUser.password = password;
        await existingUser.save();

        const mailOptions = {
          from: process.env.MAIL,
          to: email,
          subject: "Your OTP - Online Test",
          text: `Your OTP for verification is: ${otp}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            return res.status(500).send("Error sending OTP");
          } else {
            return res.status(200).send("OTP resent. Please verify.");
          }
        });
      }
    } else {
      const user = new User({ name, email, password, otp, isVerified: false });
      await user.save();

      const mailOptions = {
        from: process.env.MAIL,
        to: email,
        subject: "Your OTP - Online Test",
        text: `Your OTP for verification is: ${otp}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).send("Error sending OTP");
        } else {
          return res.status(200).send("OTP sent");
        }
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Server error");
  }
});

app.post("/verify", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email, otp });

  if (user) {
    user.isVerified = true;
    await user.save();
    res.status(200).send("Verified");
  } else {
    res.status(401).send("Invalid OTP");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    if (!user.isVerified) {
      return res.status(401).send("Please verify your email before logging in");
    }

    if (user.password !== password) {
      return res.status(401).send("Incorrect password");
    }

    return res.status(200).send("Login successful");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
});

const Question = mongoose.model("Question", new mongoose.Schema({
  subject: String,
  question: String,
  options: [String],
  correctAnswer: String
}));

app.get("/questions/:subject", async (req, res) => {
  const subject = req.params.subject;
  try {
    // Case-insensitive exact match for subject
    const questions = await Question.find({ subject: new RegExp(`^${subject}$`, "i") }).limit(10);
    console.log(`Fetched ${questions.length} questions for subject: ${subject}`);
    res.json(questions);
  } catch (err) {
    console.error("Error loading questions:", err);
    res.status(500).send("Error loading questions");
  }
});

const resultSchema = new mongoose.Schema({
  email: String,
  subject: String,
  score: Number,
  total: Number,
  time: { type: Date, default: Date.now }
});

const Result = mongoose.model("Result", resultSchema);

app.post("/submit-result", async (req, res) => {
  const { email, subject, score, total } = req.body;

  try {
    const result = new Result({ email, subject, score, total });
    await result.save();

    const mailOptions = {
      from: process.env.MAIL,
      to: email,
      subject: `Your Result for ${subject} - Online Test`,
      html: `
        <h2>Test Completed - ${subject}</h2>
        <p>Thank you for taking the test on <strong>${subject}</strong>.</p>
        <p><strong>Score:</strong> ${score}/${total}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p>Keep up the good work!</p>
        <br />
        <small>– Team Cyrus Byte</small>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email send error:", error);
        return res.status(500).send("Result saved, but email failed");
      } else {
        console.log("Result email sent:", info.response);
        return res.status(200).send("Result saved and email sent");
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to save result");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
