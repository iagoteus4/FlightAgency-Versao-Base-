trigger AeroportoTrigger on Aeroporto__c (before insert, before update) {
    for (Aeroporto__c airport : Trigger.new) {
        if (!String.isBlank(airport.Name)) {
            if (airport.Name.length() >= 3) {
                airport.Name = airport.Name.toUpperCase();

                if (Trigger.isUpdate && airport.Name != Trigger.oldMap.get(airport.Id).Name) {
                    if(airport.IATA__c == Trigger.oldMap.get(airport.Id).IATA__c){
                        String novoCodigoIATA = airport.Name.substring(0, 3).toUpperCase();
                        airport.IATA__c = novoCodigoIATA;
                    }
                }

                if (String.isBlank(airport.IATA__c)) {
                    String codigoIATA = airport.Name.substring(0, 3).toUpperCase();
                    airport.IATA__c = codigoIATA;
                } else {
                    airport.IATA__c = airport.IATA__c.toUpperCase();
                }

            } else {
                airport.addError('Digite um nome com três ou mais caracteres');
            }
        }
    }
}
