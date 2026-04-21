const { PrismaClient } = require('@prisma/client');
const { calculateSkip } = require('../utils/pagination');

const prisma = new PrismaClient();

/**
 * Creates a new hospital
 */
async function createHospital(data) {
  const hospital = await prisma.hospital.create({
    data: {
      name: data.name,
      location: data.location,
      totalBeds: data.totalBeds,
      availableBeds: data.availableBeds,
      contactNumber: data.contactNumber
    }
  });

  return hospital;
}

/**
 * Gets paginated list of hospitals
 */
async function getHospitals(filters = {}) {
  const { page = 1, limit = 20 } = filters;

  const total = await prisma.hospital.count();

  const hospitals = await prisma.hospital.findMany({
    skip: calculateSkip(page, limit),
    take: parseInt(limit),
    include: {
      _count: {
        select: {
          patients: {
            where: {
              status: 'admitted'
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  return { hospitals, total };
}

/**
 * Gets hospitals ordered by available beds (for load balancing)
 */
async function getAvailableHospitals() {
  const hospitals = await prisma.hospital.findMany({
    where: {
      availableBeds: {
        gt: 0
      }
    },
    include: {
      _count: {
        select: {
          patients: {
            where: {
              status: 'admitted'
            }
          }
        }
      }
    },
    orderBy: {
      availableBeds: 'desc'
    }
  });

  return hospitals;
}

/**
 * Gets a single hospital by ID
 */
async function getHospitalById(id) {
  const hospital = await prisma.hospital.findUnique({
    where: { id: parseInt(id) },
    include: {
      patients: {
        include: {
          emergencyReport: true
        }
      }
    }
  });

  if (!hospital) {
    throw new Error('Hospital not found');
  }

  return hospital;
}

/**
 * Updates a hospital
 */
async function updateHospital(id, data) {
  const hospital = await prisma.hospital.update({
    where: { id: parseInt(id) },
    data: {
      name: data.name,
      location: data.location,
      totalBeds: data.totalBeds,
      availableBeds: data.availableBeds,
      contactNumber: data.contactNumber
    }
  });

  return hospital;
}

/**
 * Deletes a hospital
 */
async function deleteHospital(id) {
  await prisma.hospital.delete({
    where: { id: parseInt(id) }
  });
}

/**
 * Admits a patient to a hospital
 * Uses transaction to create patient and decrement available beds atomically
 */
async function admitPatient(hospitalId, patientData) {
  // Verify hospital exists and has available beds
  const hospital = await prisma.hospital.findUnique({
    where: { id: parseInt(hospitalId) }
  });

  if (!hospital) {
    throw new Error('Hospital not found');
  }

  if (hospital.availableBeds <= 0) {
    throw new Error('Hospital is at full capacity');
  }

  // Admit patient and decrement beds in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create patient record
    const patient = await tx.patient.create({
      data: {
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        condition: patientData.condition,
        hospitalId: parseInt(hospitalId),
        emergencyReportId: patientData.emergencyReportId || null,
        status: 'admitted'
      },
      include: {
        hospital: true,
        emergencyReport: true
      }
    });

    // Decrement available beds
    await tx.hospital.update({
      where: { id: parseInt(hospitalId) },
      data: {
        availableBeds: {
          decrement: 1
        }
      }
    });

    return patient;
  });

  return result;
}

/**
 * Discharges a patient from a hospital
 * Uses transaction to update patient status and increment available beds atomically
 */
async function dischargePatient(hospitalId, patientId) {
  // Verify patient exists and is admitted to this hospital
  const patient = await prisma.patient.findUnique({
    where: { id: parseInt(patientId) }
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  if (patient.hospitalId !== parseInt(hospitalId)) {
    throw new Error('Patient is not admitted to this hospital');
  }

  if (patient.status !== 'admitted') {
    throw new Error('Patient is not currently admitted');
  }

  // Discharge patient and increment beds in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update patient status
    const updatedPatient = await tx.patient.update({
      where: { id: parseInt(patientId) },
      data: {
        status: 'discharged',
        dischargedAt: new Date()
      },
      include: {
        hospital: true,
        emergencyReport: true
      }
    });

    // Increment available beds
    await tx.hospital.update({
      where: { id: parseInt(hospitalId) },
      data: {
        availableBeds: {
          increment: 1
        }
      }
    });

    return updatedPatient;
  });

  return result;
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
