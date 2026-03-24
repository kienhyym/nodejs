const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({

  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture"
  },

  title: String,   //ví dụ: Đề thi 1, Đề thi 2, đề ôn tập

  timeLimit: Number,

  totalQuestion: Number,

  type: {
    type: String,
    enum: ["experiment", "exam"],
    default: "experiment"
  },

  status: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Exam", examSchema);