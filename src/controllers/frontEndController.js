const Chapter = require("../models/chapter");
const Lecture = require("../models/lecture");
const Video = require("../models/video");

const getOpenChapters = async (req, res) => {
    try {
        const chapters = await Chapter.find({ status: true })
        if (!chapters) {
            return res.json({
                data: []
            });
        }
        const resx = []
        for (const chapter of chapters) {
            const lectures = await Lecture.find({ chapterId: chapter._id,status: true  }).sort({ createdAt: -1 });
            const obj = chapter.toObject();
            obj.lectures = lectures
            resx.push(obj)
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
            const lectures = await Lecture.find({ chapterId: chapter._id,status:true }).sort({ createdAt: -1 });
            const obj = chapter.toObject();
            obj.lectures = lectures
            chapterArr.push(obj)
        }
        return res.json({
            message: "Get lecture detail success",
            data: {
                lecture,
                videos,
                lectures :chapterArr
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Get chapters failed"
        });
    }
};



module.exports = {
    getOpenChapters,
    getLectureDetailAndOpenlectures
};
