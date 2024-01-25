const mongoose = require('mongoose');


const SessionSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
  },
  sessionStatus: {
    type: String,
    default: 'pending'
  },
  uploadStatus: {
    type: Number,
    default: 0, 
  },
  audioName: {
    type: String,
    required: true
  },
  audioId: {
    type: String,
    required: true,
    unique: true
  },
  audioDuration: {
    type: String,
  },
  audioUrl: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now
  }  
})

module.exports = mongoose.model('session', SessionSchema)