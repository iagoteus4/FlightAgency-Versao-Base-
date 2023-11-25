public with sharing class FlightController {
    /**
    * Método: getAeroportos
    * Parâmetros: Nenhum
    * Descrição: Retorna uma lista de objetos Aeroporto__c contendo Id, Nome e IATA__c (Dentre os campos selecionados, apenas o ID e o IATA são relevantes).
    */
    @AuraEnabled(cacheable=true)
    public static List<Aeroporto__c> getAeroportos() {
        return [SELECT Id, Name, IATA__c FROM Aeroporto__c];
    }
    /**
    * Método: getAeroPorto
    * Parâmetros: aeroportoId (String)
    * Descrição: Obtém informações detalhadas de um aeroporto com base no Id.
    */
    public static Aeroporto__c getAeroPorto(String aeroportoId){
        return [SELECT Id, OwnerId, IsDeleted, Name, CreatedDate, CreatedById, LastModifiedDate, LastModifiedById, SystemModstamp, IATA__c, Latitude__c, Longitude__c FROM Aeroporto__c WHERE Id = :aeroportoId LIMIT 1];
    }
    /**
    * Método: criarVoo
    * Parâmetros: aeroPartidaID (String), aeroChegadaID (String), distancia (Decimal)
    * Descrição: Cria um novo registro de voo com base nos IDs dos aeroportos de partida e chegada, e a distância calculada.
    */
    @AuraEnabled(cacheable=false)
    public static boolean criarVoo(String aeroPartidaID, String aeroChegadaID, Decimal distancia) {
        Aeroporto__c aeroPartida = getAeroporto(aeroPartidaID);
        Aeroporto__c aeroChegada = getAeroporto(aeroChegadaID);
    
        if (aeroPartida == null || aeroChegada == null) {
            throw new AuraHandledException('Aeroportos não encontrados.');
        }
    
        Voo__c novoVoo = new Voo__c(
            Aeroporto_de_partida__c = aeroPartida.Id,
            Aeroporto_de_chegada__c = aeroChegada.Id,
            distancia__c = distancia
        );
    
        return salvarDadosBanco(novoVoo);
    }
    
    /**
    * Método: salvarDadosBanco
    * Parâmetros: novoVoo (Voo__c)
    * Descrição: Método auxiliar para salvar um novo objeto Voo__c no banco de dados.
    */
    public static boolean salvarDadosBanco(Voo__c novoVoo) {
        try {
            Database.SaveResult result = Database.insert(novoVoo, false);
    
            if (result.isSuccess()) {
                return true;
            } else {
                throw new AuraHandledException('Erro ao salvar dados: ' + result.getErrors()[0].getMessage());
            }
        } catch (Exception e) {
            throw new AuraHandledException('Erro ao salvar dados: ' + e.getMessage());
        }
    }
    

    @AuraEnabled(cacheable=true)
    public static Aeroporto__c getAeroportoById(String aeroportoId) {
        return [SELECT Id, Name, IATA__c, Latitude__c, Longitude__c FROM Aeroporto__c WHERE Id = :aeroportoId LIMIT 1];
    }

    /**
    * Método: calculateDistance
    * Parâmetros: latitude1, longitude1, latitude2, longitude2 (Decimais)
    * Descrição: Calcula a distância entre dois pontos geográficos em metros usando a fórmula de Haversine.
    * Obs: Esse método foi reaproveitado do enunciado, você pode conferir o enunciado no comentário principal do componente LWC.
    */
    @AuraEnabled(cacheable=true)
    public static Decimal calculateDistance(Decimal latitude1, Decimal longitude1, Decimal latitude2,Decimal longitude2) {
        Integer earthRadius = 6371 * 1000; // in meters
        // Transform coordinates from degrees to radians
        Decimal latitudeRadians1 = latitude1 * Math.PI/180;
        Decimal latitudeRadians2 = latitude2 * Math.PI/180;
        // Latitude and longitude differences in radians
        Decimal latitudeDelta = (latitude2 - latitude1) * Math.PI/180;
        Decimal longitudeDelta = (longitude2 - longitude1) * Math.PI/180;
        Decimal a = Math.sin(latitudeDelta/2) * Math.sin(latitudeDelta/2) +
        Math.cos(latitudeRadians1) * Math.cos(latitudeRadians2) *
        Math.sin(longitudeDelta/2) * Math.sin(longitudeDelta/2);
        Decimal arc = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        Decimal distance = earthRadius * arc; // in metres
        return distance;
    }

}