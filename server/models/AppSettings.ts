import mongoose, { Schema } from 'mongoose'

const retailOutletSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
  },
  { _id: false }
)

const appSettingsSchema = new Schema(
  {
    _id: { type: String, default: 'app' },
    retailOutlets: { type: [retailOutletSchema], required: true },
    vehicleNumbers: { type: [String], required: true },
    routeOptions: { type: [String], required: true },
    authorizedMobileNumbers: { type: [String], required: true },
  },
  {
    collection: 'appsettings',
    versionKey: false,
  }
)

export const AppSettings =
  mongoose.models.AppSettings ??
  mongoose.model('AppSettings', appSettingsSchema)
