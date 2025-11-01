import mongoose from "mongoose";

const assignAssetSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assets: [
      {
        type: {
          type: String,
          required: true,
        },
        brand: {
          type: String,
          required: true,
        },
        serialNumber: {
          type: String,
          required: false,
        },
      },
    ],
    assignedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AssignAsset", assignAssetSchema);
