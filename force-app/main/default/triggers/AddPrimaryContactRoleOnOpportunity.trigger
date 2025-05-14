trigger AddPrimaryContactRoleOnOpportunity on Opportunity (after insert) {
    Set<Id> accIds = new Set<Id>();
    Set<Id> oppIds = new Set<Id>();
    for (Opportunity opp : Trigger.new) {
        if (opp.AccountId != null) {
            accIds.add(opp.AccountId);
            oppIds.add(opp.Id);
        }
    }

    // Query primary contacts for those Accounts
    Map<Id, Contact> accountPrimaryContact = new Map<Id, Contact>();
    for (Contact con : [
        SELECT Id, AccountId 
        FROM Contact 
        WHERE Primary_Contact__c = TRUE AND AccountId IN :accIds
    ]) {
        accountPrimaryContact.put(con.AccountId, con);
    }

    // Query existing OpportunityContactRoles (by Contact AND Opportunity)
    Map<Id, Set<Id>> oppToContactIds = new Map<Id, Set<Id>>();
    for (OpportunityContactRole ocr : [
        SELECT OpportunityId, ContactId 
        FROM OpportunityContactRole 
        WHERE OpportunityId IN :oppIds
    ]) {
        if (!oppToContactIds.containsKey(ocr.OpportunityId)) {
            oppToContactIds.put(ocr.OpportunityId, new Set<Id>());
        }
        oppToContactIds.get(ocr.OpportunityId).add(ocr.ContactId);
    }

    List<OpportunityContactRole> contactRolesToInsert = new List<OpportunityContactRole>();

    for (Opportunity opp : Trigger.new) {
        if (accountPrimaryContact.containsKey(opp.AccountId)) {
            Contact primaryContact = accountPrimaryContact.get(opp.AccountId);
            Set<Id> existingContacts = oppToContactIds.get(opp.Id);

            // Only insert if primary contact is not already in existing OCRs
            if (existingContacts == null || !existingContacts.contains(primaryContact.Id)) {
                contactRolesToInsert.add(new OpportunityContactRole(
                    OpportunityId = opp.Id,
                    ContactId = primaryContact.Id,
                    IsPrimary = true
                ));
            }
        }
    }

    if (!contactRolesToInsert.isEmpty()) {
        try {
            insert contactRolesToInsert;
        } catch (DmlException e) {
            System.debug('Error inserting OpportunityContactRoles: ' + e.getMessage());
        }
    }
}
