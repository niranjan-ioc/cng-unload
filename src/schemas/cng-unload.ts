import { z } from 'zod'

export const cngUnloadFormSchema = z.object({
  retailOutletCode: z.string().min(1, 'Choose an outlet.'),
  vehicleNo: z.string().min(1, 'Choose a vehicle.'),
  hpclMograLoadingKg: z.string().min(1, 'Required.'),
  vehicleComingFrom: z.string().min(1, 'Choose an option.'),
  cascadePressureBefore: z.string().min(1, 'Required.'),
  initialReadingKg: z.string().min(1, 'Required.'),
  finalReadingKg: z.string().min(1, 'Required.'),
  cascadePressureAfter: z.string().min(1, 'Required.'),
  destinationAfter: z.string().min(1, 'Choose an option.'),
  operatorName: z.string().min(1, 'Required.'),
  dateOfVehicleOut: z.string().min(1, 'Pick a date.'),
  timeOfVehicleOut: z.string().min(1, 'Pick a time.'),
})

export type CngUnloadFormValues = z.infer<typeof cngUnloadFormSchema>

export const cngUnloadDefaultValues: CngUnloadFormValues = {
  retailOutletCode: '',
  vehicleNo: '',
  hpclMograLoadingKg: '',
  vehicleComingFrom: '',
  cascadePressureBefore: '',
  initialReadingKg: '',
  finalReadingKg: '',
  cascadePressureAfter: '',
  destinationAfter: '',
  operatorName: '',
  dateOfVehicleOut: '',
  timeOfVehicleOut: '',
}
