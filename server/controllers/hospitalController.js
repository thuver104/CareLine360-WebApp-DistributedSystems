const Hospital = require('../models/Hospital');

const getAllHospitals = async (req, res, next) => {
    try {
        const hospitals = await Hospital.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: hospitals });
    } catch (error) {
        next(error);
    }
};

const createHospital = async (req, res, next) => {
    try {
        const { name, address, contact, lat, lng } = req.body;

        if (!name || isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ success: false, message: 'Name, Latitude and Longitude are required' });
        }

        const hospital = await Hospital.create({
            name,
            address,
            contact,
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        });

        res.status(201).json({ success: true, data: hospital });
    } catch (error) {
        next(error);
    }
};

const deleteHospital = async (req, res, next) => {
    try {
        const hospital = await Hospital.findByIdAndDelete(req.params.id);
        if (!hospital) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }
        res.status(200).json({ success: true, message: 'Hospital removed successfully' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllHospitals,
    createHospital,
    deleteHospital
};
