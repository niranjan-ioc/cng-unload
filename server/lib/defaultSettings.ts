export type RetailOutlet = { name: string; code: string }

export type FullAppSettings = {
  retailOutlets: RetailOutlet[]
  vehicleNumbers: string[]
  routeOptions: string[]
  authorizedMobileNumbers: string[]
}

export const DEFAULT_APP_SETTINGS: FullAppSettings = {
  retailOutlets: [
    { name: 'COCO Kolaghat', code: '384052' },
    { name: 'COCO Bhavanipur', code: '382893' },
    { name: 'Tara Maa Service Station', code: '241902' },
    { name: 'Amarnath Filling Station', code: '191064' },
    { name: 'Central Trading Company', code: '138615' },
    { name: 'Bijoy Service Station', code: '264050' },
    { name: 'Bhaitgarh Nachinda SKUS', code: '354571' },
    { name: 'HPCL Mogra', code: '000000' },
  ],
  vehicleNumbers: [
    'WB 39 C 6013',
    'WB 23 M 2065',
    'WB 23 M 2079',
    'WB 23 M 2089',
    'WB 39 G 6164',
  ],
  routeOptions: [
    'HPCL Mogra',
    'IOCL depot / mother station',
    'Another retail outlet',
    'Workshop / maintenance',
  ],
  authorizedMobileNumbers: ['9876543210', '9123456789', '9000000001'],
}
