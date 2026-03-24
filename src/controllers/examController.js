const Exam = require("../models/exam");
const Question = require("../models/question");
const Option = require("../models/option");

const createExam = async (req, res) => {

  try {

    const { lectureId, title, timeLimit, totalQuestion, type, status } = req.body;
    console.log("🚀 ~ createExam ~ lectureId:", req.body)

    if (!lectureId || !title) {
      return res.status(500).json({
        message: "lectureId and title are required"
      });
    }

    const exam = await Exam.create({
      lectureId,
      title,
      timeLimit,
      totalQuestion,
      type,
      status
    });

    return res.json({
      message: "Create exam success",
      data: exam
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Create exam failed",
      error: error.message
    });

  }
};

const updateExam = async (req, res) => {

  try {

    const examId = req.params.id;

    const { title, timeLimit, totalQuestion, status, type } = req.body;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    if (title) exam.title = title;

    exam.timeLimit = timeLimit;

    exam.totalQuestion = totalQuestion; 
    exam.status = status;
    if (type) exam.type = type;

    await exam.save();

    return res.json({
      message: "Update exam success",
      data: exam
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      message: "Update exam failed",
      error: error.message
    });

  }
};


const getExams = async (req, res) => {

  try {
    const { lectureId } = req.params
    const exams = await Exam.find({ lectureId })
      .sort({ createdAt: -1 });

    return res.json({
      message: "Get exams success",
      data: exams
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Get exams failed",
      error: error.message
    });

  }

};

const getExamDetail = async (req, res) => {

  try {

    const examId = req.params.id;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }
    return res.json({
      data: exam,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Get exam detail failed",
      error: error.message
    });

  }

};

const deleteExam = async (req, res) => {

  try {

    const examId = req.params.id;

    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({
        message: "Exam not found"
      });
    }

    const questions = await Question.find({
      examId
    });

    const questionIds = questions.map(q => q._id);

    await Option.deleteMany({
      questionId: { $in: questionIds }
    });

    await Question.deleteMany({
      examId
    });

    await Exam.findByIdAndDelete(examId);

    return res.json({
      message: "Delete exam success"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Delete exam failed",
      error: error.message
    });

  }

};
const toggleExamStatus = async (req, res) => {

  const exam = await Exam.findById(req.params.id);

  exam.status = !exam.status;

  await exam.save();

  res.json({
    message: "Update status success",
    data: exam
  });

};






module.exports = {
  createExam,
  updateExam,
  getExams,
  getExamDetail,
  deleteExam,
  toggleExamStatus,
};