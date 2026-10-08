import mongoose from 'mongoose';
const { Schema } = mongoose;

const messageSchema = new Schema({
  bootcampId:    { type: Schema.Types.ObjectId, ref: 'Bootcamp', required: true },
  studentId:     { type: Schema.Types.ObjectId, ref: 'User',    required: true },
  fromUser:      { type: Schema.Types.ObjectId, ref: 'User',    required: true },
  isAdminReply:  { type: Boolean, default: false },
  content:       { type: String,  required: true, trim: true },
  readByStudent: { type: Boolean, default: false },
  readByAdmin:   { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ bootcampId: 1, studentId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);
