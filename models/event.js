const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
  },
  type: String,
  startDate: {
    type: Date,
    required: true,
  },
  endDate: Date,
  time: String,
  city: {
    type: String,
    required: true,
  },
  neighborhood: String,
  country: String,
  description: {
    type: String,
    required: true,
    minlength: 10,
  },
  price: {
    type: Number,
    default: 0,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  qrOption: {
    type: Boolean,
    default: false,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

eventSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model("Event", eventSchema);
