public with sharing class accountOpportunityManager {

    // This fetches opportunities related to a specific Account
    @AuraEnabled(cacheable=true)
    public static List<Opportunity> getOppsByAccountList(Id accId) {
        return [
            SELECT Id, Name, StageName, Amount, CloseDate, Type 
            FROM Opportunity 
            WHERE AccountId = :accId
            ];
    }

    // This takes a list of updated opportunities and saves them
    @AuraEnabled
    public static void updateOpportunityList(List<Opportunity> opportunities) {
        // validate inputs
        if (opportunities != null  && !opportunities.isEmpty()) {
            update opportunities;
        }
    }

    // Deletes opportunities based on IDs
    @AuraEnabled
    public static void deleteOpportunityList(List<Id> oppIds){
        if(oppIds != null && !oppIds.isEmpty()) {
            delete [SELECT Id FROM Opportunity WHERE Id IN :oppIds];    
        }
    }


    // Creates new opportunities from map of fields
    @AuraEnabled
    public static Opportunity createOpportunity(Map<String, String> oppData) {
        // Validate input map
        if (oppData == null || !oppData.containsKey('Name') ||
            !oppData.containsKey('StageName') || !oppData.containsKey('CloseDate') ||
            !oppData.containsKey('AccountId')) {
            throw new AuraHandledException('Missing required opportunity fields.');
        }

        Opportunity newOpp = new Opportunity(
            Name = oppData.get('Name'),
            StageName = oppData.get('StageName'),
            CloseDate = Date.valueOf(oppData.get('CloseDate')),
            AccountId = oppData.get('AccountId')
        );

        insert newOpp;
        return newOpp;
    }

}