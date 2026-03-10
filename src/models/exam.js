const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({

  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture"
  },

  title: String,

  timeLimit: Number,

  totalQuestion: Number,

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