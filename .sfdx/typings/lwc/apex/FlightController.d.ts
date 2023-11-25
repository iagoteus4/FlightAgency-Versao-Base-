declare module "@salesforce/apex/FlightController.getAeroportos" {
  export default function getAeroportos(): Promise<any>;
}
declare module "@salesforce/apex/FlightController.criarVoo" {
  export default function criarVoo(param: {aeroPartidaID: any, aeroChegadaID: any, distancia: any}): Promise<any>;
}
declare module "@salesforce/apex/FlightController.getAeroportoById" {
  export default function getAeroportoById(param: {aeroportoId: any}): Promise<any>;
}
declare module "@salesforce/apex/FlightController.calculateDistance" {
  export default function calculateDistance(param: {latitude1: any, longitude1: any, latitude2: any, longitude2: any}): Promise<any>;
}
