import mongoose, { Schema } from 'mongoose'

const unloadSubmissionSchema = new Schema(
  {
    submittedByMobile: { type: String, required: true, trim: true },
    retailOutletCode: { type: String, required: true, trim: true },
    vehicleNo: { type: String, required: true, trim: true },
    hpclMograLoadingKg: { type: String, required: true, trim: true },
    vehicleComingFrom: { type: String, required: true, trim: true },
    cascadePressureBefore: { type: String, required: true, trim: true },
    initialReadingKg: { type: String, required: true, trim: true },
    finalReadingKg: { type: String, required: true, trim: true },
    cascadePressureAfter: { type: String, required: true, trim: true },
    destinationAfter: { type: String, required: true, trim: true },
    operatorName: { type: String, required: true, trim: true },
    dateOfVehicleOut: { type: String, required: true, trim: true },
    timeOfVehicleOut: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

unloadSubmissionSchema.index({ createdAt: -1 })
unloadSubmissionSchema.index({ submittedByMobile: 1, createdAt: -1 })

export const UnloadSubmission =
  mongoose.models.UnloadSubmission ??
  mongoose.model('UnloadSubmission', unloadSubmissionSchema)
