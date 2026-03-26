const express = require('express');
const { route } = require('express/lib/application');
const router = require('express/lib/router');
const { CreateUser, handleLogin, getUser, getAccount } = require('../controllers/userController');
const auth = require('../middleware/auth');
const { createLecture, getLectures, getLectureDetail, updateLecture, deleteLecture, countExamStatusByLecture, getQuestionsByLecture, importQuestions, deleteQuestionsByLecture } = require("../controllers/lectureController");
const upload = require("../middleware/upload");
const { createExam, updateExam, getExams, getExamDetail, deleteExam, toggleExamStatus } = require('../controllers/examController');
const { createQuestion, updateQuestion, getQuestions, getQuestionDetail, deleteQuestion, createQuestionWithOptions, getQuestionDetailById, deleteQuestionById, updateQuestionWithOptions } = require('../controllers/questionController');
const { updateOption, createOption, getOptions, getOptionDetail, deleteOption } = require('../controllers/optionController');
const { createExtend, getExtends, getExtendDetail, deleteExtend, updateExtend } = require('../controllers/extendController');
const { createKnowledge, updateKnowledge, getKnowledges, getKnowledgeDetail, deleteKnowledge, getPDF } = require('../controllers/knowledgeController');
const { updateTitleVideo } = require('../controllers/videoController');
const { createAchievements, getAchievements } = require('../controllers/achievementsController');
const { createChapter, updateChapter, getChapters, deleteChapter, getChapter } = require('../controllers/chapterController');
const { getOpenChapters, getLectureDetailAndOpenlectures } = require('../controllers/frontEndController');

const routerAPI = express.Router();

// routerAPI.all('*', auth)
routerAPI.get('/', (req, res) => {
  return res.status(200).json({ message: 'Hello World API' });
})

routerAPI.post('/register', CreateUser);

routerAPI.post('/login', handleLogin);
routerAPI.get('/user', getUser);
routerAPI.get('/account', auth, getAccount);

routerAPI.post(
  "/lecture/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "videos", maxCount: 10 }
  ]),
  createLecture
);

routerAPI.get("/lectures", getLectures);

routerAPI.put(
  "/lecture/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "videos", maxCount: 10 }
  ]),
  updateLecture
);
routerAPI.get("/lecture/:id", getLectureDetail);
routerAPI.delete("/lecture/:id", deleteLecture);
routerAPI.get(
  "/lectures/:lectureId/exams/status-count",
  countExamStatusByLecture
);



// +++++++++ EXAMS ++++++++++++++
routerAPI.post('/exam', createExam);
routerAPI.put("/exam/:id", updateExam);
routerAPI.get("/exams/:lectureId", getExams);
routerAPI.get("/exam/:id", getExamDetail);
routerAPI.delete("/exams/:id", deleteExam);
routerAPI.patch("/exams/:id/status", toggleExamStatus);

// +++++++++ QUESTIONS ++++++++++++++

routerAPI.post(
  "/questions",
  upload.single("image"),
  createQuestion
);

routerAPI.put(
  "/questions/:id",
  upload.single("image"),
  updateQuestion
);
routerAPI.get("/questions", getQuestions);
routerAPI.get("/questions/:id", getQuestionDetail);
routerAPI.delete("/questions/:id", deleteQuestion);

routerAPI.post(
  "/questions/options/:lectureId",
  upload.any(),
  createQuestionWithOptions
);
routerAPI.get("/question/:questionId", getQuestionDetailById);
routerAPI.delete("/question/:id", deleteQuestionById);
routerAPI.put(
  "/question/:questionId",
  upload.any(),
  updateQuestionWithOptions
);

// +++++++++ OPTIONS ++++++++++++++
routerAPI.post(
  "/options",
  upload.single("image"),
  createOption
);

routerAPI.put(
  "/options/:id",
  upload.single("image"),
  updateOption
);

routerAPI.get("/options", getOptions);

routerAPI.get("/options/:id", getOptionDetail);

routerAPI.delete("/options/:id", deleteOption);


// +++++++++ EXTEND ++++++++++++++

routerAPI.post(
  "/extend",
   upload.single("image"),
  createExtend
);
routerAPI.put(
  "/extend/:id",
  upload.single("image"),
  updateExtend
);
routerAPI.get("/extend", getExtends);
routerAPI.get("/extend/:id", getExtendDetail);
routerAPI.delete("/extend/:id", deleteExtend);


// +++++++++ KNOWLEDGE ++++++++++++++

routerAPI.post(
  "/knowledge",
  upload.single("image"),
  createKnowledge
);

routerAPI.put(
  "/knowledge/:id",
  upload.fields([
    { name: "image", maxCount: 1 }
  ]),
  updateKnowledge
);
routerAPI.get("/knowledge", getKnowledges);
routerAPI.get("/knowledge/:id", getKnowledgeDetail);
routerAPI.delete("/knowledge/:id", deleteKnowledge);



routerAPI.get("/lectures/:lectureId/questions", getQuestionsByLecture);

routerAPI.post(
  "/lectures/:lectureId/questions/import",
  upload.single("file"),
  importQuestions
);

routerAPI.delete("/lectures/:lectureId/questions", deleteQuestionsByLecture);
routerAPI.put("/video/:id", updateTitleVideo);

// +++++++++ ACHIEVEMENTS ++++++++++++++
routerAPI.post('/achievements/:examId', createAchievements);
routerAPI.get("/achievements", getAchievements);


// +++++++++ EXTEND ++++++++++++++

routerAPI.post("/chapter", createChapter);
routerAPI.put("/chapter/:id", updateChapter);
routerAPI.get("/chapters", getChapters);
routerAPI.get("/chapter/:id", getChapter);
routerAPI.delete("/chapter/:chapterId", deleteChapter);
routerAPI.get("/chapters/open", getOpenChapters);
routerAPI.get("/lecture/open/lectures/:id", getLectureDetailAndOpenlectures);


routerAPI.get("/pdf/:id", getPDF);

module.exports = routerAPI; //export default