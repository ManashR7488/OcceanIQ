import mongoose from "mongoose";

const userDatasetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["csv", "json", "xml", "netcdf"],
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    documentId: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^[a-zA-Z0-9_]+$/.test(v);
        },
        message: "documentId must contain only alphanumeric characters and underscores",
      },
    },
    fileSize: {
      type: Number,
    },
    metadata: {
      columns: [String],
      rowCount: Number,
      summary: String,
      fileFormat: String,
      chunksStored: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for common query pattern (userId + uploadDate DESC)
userDatasetSchema.index({ userId: 1, uploadDate: -1 });

// Virtual for formatted file size
userDatasetSchema.methods.getFormattedSize = function () {
  if (!this.fileSize) return "Unknown";
  const mb = this.fileSize / (1024 * 1024);
  if (mb < 1) {
    return `${(this.fileSize / 1024).toFixed(2)} KB`;
  }
  return `${mb.toFixed(2)} MB`;
};

// Ensure id field is included in JSON responses
userDatasetSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const UserDataset = mongoose.model("UserDataset", userDatasetSchema);

export default UserDataset;
