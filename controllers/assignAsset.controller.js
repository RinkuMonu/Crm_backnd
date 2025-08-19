import AssignAssestModal from "../models/Assign-Assest.modal.js";

// Create Asset Assignment
export const assignAsset = async (req, res) => {
  try {
    const { employeeId, assets } = req.body;

    const updatedAssign = await AssignAssestModal.findOneAndUpdate(
      { employeeId },
      { $set: { assets } },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Asset assigned/updated successfully",
      data: updatedAssign,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get all assigned assets with employee name
export const getAssignedAssets = async (req, res) => {
  try {
    const assigned = await AssignAssestModal.find()
      .populate("employeeId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: assigned,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Assigned Asset by ID
export const getAssignedAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await AssignAssestModal.findById(id)
      .populate("employeeId", "name email")
      .sort({ createdAt: -1 });
    if (!asset) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// Update Assigned Asset
export const updateAssignedAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await AssignAssestModal.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }
    res.status(200).json({
      success: true,
      message: "Asset updated successfully",
      data: updated,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};

// Delete Assigned Asset
export const deleteAssignedAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AssignAssestModal.findByIdAndDelete(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Asset deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
