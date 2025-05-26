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
    String triplang;
    String hindipalakailangan;
    // Deletes opportunities based on IDs
    @AuraEnabled
    public static void deleteOpportunityList(List<Id> oppIds){
        if(oppIds != null && !oppIds.isEmpty()) {
            delete [SELECT Id FROM Opportunity WHERE Id IN :oppIds];    
        }
    }

    // New version
    // Creates new opportunities
    @AuraEnabled
    public static List<Opportunity> createOpportunityList(String newOppJSONListData) {

        List<Opportunity> oppList = (List<Opportunity>) JSON.deserialize(newOppJSONListData, List<Opportunity>.class);

        insert oppList;
        return oppList;
    }
}