const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({

  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture"
  },

  videoUrl: String,

  displayName: {
    type: String,
    required: true
  },

  fileName: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Video", videoSchema);