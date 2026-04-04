const Chapter = require("../models/chapter");
const Lecture = require("../models/lecture");
const Video = require("../models/video");
const Exam = require("../models/exam");

const getOpenChapters = async (req, res) => {
    try {

        const chapters = await Chapter.find({ status: true });

        const resx = [];

        for (const chapter of chapters) {

            const lectures = await Lecture.find({
                chapterId: chapter._id,
                status: true
            }).sort({ createdAt: -1 });

            const lectureWithExam = [];

            for (const lecture of lectures) {

                const experiment = await Exam.find({
                    lectureId: lecture._id,
                    status: true,
                    type: "experiment"
                });

                const exam = await Exam.find({
                    lectureId: lecture._id,
                    status: true,
                    type: "exam"
                });

                const objLecture = lecture.toObject();
                objLecture.experiment = experiment;
                objLecture.exam = exam;
                lectureWithExam.push(objLecture);
            }

            const obj = chapter.toObject();
            obj.lectures = lectureWithExam;

            resx.push(obj);
        }

        return res.json({
            data: resx
        });

    } catch (error) {

        res.status(500).json({
            message: "Get chapters failed"
        });

    }
};



const getLectureDetailAndOpenlectures = async (req, res) => {
    try {
        const lectureId = req.params.id;
        const lecture = await Lecture.findById(lectureId);

        if (!lecture) {
            return res.status(404).json({
                message: "Lecture not found"
            });
        }

        const videos = await Video.find({
            lectureId: lectureId
        });


        const chapters = await Chapter.find({ status: true })
        if (!chapters) {
            return res.json({
                data: []
            });
        }
        const chapterArr = []
        for (const chapter of chapters) {
            const lectures = await Lecture.find({ chapterId: chapter._id, status: true }).sort({ createdAt: -1 });
            const obj = chapter.toObject();
            obj.lectures = lectures
            chapterArr.push(obj)
        }
        return res.json({
            message: "Get lecture detail success",
            data: {
                lecture,
                videos,
                lectures: chapterArr
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Get chapters failed"
        });
    }
};

const getOpenChaptersNolecture = async (req, res) => {
    try {

        const chapters = await Chapter.find({ status: true });

        const resx = [];

        for (const chapter of chapters) {

            const lectures = await Lecture.find({
                chapterId: chapter._id,
                status: true
            }).sort({ createdAt: -1 });

            let lectureWithExam = [];
            for (const lecture of lectures) {

                const experiment = await Exam.find({
                    lectureId: lecture._id,
                    status: true,
                    type: "experiment"
                });
                let newExperiment = [];
                if (experiment && experiment.length > 0) {
                    newExperiment = experiment.map(item => ({
                        ...item.toObject(), // 🔥 FIX
                        titleLecture: lecture.title,
                    }));
                }
                  lectureWithExam.push(...newExperiment);
                const exam = await Exam.find({
                    lectureId: lecture._id,
                    status: true,
                    type: "exam"
                });
                let newExam = [];
                if (exam && exam.length > 0) {
                    newExam = exam.map(item => ({
                        ...item.toObject(),
                        titleLecture: lecture.title,
                    }));
                }
                lectureWithExam.push(...newExam);
            }
            const obj = chapter.toObject();
            obj.exams = lectureWithExam;
            resx.push(obj);
        }

        return res.json({
            data: resx
        });

    } catch (error) {

        res.status(500).json({
            message: "Get chapters failed"
        });

    }
};


module.exports = {
    getOpenChapters,
    getLectureDetailAndOpenlectures,
    getOpenChaptersNolecture
};
