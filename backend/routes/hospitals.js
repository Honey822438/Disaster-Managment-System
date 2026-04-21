const express = require('express');
const router = express.Router();
const hospitalsController = require('../controllers/hospitalsController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.use(authenticateToken);

// Read — all authenticated users
router.get('/', hospitalsController.getHospitals);
router.get('/available', hospitalsController.getAvailableHospitals);
router.get('/:id', hospitalsController.getHospitalById);

// Create/Update/Delete — admin and operator
router.post('/', requireRole(['admin', 'operator']), hospitalsController.createHospital);
router.put('/:id', requireRole(['admin', 'operator']), hospitalsController.updateHospital);
router.delete('/:id', requireRole(['admin', 'operator']), hospitalsController.deleteHospital);

// Admit/Discharge — admin, operator, AND field_officer (hospital portal users)
router.post('/:id/admit', requireRole(['admin', 'operator', 'field_officer']), hospitalsController.admitPatient);
router.post('/:id/discharge/:patientId', requireRole(['admin', 'operator', 'field_officer']), hospitalsController.dischargePatient);

module.exports = router;
