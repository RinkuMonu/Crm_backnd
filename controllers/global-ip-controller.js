const mongoose = require('mongoose');
const GlobalIp = require('../models/Global-Ip-model');



function isValidIpOrCidr(value) {
  if (!value || typeof value !== 'string') return false;
  const v = value.trim();

  // IPv4
  const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)$/.test(v);
  if (ipv4) return true;

  // IPv6 (compressed/expanded basic)
  const ipv6 =
    /^((?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(?:[0-9A-Fa-f]{1,4}:){1,7}:|:(?::[0-9A-Fa-f]{1,4}){1,7}|::1|::)$/.test(v);
  if (ipv6) return true;

  // CIDR v4
  const cidrV4 =
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d?\d)\/(?:[1-9]|[12]\d|3[0-2])$/.test(v);
  if (cidrV4) return true;

  // CIDR v6 (prefix 1–128)
  const cidrV6 = /^[0-9A-Fa-f:]+\/(?:[1-9]|[1-9]\d|1[01]\d|12[0-8])$/.test(v);


  
  return cidrV6;
}

class GlobalIpController {
  create = async (req, res) => {
    try {
      const { value, label, active } = req.body;
      if (!value) {
        return res.status(400).json({ success: false, message: 'value is required' });
      }
      if (!isValidIpOrCidr(value)) {
        return res.status(400).json({ success: false, message: 'Invalid IP or CIDR' });
      }

      const dup = await GlobalIp.findOne({ value: value.trim() });
      if (dup) {
        return res.status(400).json({ success: false, message: 'This IP/CIDR already exists' });
      }

      const doc = await GlobalIp.create({
        value: value.trim(),
        label: label?.trim(),
        active: active === undefined ? true : !!active,
        createdBy: req.user?._id,
        updatedBy: req.user?._id
      });

      return res.json({ success: true, data: doc });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  list = async (req, res) => {
    try {
      const data = await GlobalIp.find().sort({ createdAt: -1 });
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  update = async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid id' });
      }

      const { value, label, active } = req.body;
      const update = { updatedBy: req.user?._id };

      if (value !== undefined) {
        if (!isValidIpOrCidr(value)) {
          return res.status(400).json({ success: false, message: 'Invalid IP or CIDR' });
        }
        update.value = value.trim();

        const exists = await GlobalIp.findOne({ _id: { $ne: id }, value: update.value });
        if (exists) {
          return res.status(400).json({ success: false, message: 'This IP/CIDR already exists' });
        }
      }
      if (label !== undefined) update.label = label?.trim();
      if (active !== undefined) update.active = !!active;

      const doc = await GlobalIp.findByIdAndUpdate(id, update, { new: true });
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Record not found' });
      }

      return res.json({ success: true, data: doc });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };

  remove = async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid id' });
      }
      const doc = await GlobalIp.findByIdAndDelete(id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Record not found' });
      }
      return res.json({ success: true, message: 'Deleted' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  };
}

module.exports = new GlobalIpController();
