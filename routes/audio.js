const express = require('express');
const multer = require('multer');
const uploadAudio = require('../aws/aws');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const SessionSchema = require('../model/session');

// @route     GET api/auth
// @desc      get all audio recordings
// @access    public
router.get('/', async (req, res) => {
  try {
    const session = await SessionSchema.find();

    if (session) {
      res.status(200).json({
        status: 'success',
        data: {
          sessions: session,
        },
        message: 'sessions retrived successfully',
      });
    } else {
      res.status(404).json({
        status: 'success',
        data: {
          sessions: [],
        },
        message: 'No sessions found',
      });
    }
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// @route     POST api/auth
// @desc      save session recordings
// @access    public
router.post('/', upload.single('audio'), async (req, res) => {
  try {
    const { name, title, duration } = req.body; // Access other form fields

    const audioFile = req.file; // Access the uploaded audio file

    const audioId = uuidv4();

    const io = req.io;

    const session = new SessionSchema({
      name: name,
      title: title,
      audioName: audioFile.originalname,
      audioId: audioId,
      audioDuration: duration.toString(),
      uploadStatus: 10,
    });

    const savedSession = await session.save();

    if (savedSession) {
      res.status(201).json({
        status: 'success',
        data: savedSession,
        message: 'Session saved successfully.',
      });

      await uploadAudio(audioId, audioFile.buffer, savedSession.id, io);
    } else {
      res.status(500).json({
        status: 'error',
        error: {
          message: 'Failed to save the session.',
          details: 'An error occurred while processing the request.',
        },
      });
    }
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

// @route     DELETE api/auth
// @desc      to delete a single session
// @access    public
router.delete('/', async (req, res) => {
  try {
    const { id } = req.query;

    let session = await SessionSchema.findById(id);

    if (!session) {
      return res.status(404).json({
        status: 'failed',
        message: 'No session found',
      });
    }

    const deletedSession = await SessionSchema.deleteOne({ _id: id });

    if (deletedSession) {
      res.status(200).json({
        status: 'success',
        data: deletedSession,
        message: 'Session deleted successfully',
      });
    } else {
      res.status(404).json({
        status: 'fail',
        message: 'Session not found for deletion',
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
