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
}