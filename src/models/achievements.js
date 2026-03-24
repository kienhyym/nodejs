const mongoose = require("mongoose");

const achievementsSchema = new mongoose.Schema({
 
   examId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: "exam"
   },
 
  name: String,

  class: String,

  result: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Achievements", achievementsSchema);