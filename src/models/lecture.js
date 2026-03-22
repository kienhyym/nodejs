const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema({
  chapterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chapter",
  },
  status: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    required: true
  },
  thumbnail: String,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Lecture", lectureSchema);