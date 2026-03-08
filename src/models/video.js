const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({

  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecture"
  },

  videoUrl: String,

  fileName: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Video", videoSchema);