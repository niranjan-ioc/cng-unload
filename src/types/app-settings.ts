export type RetailOutlet = { name: string; code: string }

export type PublicAppSettings = {
  retailOutlets: RetailOutlet[]
  vehicleNumbers: string[]
  routeOptions: string[]
}

export type FullAppSettings = PublicAppSettings & {
  authorizedMobileNumbers: string[]
}
