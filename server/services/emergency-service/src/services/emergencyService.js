const mongoose = require("mongoose");
const EmergencyCase = require("../models/EmergencyCase");
const Hospital = require("../models/Hospital");
const hospitals = require("../utils/hospitals");
const { calculateDistance } = require("../utils/distance");

class EmergencyService {
  async createEmergency(data) {
    return EmergencyCase.create(data);
  }

  async getAllEmergencies() {
    return EmergencyCase.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "patient",
          foreignField: "_id",
          as: "userDetail",
        },
      },
      { $addFields: { resolvedUser: { $arrayElemAt: ["$userDetail", 0] } } },
      {
        $addFields: {
          patient: {
            _id: "$patient",
            fullName: { $ifNull: ["$resolvedUser.fullName", "Anonymous Patient"] },
            email: "$resolvedUser.email",
            phone: "$resolvedUser.phone",
          },
        },
      },
      { $project: { userDetail: 0, resolvedUser: 0 } },
      { $sort: { createdAt: -1 } },
    ]);
  }

  async getEmergencyById(id) {
    const rows = await EmergencyCase.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "users",
          localField: "patient",
          foreignField: "_id",
          as: "userDetail",
        },
      },
      { $addFields: { resolvedUser: { $arrayElemAt: ["$userDetail", 0] } } },
      {
        $addFields: {
          patient: {
            _id: "$patient",
            fullName: { $ifNull: ["$resolvedUser.fullName", "Anonymous Patient"] },
            email: "$resolvedUser.email",
            phone: "$resolvedUser.phone",
          },
        },
      },
      { $project: { userDetail: 0, resolvedUser: 0 } },
    ]);
    return rows[0] || null;
  }

  async updateStatus(id, { status, responderName }) {
    const emergency = await EmergencyCase.findById(id);
    if (!emergency) throw new Error("Emergency case not found");

    const updateData = { status };
    if (responderName) updateData.responderName = responderName;

    if (status === "RESOLVED") {
      const resolvedAt = new Date();
      const diffMs = resolvedAt - emergency.triggeredAt;
      updateData.resolvedAt = resolvedAt;
      updateData.responseTime = Math.round(diffMs / 1000 / 60);
    }

    return EmergencyCase.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: false,
    });
  }

  async getNearestHospital(id) {
    const emergency = await EmergencyCase.findById(id);
    if (!emergency) throw new Error("Emergency case not found");

    const { latitude, longitude } = emergency;
    let nearest = null;
    let minDistance = Infinity;

    let hospitalList = await Hospital.find({ isActive: true }).lean();
    if (hospitalList.length === 0) hospitalList = hospitals;

    hospitalList.forEach((hospital) => {
      const dist = calculateDistance(latitude, longitude, hospital.lat, hospital.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = {
          name: hospital.name,
          lat: hospital.lat,
          lng: hospital.lng,
          address: hospital.address,
          contact: hospital.contact,
          distance: parseFloat(dist.toFixed(2)),
        };
      }
    });

    return nearest;
  }
}

module.exports = new EmergencyService();
