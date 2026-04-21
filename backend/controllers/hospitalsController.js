const hospitalsService = require('../services/hospitalsService');
const { createAuditLog } = require('../utils/audit');
const { paginate } = require('../utils/pagination');

/**
 * Create hospital
 * POST /api/hospitals
 */
async function createHospital(req, res) {
  try {
    const hospital = await hospitalsService.createHospital(req.body);

    await createAuditLog(
      req.user.id,
      'CREATE',
      'Hospital',
      hospital.id,
      null,
      hospital
    );

    res.status(201).json(hospital);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create hospital', details: error.message });
  }
}

/**
 * Get all hospitals with pagination
 * GET /api/hospitals
 */
async function getHospitals(req, res) {
  try {
    const { hospitals, total } = await hospitalsService.getHospitals(req.query);
    const { page = 1, limit = 20 } = req.query;

    res.json(paginate(hospitals, total, page, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hospitals', details: error.message });
  }
}

/**
 * Get available hospitals ordered by available beds
 * GET /api/hospitals/available
 */
async function getAvailableHospitals(req, res) {
  try {
    const hospitals = await hospitalsService.getAvailableHospitals();
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available hospitals', details: error.message });
  }
}

/**
 * Get single hospital by ID
 * GET /api/hospitals/:id
 */
async function getHospitalById(req, res) {
  try {
    const hospital = await hospitalsService.getHospitalById(req.params.id);
    res.json(hospital);
  } catch (error) {
    if (error.message === 'Hospital not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch hospital', details: error.message });
  }
}

/**
 * Update hospital
 * PUT /api/hospitals/:id
 */
async function updateHospital(req, res) {
  try {
    const previousHospital = await hospitalsService.getHospitalById(req.params.id);
    const hospital = await hospitalsService.updateHospital(req.params.id, req.body);

    await createAuditLog(
      req.user.id,
      'UPDATE',
      'Hospital',
      hospital.id,
      previousHospital,
      hospital
    );

    res.json(hospital);
  } catch (error) {
    if (error.message === 'Hospital not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update hospital', details: error.message });
  }
}

/**
 * Delete hospital
 * DELETE /api/hospitals/:id
 */
async function deleteHospital(req, res) {
  try {
    const hospital = await hospitalsService.getHospitalById(req.params.id);
    await hospitalsService.deleteHospital(req.params.id);

    await createAuditLog(
      req.user.id,
      'DELETE',
      'Hospital',
      parseInt(req.params.id),
      hospital,
      null
    );

    res.json({ message: 'Hospital deleted successfully' });
  } catch (error) {
    if (error.message === 'Hospital not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to delete hospital', details: error.message });
  }
}

/**
 * Admit patient to hospital
 * POST /api/hospitals/:id/admit
 */
async function admitPatient(req, res) {
  try {
    const patient = await hospitalsService.admitPatient(req.params.id, req.body);

    await createAuditLog(
      req.user.id,
      'ADMIT',
      'Patient',
      patient.id,
      null,
      patient
    );

    res.status(201).json(patient);
  } catch (error) {
    if (error.message === 'Hospital not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Hospital is at full capacity') {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to admit patient', details: error.message });
  }
}

/**
 * Discharge patient from hospital
 * POST /api/hospitals/:id/discharge/:patientId
 */
async function dischargePatient(req, res) {
  try {
    const patient = await hospitalsService.dischargePatient(req.params.id, req.params.patientId);

    await createAuditLog(
      req.user.id,
      'DISCHARGE',
      'Patient',
      patient.id,
      { status: 'admitted' },
      patient
    );

    res.json(patient);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not admitted')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('not currently admitted')) {
      return res.status(409).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to discharge patient', details: error.message });
  }
}

module.exports = {
  createHospital,
  getHospitals,
  getAvailableHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
  admitPatient,
  dischargePatient
};
